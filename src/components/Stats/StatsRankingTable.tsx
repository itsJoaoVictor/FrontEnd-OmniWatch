'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatRankingItem, MediaTypeFilter, PeriodFilter } from './types';
import { formatSimpleDuration } from './StatsKpiCards';
import { StatsMediaRankingTable } from './StatsMediaRankingTable';
import { Trophy, ArrowUpDown, Search, Star, Film, Tv, Tags } from 'lucide-react';

interface StatsRankingTableProps {
  genres: StatRankingItem[];
  overallAverageRating?: number;
  mediaType?: MediaTypeFilter;
  period?: PeriodFilter;
}

type TabType = 'movies' | 'tv' | 'genres';
type SortField = 'name' | 'count' | 'totalTime' | 'avgRating' | 'percentage';
type SortOrder = 'asc' | 'desc';

export function StatsRankingTable({
  genres,
  overallAverageRating,
  mediaType = 'all',
  period = 'all',
}: StatsRankingTableProps) {
  // Sincroniza a aba ativa inicial ou quando o filtro geral de mídia do dashboard mudar
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (mediaType === 'movie') return 'movies';
    if (mediaType === 'tv') return 'tv';
    return 'movies';
  });

  useEffect(() => {
    if (mediaType === 'movie') setActiveTab('movies');
    else if (mediaType === 'tv') setActiveTab('tv');
  }, [mediaType]);

  // Estados locais para a aba de Gêneros
  const [genreSearch, setGenreSearch] = useState('');
  const [genreSortField, setGenreSortField] = useState<SortField>('totalTime');
  const [genreSortOrder, setGenreSortOrder] = useState<SortOrder>('desc');

  const baselineLabel =
    mediaType === 'movie'
      ? 'média de Filmes'
      : mediaType === 'tv'
      ? 'média de Séries'
      : 'média Geral';

  const handleGenreSort = (field: SortField) => {
    if (genreSortField === field) {
      setGenreSortOrder(genreSortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setGenreSortField(field);
      setGenreSortOrder('desc');
    }
  };

  const filteredAndSortedGenres = useMemo(() => {
    let result = [...(genres || [])];

    if (genreSearch.trim()) {
      const term = genreSearch.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(term));
    }

    result.sort((a, b) => {
      let valA: any = a[genreSortField] ?? 0;
      let valB: any = b[genreSortField] ?? 0;

      if (genreSortField === 'name') {
        return genreSortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }

      if (valA === null) valA = -1;
      if (valB === null) valB = -1;

      return genreSortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [genres, genreSearch, genreSortField, genreSortOrder]);

  return (
    <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md overflow-hidden">
      {/* Cabeçalho Unificado com Abas de Seleção */}
      <CardHeader className="p-4 sm:p-5 border-b border-zinc-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-white">Central de Rankings</CardTitle>
            <p className="text-xs text-zinc-400">
              {activeTab === 'movies' && 'Seus filmes mais marcantes, assistidos e bem avaliados'}
              {activeTab === 'tv' && 'Suas séries com mais tempo dedicado, episódios e maiores notas'}
              {activeTab === 'genres' && 'Tempo assistido, quantidade de obras e nota média por gênero'}
            </p>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center bg-zinc-950/70 p-1 rounded-xl border border-zinc-800/80 shrink-0">
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'movies'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Filmes
          </button>

          <button
            onClick={() => setActiveTab('tv')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'tv'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            Séries
          </button>

          <button
            onClick={() => setActiveTab('genres')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'genres'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tags className="w-3.5 h-3.5" />
            Gêneros
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Renderização Condicional da Aba Ativa */}
        {activeTab === 'movies' && (
          <StatsMediaRankingTable mediaType="movie" period={period} />
        )}

        {activeTab === 'tv' && (
          <StatsMediaRankingTable mediaType="tv" period={period} />
        )}

        {activeTab === 'genres' && (
          <div>
            {/* Barra de Busca rápida para Gêneros */}
            <div className="p-4 bg-zinc-950/40 border-b border-zinc-800/60 flex items-center justify-between gap-4">
              <span className="text-xs text-zinc-400 font-medium">
                {filteredAndSortedGenres.length} gêneros registrados
              </span>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar gênero..."
                  value={genreSearch}
                  onChange={(e) => setGenreSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Visualização Mobile: Lista Compacta de Gêneros sem Rolagem */}
            <div className="block sm:hidden divide-y divide-zinc-800/40">
              {filteredAndSortedGenres.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  Nenhum gênero encontrado para os filtros atuais.
                </div>
              ) : (
                filteredAndSortedGenres.map((item, index) => {
                  const rank = index + 1;
                  return (
                    <div
                      key={item.name}
                      className="p-3 flex flex-col gap-2 hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Esquerda: Rank + Nome + Obras */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-5 text-center font-bold shrink-0">
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

                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-zinc-200 text-xs block truncate">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              {item.count} {item.count === 1 ? 'obra' : 'obras'}
                            </span>
                          </div>
                        </div>

                        {/* Direita: Nota Média + Tempo Assistido */}
                        <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                          {item.avgRating ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[11px]">
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              {item.avgRating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-xs">—</span>
                          )}
                          <span className="text-zinc-200 font-semibold text-[11px]">
                            {formatSimpleDuration(item.totalTime)}
                          </span>
                        </div>
                      </div>

                      {/* Barra de porcentagem no mobile */}
                      <div className="flex items-center gap-2 pl-7">
                        <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Visualização Desktop: Tabela de Gêneros */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/40 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800/60">
                  <tr>
                    <th className="py-3 px-3 sm:px-4 w-12 text-center">#</th>
                    <th
                      onClick={() => handleGenreSort('name')}
                      className="py-3 px-3 sm:px-4 cursor-pointer hover:text-zinc-200 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Gênero</span>
                        <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleGenreSort('count')}
                      className="py-3 px-3 sm:px-4 cursor-pointer hover:text-zinc-200 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Obras</span>
                        <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleGenreSort('totalTime')}
                      className="py-3 px-3 sm:px-4 cursor-pointer hover:text-zinc-200 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Tempo Assistido</span>
                        <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleGenreSort('percentage')}
                      className="py-3 px-4 cursor-pointer hover:text-zinc-200 transition-colors w-40"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>% do Tempo</span>
                        <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleGenreSort('avgRating')}
                      className="py-3 px-3 sm:px-4 cursor-pointer hover:text-zinc-200 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Nota Média</span>
                        <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {filteredAndSortedGenres.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500">
                        Nenhum gênero encontrado para os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedGenres.map((item, index) => {
                      const rank = index + 1;
                      return (
                        <tr
                          key={item.name}
                          className="hover:bg-zinc-800/30 transition-colors group"
                        >
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

                          <td className="py-3 px-3 sm:px-4 font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors">
                            {item.name}
                          </td>

                          <td className="py-3 px-3 sm:px-4 text-right text-zinc-300 font-medium">
                            {item.count}
                          </td>

                          <td className="py-3 px-3 sm:px-4 text-right text-zinc-200 font-semibold whitespace-nowrap">
                            {formatSimpleDuration(item.totalTime)}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-zinc-400 font-medium w-10 text-right">
                                {item.percentage}%
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3 sm:px-4 text-right">
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
                                        title={`Diferença em relação à ${baselineLabel} (${overallAverageRating?.toFixed(1)} ★)`}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
