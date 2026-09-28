'use client';

import React from 'react';
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
import { Activity, PieChart as PieIcon, BarChart3 } from 'lucide-react';

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
        {/* Donut de Gêneros */}
        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white">Gêneros Mais Assistidos</CardTitle>
                <p className="text-xs text-zinc-400">Divisão do tempo por gênero</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-1/2 h-[240px]">
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

            {/* Legenda Lateral Interativa */}
            <div className="w-full md:w-1/2 flex flex-col gap-1.5 max-h-[240px] overflow-y-auto pr-2">
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
