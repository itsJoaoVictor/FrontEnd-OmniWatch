'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Film, Tv, Star, CheckCircle2, TrendingUp, Flame } from 'lucide-react';
import { StatisticsResponse, MediaTypeFilter } from './types';

interface StatsKpiCardsProps {
  data: StatisticsResponse;
  mediaType?: MediaTypeFilter;
}

export function formatWatchTime(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const totalHours = Math.floor(minutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const mins = minutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${mins}m`);
  return parts.join(' ');
}

export function formatSimpleDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function StatsKpiCards({ data, mediaType = 'all' }: StatsKpiCardsProps) {
  const { kpis } = data;

  let completionTitle = 'Taxa de Conclusão Geral';
  let completionRate = kpis?.completionRate ?? 0;
  let completionDetailLeft = `${kpis?.completedCount ?? 0} concluídos`;
  let completionDetailRight = `${kpis?.planToWatchCount ?? kpis?.pendingCount ?? 0} na fila`;

  if (mediaType === 'movie') {
    completionTitle = 'Conclusão de Filmes';
    completionRate = kpis?.moviesCompletionRate ?? kpis?.completionRate ?? 0;
    completionDetailLeft = `${kpis?.moviesCompleted ?? 0} assistidos`;
    completionDetailRight = `${kpis?.moviesPlanToWatch ?? 0} na fila`;
  } else if (mediaType === 'tv') {
    completionTitle = 'Conclusão de Séries';
    completionRate = kpis?.seriesCompletionRate ?? kpis?.completionRate ?? 0;
    completionDetailLeft = `${kpis?.seriesCompleted ?? 0} concluídas`;
    completionDetailRight = `${kpis?.seriesPlanToWatch ?? 0} na fila`;
  }

  // Identifica o gênero mais bem avaliado
  const topRatedGenre = React.useMemo(() => {
    const list = data.rankings?.genres || data.topGenres || [];
    const valid = list.filter((g) => g.avgRating !== null && g.avgRating > 0 && g.count >= 1);
    if (!valid.length) return null;
    return [...valid].sort((a, b) => (b.avgRating! - a.avgRating!) || (b.count - a.count))[0];
  }, [data]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* 1. Hero Card: Tempo Assistido (Spans 2 cols on mobile) */}
      <Card className="col-span-2 sm:col-span-2 lg:col-span-1 bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400">Tempo Assistido</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatWatchTime(data.totalTime)}
            </div>

            {/* Barra de Proporção Séries vs Filmes */}
            {data.totalTime > 0 && (
              <div className="mt-3 pt-2.5 border-t border-zinc-800/60">
                <div className="w-full bg-zinc-800 rounded-full h-2 flex overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-500"
                    style={{ width: `${Math.round(((data.totalTimeTv || 0) / data.totalTime) * 100)}%` }}
                    title={`Séries: ${Math.round(((data.totalTimeTv || 0) / data.totalTime) * 100)}%`}
                  />
                  <div
                    className="bg-purple-500 h-full transition-all duration-500"
                    style={{ width: `${Math.round(((data.totalTimeMovies || 0) / data.totalTime) * 100)}%` }}
                    title={`Filmes: ${Math.round(((data.totalTimeMovies || 0) / data.totalTime) * 100)}%`}
                  />
                </div>
                <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 inline-block" />
                    <span>Séries: <strong className="text-zinc-200">{formatWatchTime(data.totalTimeTv || 0)}</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 inline-block" />
                    <span>Filmes: <strong className="text-zinc-200">{formatWatchTime(data.totalTimeMovies || 0)}</strong></span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Obras & Episódios */}
      <Card className="col-span-1 bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md relative overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
        <CardContent className="p-3.5 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Assistido</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {data.totalMovies + data.totalEpisodes} <span className="text-[10px] sm:text-xs font-normal text-zinc-400">obras</span>
            </div>
            <div className="mt-2 text-[11px] text-zinc-400 flex flex-col space-y-0.5">
              <span className="flex items-center justify-between">
                <span>Filmes:</span>
                <span className="text-zinc-200 font-semibold">{data.totalMovies}</span>
              </span>
              <span className="flex items-center justify-between">
                <span>Episódios:</span>
                <span className="text-zinc-200 font-semibold">{data.totalEpisodes}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Nota Média */}
      <Card className="col-span-1 bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
        <CardContent className="p-3.5 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400">Nota Média</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Star className="w-4 h-4 fill-amber-400/30" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1 text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              <span>{kpis?.averageRating ? kpis.averageRating.toFixed(1) : '—'}</span>
              <span className="text-[10px] sm:text-xs font-normal text-zinc-400">/ 5.0</span>
            </div>
            <div className="mt-2 text-[11px] text-zinc-400 flex flex-col space-y-1">
              <div>
                <span className="text-zinc-200 font-semibold">{kpis?.totalRated ?? 0}</span> avaliadas
              </div>
              {topRatedGenre && (
                <div
                  className="text-[10px] sm:text-[11px] text-zinc-400 truncate pt-1 border-t border-zinc-800/60"
                  title={`Top Gênero: ${topRatedGenre.name} (★ ${topRatedGenre.avgRating?.toFixed(1)})`}
                >
                  <span className="text-amber-400 font-semibold">{topRatedGenre.name}</span>{' '}
                  <span>(★{topRatedGenre.avgRating?.toFixed(1)})</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Taxa de Conclusão */}
      <Card className="col-span-1 bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
        <CardContent className="p-3.5 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400">{completionTitle}</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 tracking-tight">
              {completionRate}%
            </div>
            {/* Barra de progresso */}
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
              />
            </div>
            <div className="mt-2 text-[10px] sm:text-[11px] text-zinc-400 flex justify-between">
              <span>{completionDetailLeft}</span>
              <span>{completionDetailRight}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Ritmo de Consumo */}
      <Card className="col-span-1 bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md relative overflow-hidden group hover:border-rose-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />
        <CardContent className="p-3.5 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400">Ritmo de Consumo</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {formatSimpleDuration(kpis?.dailyAverageMinutes ?? 0)}
              <span className="text-[10px] sm:text-xs font-normal text-zinc-400"> / dia</span>
            </div>
            <div className="mt-2 text-[11px] text-zinc-400 flex flex-col space-y-0.5">
              <span>
                Semanal:{' '}
                <strong className="text-zinc-200">
                  {formatSimpleDuration(kpis?.weeklyAverageMinutes ?? 0)}
                </strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
