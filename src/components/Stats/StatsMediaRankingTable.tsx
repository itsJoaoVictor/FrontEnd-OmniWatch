'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/axios';
import { MediaRankingItem, MediaRankingResponse, MediaSortField, PeriodFilter } from './types';
import { formatSimpleDuration } from './StatsKpiCards';
import { PosterImage } from '@/components/shared/PosterImage';
import {
  Trophy,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  Tv,
  RotateCcw,
  Sparkles,
  Calendar,
  Loader2,
} from 'lucide-react';

interface StatsMediaRankingTableProps {
  mediaType: 'movie' | 'tv';
  period: PeriodFilter;
}

export function StatsMediaRankingTable({ mediaType, period }: StatsMediaRankingTableProps) {
  const [data, setData] = useState<MediaRankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<MediaSortField>('time');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Cache local em memória por chave de requisição para trocas instantâneas
  const localCacheRef = useRef<Map<string, MediaRankingResponse>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce da barra de pesquisa
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Volta para a primeira página ao pesquisar
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Reseta página ao trocar ordenação ou período
  const handleSortChange = (newSort: MediaSortField) => {
    if (sortBy !== newSort) {
      setSortBy(newSort);
      setPage(1);
    }
  };

  const fetchRankings = useCallback(async () => {
    const cacheKey = `${mediaType}:${period}:${sortBy}:${page}:${debouncedSearch}`;

    if (localCacheRef.current.has(cacheKey)) {
      setData(localCacheRef.current.get(cacheKey)!);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await api.get('/api/statistics/rankings/media', {
        params: {
          media_type: mediaType,
          sort_by: sortBy,
          period,
          page,
          page_size: 10,
          search: debouncedSearch.trim() || undefined,
        },
        signal: controller.signal,
      });

      localCacheRef.current.set(cacheKey, response.data);
      setData(response.data);
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
        return;
      }
      console.error('Falha ao carregar ranking de mídias:', err);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [mediaType, period, sortBy, page, debouncedSearch]);

  useEffect(() => {
    fetchRankings();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRankings]);

  const items = data?.items || [];
  const totalItems = data?.total_items || 0;
  const totalPages = data?.total_pages || 1;

  const isMovie = mediaType === 'movie';

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca do Ranking */}
      <div className="p-4 bg-zinc-950/40 border-b border-zinc-800/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Seletor de Ordenação */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          <span className="text-zinc-500 font-medium whitespace-nowrap hidden sm:inline">Ordenar:</span>
          
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

          {isMovie ? (
            <button
              onClick={() => handleSortChange('rewatch')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                sortBy === 'rewatch'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Mais Reassistidos
            </button>
          ) : (
            <button
              onClick={() => handleSortChange('episodes')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                sortBy === 'episodes'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              Mais Episódios
            </button>
          )}

          <button
            onClick={() => handleSortChange('recent')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              sortBy === 'recent'
                ? 'bg-zinc-700 text-white'
                : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Recentes
          </button>
        </div>

        {/* Input de Busca rápida */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder={isMovie ? 'Buscar filme no ranking...' : 'Buscar série no ranking...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Visualização Mobile: Lista Compacta sem Rolagem Horizontal */}
      <div className="block sm:hidden divide-y divide-zinc-800/40">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="p-3 flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-6 h-6 bg-zinc-800 rounded-full shrink-0" />
                <div className="w-10 h-14 bg-zinc-800 rounded-md shrink-0 aspect-[2/3]" />
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
          <div className="py-12 px-4 text-center text-zinc-500">
            <p className="text-zinc-400 font-medium">Nenhuma obra encontrada.</p>
            <p className="text-xs text-zinc-500 mt-1">
              {search ? 'Tente buscar com outro termo.' : 'Você ainda não registrou obras com esses critérios.'}
            </p>
          </div>
        ) : (
          items.map((item) => {
            const rank = item.rank;
            const detailHref = `/${item.media_type}/${item.tmdb_id}`;
            const releaseYear = item.release_date ? item.release_date.split('-')[0] : null;

            return (
              <div
                key={item.id}
                className="p-3 flex items-center justify-between gap-2.5 hover:bg-zinc-800/30 transition-colors"
              >
                {/* Esquerda: Rank + Pôster + Título/Metadados */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Posição com medalhas para o top 3 */}
                  <div className="w-6 text-center font-bold shrink-0">
                    {rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold">
                        1º
                      </span>
                    ) : rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/30 text-[10px] font-extrabold">
                        2º
                      </span>
                    ) : rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/30 text-[10px] font-extrabold">
                        3º
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-xs font-semibold">{rank}º</span>
                    )}
                  </div>

                  {/* Pôster miniatura */}
                  <Link
                    href={detailHref}
                    className="relative w-10 h-14 shrink-0 rounded-md overflow-hidden bg-zinc-800 border border-zinc-700/50 shadow-sm"
                  >
                    <PosterImage
                      src={item.poster_path}
                      alt={item.title}
                      title={item.title}
                      type={item.media_type}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </Link>

                  {/* Detalhes do Título */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={detailHref}
                      className="font-semibold text-zinc-200 hover:text-blue-400 transition-colors text-xs truncate block"
                      title={item.title}
                    >
                      {item.title}
                    </Link>

                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-400">
                      {releaseYear && <span>{releaseYear}</span>}
                      {item.genres && item.genres.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="truncate">{item.genres[0]}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                      {isMovie ? (
                        item.rewatch_count > 0 ? (
                          <span className="text-emerald-400 font-medium">
                            {item.rewatch_count + 1}x assistido
                          </span>
                        ) : (
                          item.runtime ? <span className="text-zinc-500">{Math.floor(item.runtime / 60)}h {item.runtime % 60}m</span> : null
                        )
                      ) : (
                        <span className="text-purple-400 font-medium">
                          {item.episodes_watched} {item.episodes_watched === 1 ? 'ep assistido' : 'eps assistidos'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direita: Nota Pessoal + Tempo Assistido */}
                <div className="text-right shrink-0 flex flex-col items-end justify-center gap-1 pl-1">
                  {item.rating ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[11px]">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      {item.rating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-zinc-600 text-xs">—</span>
                  )}

                  <span className="text-zinc-300 font-semibold text-[11px] whitespace-nowrap">
                    {formatSimpleDuration(item.total_time_minutes)}
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
          <thead className="bg-zinc-950/40 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800/60">
            <tr>
              <th className="py-3 px-3 sm:px-4 w-12 text-center">#</th>
              <th className="py-3 px-3 sm:px-4 min-w-[200px]">Título</th>
              <th className="py-3 px-3 sm:px-4 text-center hidden md:table-cell">
                {isMovie ? 'Duração' : 'Episódios'}
              </th>
              {isMovie && (
                <th className="py-3 px-3 sm:px-4 text-center hidden lg:table-cell">Rewatches</th>
              )}
              <th className="py-3 px-3 sm:px-4 text-right">Tempo Assistido</th>
              <th className="py-3 px-3 sm:px-4 text-right">Sua Nota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3.5 px-4 text-center">
                    <div className="w-6 h-6 bg-zinc-800 rounded-full mx-auto" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-13 bg-zinc-800 rounded-md shrink-0 aspect-[2/3]" />
                      <div className="space-y-1.5 w-full max-w-xs">
                        <div className="h-3.5 bg-zinc-800 rounded w-3/4" />
                        <div className="h-2.5 bg-zinc-800/60 rounded w-1/3" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center hidden md:table-cell">
                    <div className="h-3 bg-zinc-800 rounded w-16 mx-auto" />
                  </td>
                  {isMovie && (
                    <td className="py-3.5 px-4 text-center hidden lg:table-cell">
                      <div className="h-3 bg-zinc-800 rounded w-10 mx-auto" />
                    </td>
                  )}
                  <td className="py-3.5 px-4 text-right">
                    <div className="h-3 bg-zinc-800 rounded w-16 ml-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="h-5 bg-zinc-800 rounded w-14 ml-auto" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-zinc-400 font-medium">Nenhuma obra encontrada.</p>
                    <p className="text-xs text-zinc-500">
                      {search ? 'Tente buscar com outro termo.' : 'Você ainda não registrou obras com esses critérios.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const rank = item.rank;
                const detailHref = `/${item.media_type}/${item.tmdb_id}`;
                const releaseYear = item.release_date ? item.release_date.split('-')[0] : null;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-800/30 transition-colors group"
                  >
                    {/* Posição com medalhas para o top 3 */}
                    <td className="py-3 px-3 sm:px-4 text-center font-bold">
                      {rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-extrabold shadow-sm shadow-amber-500/10">
                          1º
                        </span>
                      ) : rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/30 text-xs font-extrabold">
                          2º
                        </span>
                      ) : rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/30 text-xs font-extrabold">
                          3º
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-semibold">{rank}º</span>
                      )}
                    </td>

                    {/* Mídia: Pôster + Título + Metadados */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={detailHref}
                          className="relative w-9 h-13 shrink-0 rounded-md overflow-hidden bg-zinc-800 shadow-sm border border-zinc-700/50 group-hover:border-blue-500/50 transition-colors"
                        >
                          <PosterImage
                            src={item.poster_path}
                            alt={item.title}
                            title={item.title}
                            type={item.media_type}
                            fill
                            sizes="40px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>

                        <div className="flex flex-col min-w-0">
                          <Link
                            href={detailHref}
                            className="font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors truncate max-w-xs md:max-w-md block"
                            title={item.title}
                          >
                            {item.title}
                          </Link>

                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                            {releaseYear && <span>{releaseYear}</span>}
                            {item.genres && item.genres.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[150px]">{item.genres.join(', ')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Duração individual ou Episódios assistidos */}
                    <td className="py-3 px-3 sm:px-4 text-center hidden md:table-cell text-zinc-300">
                      {isMovie ? (
                        item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : '—'
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-medium text-[11px]">
                          {item.episodes_watched} {item.episodes_watched === 1 ? 'ep' : 'eps'}
                        </span>
                      )}
                    </td>

                    {/* Rewatches para filmes */}
                    {isMovie && (
                      <td className="py-3 px-3 sm:px-4 text-center hidden lg:table-cell">
                        {item.rewatch_count > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
                            <RotateCcw className="w-3 h-3" />
                            {item.rewatch_count + 1}x
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">1x</span>
                        )}
                      </td>
                    )}

                    {/* Tempo Assistido Total */}
                    <td className="py-3 px-3 sm:px-4 text-right text-zinc-200 font-semibold whitespace-nowrap">
                      {formatSimpleDuration(item.total_time_minutes)}
                    </td>

                    {/* Nota Pessoal */}
                    <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                      {item.rating ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-xs">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {item.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
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
            Mostrando <span className="font-semibold text-zinc-200">{items.length > 0 ? (page - 1) * 10 + 1 : 0}</span> a{' '}
            <span className="font-semibold text-zinc-200">{Math.min(page * 10, totalItems)}</span> de{' '}
            <span className="font-semibold text-zinc-200">{totalItems}</span> obras
          </div>

          <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-medium"
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
              className="px-3 py-1.5 rounded-lg bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-medium"
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
