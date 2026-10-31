import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { api } from '@/lib/axios';
import {
  PeopleRankingItem,
  PeopleRankingResponse,
  PeopleSortField,
  PeriodFilter,
  StatRankingItem,
} from './types';
import { formatSimpleDuration } from './StatsKpiCards';
import {
  Trophy,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  Clapperboard,
  Users,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface StatsTalentRankingTableProps {
  type: 'cast' | 'directors';
  period?: PeriodFilter;
  overallAverageRating?: number;
  initialItems?: StatRankingItem[];
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function TalentAvatar({
  name,
  profilePath,
  isCast,
  size = 'md',
}: {
  name: string;
  profilePath?: string | null;
  isCast: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hasError, setHasError] = useState(false);

  const dimensionClasses =
    size === 'sm'
      ? 'w-9 h-9 text-xs'
      : size === 'lg'
      ? 'w-12 h-12 text-sm'
      : 'w-10 h-10 text-xs';

  if (profilePath && !hasError) {
    return (
      <img
        src={`https://image.tmdb.org/t/p/w185${profilePath}`}
        alt={name}
        onError={() => setHasError(true)}
        className={`${dimensionClasses} rounded-full object-cover shrink-0 border border-zinc-700/60 shadow-sm transition-transform group-hover:scale-105`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${dimensionClasses} rounded-full bg-gradient-to-br flex items-center justify-center font-bold shrink-0 border shadow-sm transition-transform group-hover:scale-105 ${
        isCast
          ? 'from-indigo-600/30 to-purple-600/30 border-indigo-500/30 text-indigo-200'
          : 'from-emerald-600/30 to-teal-600/30 border-emerald-500/30 text-emerald-200'
      }`}
    >
      {getInitials(name)}
    </div>
  );
}

const PEOPLE_RANKING_CACHE_TTL_MS = 5 * 60 * 1000;
const peopleRankingCache = new Map<string, { data: PeopleRankingResponse; ts: number }>();

export function StatsTalentRankingTable({
  type,
  period = 'all',
  overallAverageRating,
  initialItems,
}: StatsTalentRankingTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCast = type === 'cast';
  const labelPlural = isCast ? 'Atores e Atrizes' : 'Diretores e Criadores';
  const labelSingular = isCast ? 'Artista' : 'Diretor';

  const getPageFromUrl = () => {
    if (typeof window !== 'undefined') {
      const p = Number(new URLSearchParams(window.location.search).get('page'));
      if (p > 0) return p;
    }
    const p = Number(searchParams.get('page'));
    return p > 0 ? p : 1;
  };

  const [page, setPageState] = useState<number>(getPageFromUrl);
  const [sortBy, setSortBy] = useState<PeopleSortField>('count');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const initialCacheKey = `${type}:${period}:count:${page}:`;
  const initialCached = peopleRankingCache.get(initialCacheKey);

  const [data, setData] = useState<PeopleRankingResponse | null>(() => {
    if (initialCached) return initialCached.data;
    if (initialItems && initialItems.length > 0 && page === 1) {
      const totalItemsCount = initialItems.length;
      return {
        items: initialItems.slice(0, 10).map((item, idx) => ({
          rank: idx + 1,
          name: item.name,
          person_id: item.person_id ?? null,
          profile_path: item.profile_path ?? null,
          role: type,
          count: item.count,
          totalTime: item.totalTime,
          avgRating: item.avgRating,
          sample_titles: [],
        })),
        total_items: totalItemsCount,
        page: 1,
        page_size: 10,
        total_pages: Math.max(1, Math.ceil(totalItemsCount / 10)),
        role: type,
        sort_by: 'count',
        period,
        search: '',
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(!initialCached && !(initialItems && initialItems.length > 0 && page === 1));

  // Sincroniza página apenas em navegação real (popstate), evitando re-render duplicado em replaceState
  useEffect(() => {
    const onPopState = () => {
      const current = getPageFromUrl();
      setPageState((prev) => (prev !== current ? current : prev));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setPage = (newPage: number | ((prev: number) => number)) => {
    const next = typeof newPage === 'function' ? newPage(page) : newPage;
    if (next === page) return;
    setPageState(next);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', type);
      if (next === 1) params.delete('page');
      else params.set('page', String(next));
      const query = params.toString();
      const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    }
  };

  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce da barra de busca: só reseta para página 1 se o termo realmente mudou
  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  // Reseta a página se a ordenação mudar
  const handleSortChange = (newSort: PeopleSortField) => {
    if (sortBy !== newSort) {
      setSortBy(newSort);
      setPage(1);
    }
  };

  const fetchRankings = useCallback(async () => {
    const cacheKey = `${type}:${period}:${sortBy}:${page}:${debouncedSearch}`;
    const cached = peopleRankingCache.get(cacheKey);

    if (cached && Date.now() - cached.ts < PEOPLE_RANKING_CACHE_TTL_MS) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    if (!data) {
      setLoading(true);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await api.get('/api/statistics/rankings/people', {
        params: {
          role: type,
          sort_by: sortBy,
          period,
          page,
          page_size: 10,
          search: debouncedSearch.trim() || undefined,
        },
        signal: controller.signal,
      });

      peopleRankingCache.set(cacheKey, { data: response.data, ts: Date.now() });
      setData(response.data);
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
        return;
      }
      console.warn('Falha ao carregar ranking de pessoas do backend, ativando fallback:', err);
      if (initialItems && initialItems.length > 0) {
        let filtered = [...initialItems];
        if (debouncedSearch.trim()) {
          const t = debouncedSearch.toLowerCase();
          filtered = filtered.filter(item => item.name.toLowerCase().includes(t));
        }
        if (sortBy === 'time') {
          filtered.sort((a, b) => b.totalTime - a.totalTime);
        } else if (sortBy === 'rating') {
          filtered.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
        } else if (sortBy === 'name') {
          filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else {
          filtered.sort((a, b) => b.count - a.count);
        }
        const totalItemsCount = filtered.length;
        const totalPagesCount = Math.max(1, Math.ceil(totalItemsCount / 10));
        const sliced = filtered.slice((page - 1) * 10, page * 10);
        setData({
          items: sliced.map((item, idx) => ({
            rank: (page - 1) * 10 + idx + 1,
            name: item.name,
            person_id: item.person_id ?? null,
            role: type,
            count: item.count,
            totalTime: item.totalTime,
            avgRating: item.avgRating,
            sample_titles: [],
          })),
          total_items: totalItemsCount,
          page,
          page_size: 10,
          total_pages: totalPagesCount,
          role: type,
          sort_by: sortBy,
          period,
          search: debouncedSearch,
        });
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [type, period, sortBy, page, debouncedSearch]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const items = data?.items || [];
  const totalItems = data?.total_items || 0;
  const totalPages = data?.total_pages || 1;

  return (
    <div>
      {/* Barra de Filtros de Ordenação e Busca */}
      <div className="p-3 sm:p-4 bg-zinc-950/40 border-b border-zinc-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Botões de Ordenação */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs w-full sm:w-auto">
            <button
              onClick={() => handleSortChange('count')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                sortBy === 'count'
                  ? isCast
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {isCast ? <Users className="w-3.5 h-3.5" /> : <Clapperboard className="w-3.5 h-3.5" />}
              Mais Obras
            </button>

            <button
              onClick={() => handleSortChange('time')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                sortBy === 'time'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Mais Tempo
            </button>

            <button
              onClick={() => handleSortChange('rating')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                sortBy === 'rating'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              Melhor Avaliados
            </button>

            <button
              onClick={() => handleSortChange('name')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                sortBy === 'name'
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              Nome (A-Z)
            </button>
          </div>
          {/* Indicador de scroll horizontal sutil no mobile */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-950/90 to-transparent sm:hidden" />
        </div>

        {/* Input de Busca rápida */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder={`Buscar ${labelSingular.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Visualização Mobile: Cards Verticais Compactos com Links Diretos */}
      <div className="block sm:hidden divide-y divide-zinc-800/40">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="p-3 flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-6 h-6 bg-zinc-800 rounded-full shrink-0" />
                <div className="w-10 h-10 bg-zinc-800 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-3.5 bg-zinc-800 rounded w-3/4" />
                  <div className="h-2.5 bg-zinc-800/60 rounded w-1/2" />
                </div>
              </div>
              <div className="w-14 space-y-1 text-right shrink-0">
                <div className="h-4 bg-zinc-800 rounded ml-auto w-10" />
                <div className="h-3 bg-zinc-800 rounded ml-auto w-12" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            Nenhum registro encontrado para este filtro.
          </div>
        ) : (
          items.map((item) => {
            const hasLink = Boolean(item.person_id);
            const detailHref = hasLink ? `/person/${item.person_id}` : '#';

            return (
              <div
                key={item.name}
                onClick={() => {
                  if (hasLink) router.push(detailHref);
                }}
                className={`p-3 flex items-center justify-between gap-2.5 transition-colors ${
                  hasLink
                    ? 'cursor-pointer hover:bg-zinc-800/40 active:bg-zinc-800/60'
                    : 'hover:bg-zinc-800/20'
                }`}
              >
                {/* Ranking, Avatar e Nome */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {/* Badge de Posição */}
                  <div className="w-6 text-center font-bold text-xs shrink-0">
                    {item.rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/50 text-[11px] font-extrabold shadow-sm shadow-amber-500/20">
                        1º
                      </span>
                    ) : item.rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 text-[11px] font-extrabold shadow-sm shadow-slate-400/10">
                        2º
                      </span>
                    ) : item.rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-900/30 text-amber-500 border border-amber-700/50 text-[11px] font-extrabold shadow-sm shadow-amber-800/10">
                        3º
                      </span>
                    ) : (
                      <span className="text-zinc-500 font-medium text-[11px]">{item.rank}º</span>
                    )}
                  </div>

                  {/* Avatar com Foto Real / Iniciais */}
                  <TalentAvatar
                    name={item.name}
                    profilePath={item.profile_path}
                    isCast={isCast}
                    size="sm"
                  />

                  {/* Nome e Amostras de Obras */}
                  <div className="flex flex-col min-w-0">
                    {hasLink ? (
                      <Link
                        href={detailHref}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-xs text-zinc-100 hover:text-blue-400 hover:underline transition-colors truncate block flex items-center gap-1"
                      >
                        <span>{item.name}</span>
                        <span className="text-[10px] text-zinc-500">↗</span>
                      </Link>
                    ) : (
                      <span className="font-semibold text-xs text-zinc-100 truncate block">
                        {item.name}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-400 truncate mt-0.5">
                      {item.sample_titles && item.sample_titles.length > 0
                        ? item.sample_titles.join(' • ')
                        : `${item.count} ${item.count === 1 ? 'título' : 'títulos'}`}
                    </span>
                  </div>
                </div>

                {/* Métricas: Obras, Tempo e Nota */}
                <div className="flex flex-col items-end gap-0.5 shrink-0 pl-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-zinc-300">
                      {item.count} {item.count === 1 ? 'obra' : 'obras'}
                    </span>
                    {item.avgRating && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        {item.avgRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {formatSimpleDuration(item.totalTime)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Visualização Desktop: Tabela Completa */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/60 text-zinc-400 font-semibold border-b border-zinc-800">
            <tr>
              <th className="py-3 px-3 sm:px-4 w-14 text-center">#</th>
              <th className="py-3 px-3 sm:px-4">{labelSingular}</th>
              <th className="py-3 px-3 sm:px-4 text-center w-28">Obras</th>
              <th className="py-3 px-3 sm:px-4 text-right w-36">Tempo Total</th>
              <th className="py-3 px-3 sm:px-4 text-right w-36">Média de Nota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4 text-center">
                    <div className="w-6 h-6 bg-zinc-800 rounded-full mx-auto" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-800 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 bg-zinc-800 rounded w-1/3" />
                        <div className="h-3 bg-zinc-800/60 rounded w-1/4" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="h-4 bg-zinc-800 rounded w-12 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-4 bg-zinc-800 rounded w-16 ml-auto" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-4 bg-zinc-800 rounded w-12 ml-auto" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-500">
                  Nenhum registro encontrado para este filtro.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const hasLink = Boolean(item.person_id);
                const detailHref = hasLink ? `/person/${item.person_id}` : '#';

                return (
                  <tr
                    key={item.name}
                    onClick={() => {
                      if (hasLink) router.push(detailHref);
                    }}
                    className={`transition-colors group ${
                      hasLink
                        ? 'cursor-pointer hover:bg-zinc-800/40'
                        : 'hover:bg-zinc-800/20'
                    }`}
                  >
                    {/* Medalha ou Posição */}
                    <td className="py-3.5 px-3 sm:px-4 text-center font-bold">
                      {item.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/50 text-xs font-black shadow-sm shadow-amber-500/20">
                          <Trophy className="w-3.5 h-3.5 mr-0.5" /> 1
                        </span>
                      ) : item.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 text-xs font-black shadow-sm shadow-slate-400/10">
                          2
                        </span>
                      ) : item.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-900/30 text-amber-500 border border-amber-700/50 text-xs font-black shadow-sm shadow-amber-800/10">
                          3
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-medium">{item.rank}</span>
                      )}
                    </td>

                    {/* Artista e Avatar */}
                    <td className="py-3.5 px-3 sm:px-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar com Foto Real / Iniciais */}
                        <TalentAvatar
                          name={item.name}
                          profilePath={item.profile_path}
                          isCast={isCast}
                          size="md"
                        />

                        <div className="flex flex-col min-w-0">
                          {hasLink ? (
                            <Link
                              href={detailHref}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-zinc-100 group-hover:text-blue-400 group-hover:underline transition-colors truncate max-w-xs md:max-w-md block flex items-center gap-1.5"
                            >
                              <span>{item.name}</span>
                              <span className="text-[10px] text-zinc-500 group-hover:text-blue-400 transition-colors">↗</span>
                            </Link>
                          ) : (
                            <span className="font-semibold text-zinc-100 truncate max-w-xs md:max-w-md block">
                              {item.name}
                            </span>
                          )}

                          {item.sample_titles && item.sample_titles.length > 0 && (
                            <span className="text-[11px] text-zinc-400 truncate max-w-sm mt-0.5">
                              {item.sample_titles.join(' • ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contagem de Obras */}
                    <td className="py-3.5 px-3 sm:px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800/80 text-zinc-200 font-bold text-xs border border-zinc-700/50">
                        {item.count} {item.count === 1 ? 'obra' : 'obras'}
                      </span>
                    </td>

                    {/* Tempo Assistido Total */}
                    <td className="py-3.5 px-3 sm:px-4 text-right text-zinc-200 font-semibold whitespace-nowrap">
                      {formatSimpleDuration(item.totalTime)}
                    </td>

                    {/* Média de Notas */}
                    <td className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                      {item.avgRating ? (
                        (() => {
                          const diff =
                            overallAverageRating !== undefined && overallAverageRating !== null
                              ? Number((item.avgRating - overallAverageRating).toFixed(1))
                              : null;
                          return (
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-xs">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {item.avgRating.toFixed(1)}
                              </span>
                              {diff !== null && (
                                <span
                                  title={`Diferença em relação à média geral (${overallAverageRating?.toFixed(1)} ★)`}
                                  className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border transition-all ${
                                    diff > 0.05
                                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                      : diff < -0.05
                                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                      : 'text-zinc-400 bg-zinc-800 border-zinc-700'
                                  }`}
                                >
                                  {diff > 0.05 ? `▲ +${diff.toFixed(1)}` : diff < -0.05 ? `▼ ${diff.toFixed(1)}` : `= Média`}
                                </span>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginação no Rodapé */}
      {totalPages > 1 && (
        <div className="p-3.5 sm:p-4 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="text-center sm:text-left">
            Mostrando{' '}
            <span className="font-semibold text-zinc-200">
              {items.length > 0 ? (page - 1) * 10 + 1 : 0}
            </span>{' '}
            a{' '}
            <span className="font-semibold text-zinc-200">
              {Math.min(page * 10, totalItems)}
            </span>{' '}
            de <span className="font-semibold text-zinc-200">{totalItems}</span>{' '}
            {labelPlural.toLowerCase()}
          </div>

          <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3.5 py-2 min-h-[38px] rounded-lg bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 font-medium select-none cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </button>

            <span className="px-2 font-medium text-zinc-300 whitespace-nowrap">
              Página {page} de {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3.5 py-2 min-h-[38px] rounded-lg bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 font-medium select-none cursor-pointer"
            >
              Próxima
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
