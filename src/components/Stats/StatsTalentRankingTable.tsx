'use client';

import React, { useState, useMemo } from 'react';
import { StatRankingItem } from './types';
import { formatSimpleDuration } from './StatsKpiCards';
import { Search, ArrowUpDown, Star, Users, Clapperboard } from 'lucide-react';

interface StatsTalentRankingTableProps {
  items: StatRankingItem[];
  type: 'cast' | 'directors';
  overallAverageRating?: number;
}

type SortField = 'name' | 'count' | 'totalTime' | 'avgRating' | 'percentage';
type SortOrder = 'asc' | 'desc';

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StatsTalentRankingTable({
  items,
  type,
  overallAverageRating,
}: StatsTalentRankingTableProps) {
  const isCast = type === 'cast';
  const labelPlural = isCast ? 'Atores e Atrizes' : 'Diretores e Criadores';
  const labelSingular = isCast ? 'Artista' : 'Diretor';

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('count');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...(items || [])];

    if (search.trim()) {
      const term = search.toLowerCase();
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
  }, [items, search, sortField, sortOrder]);

  return (
    <div>
      {/* Barra de Busca rápida */}
      <div className="p-4 bg-zinc-950/40 border-b border-zinc-800/60 flex items-center justify-between gap-4">
        <span className="text-xs text-zinc-400 font-medium">
          {filteredAndSorted.length} {labelPlural.toLowerCase()} em destaque
        </span>
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

      {/* Visualização Mobile: Cards Verticais Compactos */}
      <div className="block sm:hidden divide-y divide-zinc-800/40">
        {filteredAndSorted.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            Nenhum registro encontrado para este filtro.
          </div>
        ) : (
          filteredAndSorted.map((item, index) => {
            const rank = index + 1;
            const initials = getInitials(item.name);

            return (
              <div
                key={item.name}
                className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-800/30 transition-colors"
              >
                {/* Esquerda: Rank + Avatar com Iniciais + Nome */}
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

                  {/* Avatar Circular com Iniciais */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/60 flex items-center justify-center shrink-0 shadow-inner">
                    <span className="text-[11px] font-bold text-zinc-200">{initials}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-zinc-200 text-xs block truncate" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {item.count} {item.count === 1 ? 'obra' : 'obras'}
                    </span>
                  </div>
                </div>

                {/* Direita: Tempo Assistido e Nota */}
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <span className="font-semibold text-zinc-200 text-xs">
                    {formatSimpleDuration(item.totalTime)}
                  </span>
                  {item.avgRating ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[10px]">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      {item.avgRating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">{item.percentage}%</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Visualização Desktop: Tabela Completa */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/60 text-zinc-400 uppercase font-bold tracking-wider text-[11px] border-b border-zinc-800/60 select-none">
            <tr>
              <th className="py-3 px-3 sm:px-4 text-center w-12">#</th>
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-3 sm:px-4 cursor-pointer hover:text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>{labelSingular}</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('count')}
                className="py-3 px-3 sm:px-4 text-right cursor-pointer hover:text-zinc-200 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Obras</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('totalTime')}
                className="py-3 px-3 sm:px-4 text-right cursor-pointer hover:text-zinc-200 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Tempo Dedicado</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('percentage')}
                className="py-3 px-4 cursor-pointer hover:text-zinc-200 transition-colors w-44"
              >
                <div className="flex items-center gap-1.5">
                  <span>Fatia do Catálogo</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('avgRating')}
                className="py-3 px-3 sm:px-4 text-right cursor-pointer hover:text-zinc-200 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Nota Média</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-500">
                  Nenhum registro encontrado para este filtro.
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((item, index) => {
                const rank = index + 1;
                const initials = getInitials(item.name);

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

                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/60 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-zinc-300">{initials}</span>
                        </div>
                        <span className="font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 sm:px-4 text-right text-zinc-300 font-medium">
                      {item.count} {item.count === 1 ? 'obra' : 'obras'}
                    </td>

                    <td className="py-3 px-3 sm:px-4 text-right text-zinc-200 font-semibold whitespace-nowrap">
                      {formatSimpleDuration(item.totalTime)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCast ? 'bg-indigo-500' : 'bg-emerald-500'
                            }`}
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
    </div>
  );
}
