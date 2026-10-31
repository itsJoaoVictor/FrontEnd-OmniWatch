'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatisticsResponse } from './types';
import { formatSimpleDuration } from './StatsKpiCards';
import { Activity, PieChart as PieIcon, BarChart3, BarChart2, Trophy, Star, Sparkles } from 'lucide-react';

interface StatsChartsProps {
  data: StatisticsResponse;
}

const DONUT_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // violet
];

export function StatsCharts({ data }: StatsChartsProps) {
  const topGenres = data.topGenres || [];
  const timelineData = data.timeline || [];
  const ratingData = data.ratingDistribution || [];
  const [genreViewMode, setGenreViewMode] = useState<'bars' | 'donut'>('bars');

  const maxGenreTime = topGenres.length > 0 ? Math.max(...topGenres.map((g) => g.totalTime || 0)) : 1;

  return (
    <div className="space-y-6">
      {/* 1. Gráfico de Atividade Mensal (Linha do Tempo em Área) */}
      <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-white">Histórico de Atividade Mensal</CardTitle>
              <p className="text-xs text-zinc-400">Horas assistidas nos últimos meses</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} unit="h" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="p-3 bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-xl backdrop-blur-md text-xs">
                        <p className="font-semibold text-zinc-200">{item.month}</p>
                        <p className="text-blue-400 font-bold mt-1">{item.hours} horas assistidas</p>
                        <p className="text-zinc-400">{item.count} títulos/episódios</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#activityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. Grid com Gêneros e Distribuição de Notas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Gêneros (Barras Horizontais / Rosca) */}
        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md overflow-hidden flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-800/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white">Gêneros Mais Assistidos</CardTitle>
                <p className="text-xs text-zinc-400">Distribuição do tempo e frequência</p>
              </div>
            </div>

            {/* Alternador de visualização: Barras vs Rosca */}
            <div className="flex items-center gap-1 bg-zinc-950/70 p-1 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setGenreViewMode('bars')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  genreViewMode === 'bars'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Barras (Recomendada)"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Barras</span>
              </button>
              <button
                type="button"
                onClick={() => setGenreViewMode('donut')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  genreViewMode === 'donut'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Rosca"
              >
                <PieIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rosca</span>
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex-1 flex flex-col justify-center">
            {genreViewMode === 'bars' ? (
              <div className="space-y-2.5 max-h-[240px] overflow-y-auto scrollbar-none pr-1">
                {topGenres.slice(0, 5).map((genre, idx) => {
                  const percentOfTop = Math.round(((genre.totalTime || 0) / maxGenreTime) * 100);
                  const rank = idx + 1;
                  const rankBadgeClass =
                    rank === 1
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/20'
                      : rank === 2
                      ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                      : rank === 3
                      ? 'bg-amber-800/25 text-amber-500 border border-amber-700/40'
                      : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60';

                  return (
                    <div key={genre.name} className="group/bar space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold shrink-0 ${rankBadgeClass}`}>
                            {rank}
                          </span>
                          <span className="font-semibold text-zinc-200 truncate group-hover/bar:text-white transition-colors">
                            {genre.name}
                          </span>
                          <span className="text-[11px] text-zinc-500 hidden sm:inline">
                            ({genre.count} obras)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-zinc-200">{formatSimpleDuration(genre.totalTime)}</span>
                          <span className="text-[11px] font-medium text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                            {genre.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso com Cor do Gênero */}
                      <div className="w-full bg-zinc-950/80 rounded-full h-2 overflow-hidden border border-zinc-800/60">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.max(5, percentOfTop)}%`,
                            backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="w-full md:w-1/2 h-[220px] relative flex items-center justify-center">
                  {/* Rótulo Central no Miolo da Rosca */}
                  {topGenres.length > 0 && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Top Gênero</span>
                      <span className="text-sm font-extrabold text-white max-w-[110px] truncate" title={topGenres[0].name}>
                        {topGenres[0].name}
                      </span>
                      <span className="text-xs font-semibold text-blue-400">{topGenres[0].percentage}%</span>
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topGenres}
                        dataKey="totalTime"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {topGenres.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.name}`}
                            fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                            stroke="#18181b"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                              <div className="p-3 bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-xl text-xs backdrop-blur-md">
                                <p className="font-bold text-zinc-100">{item.name}</p>
                                <p className="text-blue-400 font-semibold mt-1">
                                  {formatSimpleDuration(item.totalTime)} ({item.percentage}%)
                                </p>
                                <p className="text-zinc-400">{item.count} títulos/obras</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legenda Lateral */}
                <div className="w-full md:w-1/2 flex flex-col gap-1.5 max-h-[220px] overflow-y-auto scrollbar-none pr-1">
                  <span className="text-[10px] text-zinc-500 italic pb-1">
                    *Títulos contêm múltiplos gêneros simultâneos
                  </span>
                  {topGenres.slice(0, 7).map((genre, idx) => (
                    <div
                      key={genre.name}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-zinc-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                        />
                        <span className="font-medium text-zinc-300 truncate">{genre.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-zinc-400">
                        <span className="font-semibold text-zinc-200">{genre.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de Notas */}
        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white">Distribuição de Avaliações</CardTitle>
                <p className="text-xs text-zinc-400">Frequência de notas atribuídas</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="rating"
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `${val} ★`}
                />
                <YAxis allowDecimals={false} stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="p-2.5 bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-xl text-xs backdrop-blur-md">
                          <p className="font-bold text-amber-400">Nota {item.rating} ★</p>
                          <p className="text-zinc-300 font-semibold">{item.count} mídias</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
