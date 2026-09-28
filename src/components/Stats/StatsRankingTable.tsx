'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatRankingItem, MediaTypeFilter } from './types';
import { formatSimpleDuration } from './StatsKpiCards';
import { Trophy, ArrowUpDown, Search, Sparkles, Star } from 'lucide-react';

interface StatsRankingTableProps {
  genres: StatRankingItem[];
  overallAverageRating?: number;
  mediaType?: MediaTypeFilter;
}

type SortField = 'name' | 'count' | 'totalTime' | 'avgRating' | 'percentage';
type SortOrder = 'asc' | 'desc';

export function StatsRankingTable({
  genres,
  overallAverageRating,
  mediaType = 'all',
}: StatsRankingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const baselineLabel =
    mediaType === 'movie'
      ? 'média de Filmes'
      : mediaType === 'tv'
      ? 'média de Séries'
      : 'média Geral';

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedList = useMemo(() => {
    let result = [...(genres || [])];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(term));
    }

    result.sort((a, b) => {
      let valA: any = a[sortField] ?? 0;
      let valB: any = b[sortField] ?? 0;

      if (sortField === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }

      if (valA === null) valA = -1;
      if (valB === null) valB = -1;

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [genres, searchTerm, sortField, sortOrder]);

  return (
    <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md overflow-hidden">
      <CardHeader className="p-5 border-b border-zinc-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-white">Ranking de Gêneros</CardTitle>
            <p className="text-xs text-zinc-400">
              Tempo assistido, quantidade de obras e nota média por gênero
            </p>
          </div>
        </div>

        {/* Barra de Busca rápida */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar gênero..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-950/60 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Tabela Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/40 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800/60">
              <tr>
                <th className="py-3 px-2 sm:px-4 w-10 sm:w-12 text-center">#</th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-2.5 sm:px-4 cursor-pointer hover:text-zinc-200 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Gênero</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('count')}
                  className="py-3 px-2 sm:px-4 cursor-pointer hover:text-zinc-200 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Obras</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalTime')}
                  className="py-3 px-2 sm:px-4 cursor-pointer hover:text-zinc-200 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="hidden sm:inline">Tempo Assistido</span>
                    <span className="sm:hidden">Tempo</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('percentage')}
                  className="py-3 px-4 cursor-pointer hover:text-zinc-200 transition-colors w-40 hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>% do Tempo</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avgRating')}
                  className="py-3 px-2.5 sm:px-4 cursor-pointer hover:text-zinc-200 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Nota Média</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {filteredAndSortedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    Nenhum gênero encontrado para os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredAndSortedList.map((item, index) => {
                  const rank = index + 1;
                  return (
                    <tr
                      key={item.name}
                      className="hover:bg-zinc-800/30 transition-colors group"
                    >
                      {/* Posição com medalhas para o top 3 */}
                      <td className="py-3 px-2 sm:px-4 text-center font-bold">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-extrabold">
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
                          <span className="text-zinc-500">{rank}º</span>
                        )}
                      </td>

                      {/* Nome do Gênero */}
                      <td className="py-3 px-2.5 sm:px-4 font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </td>

                      {/* Quantidade de Obras */}
                      <td className="py-3 px-2 sm:px-4 text-right text-zinc-300 font-medium">
                        {item.count}
                      </td>

                      {/* Tempo Assistido */}
                      <td className="py-3 px-2 sm:px-4 text-right text-zinc-200 font-semibold whitespace-nowrap">
                        {formatSimpleDuration(item.totalTime)}
                      </td>

                      {/* Barra de % do Tempo */}
                      <td className="py-3 px-4 hidden sm:table-cell">
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

                      {/* Nota Média e Comparativo vs Média Geral */}
                      <td className="py-3 px-2.5 sm:px-4 text-right">
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
      </CardContent>
    </Card>
  );
}
