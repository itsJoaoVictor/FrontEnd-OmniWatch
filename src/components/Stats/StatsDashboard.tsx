'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/axios';
import { StatisticsResponse, PeriodFilter, MediaTypeFilter } from './types';
import { StatsFilters } from './StatsFilters';
import { StatsKpiCards } from './StatsKpiCards';
import { StatsCharts } from './StatsCharts';
import { StatsRankingTable } from './StatsRankingTable';
import { RefreshCw, AlertCircle } from 'lucide-react';

export function StatsDashboard() {
  const [data, setData] = useState<StatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [mediaType, setMediaType] = useState<MediaTypeFilter>('all');

  // Client-side cache: instantanea para filtros já consultados (0ms)
  const clientCacheRef = useRef<Map<string, StatisticsResponse>>(new Map());
  // AbortController para prevenir race conditions em trocas rápidas de filtros
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchStats = useCallback(async (isInitial = false) => {
    const cacheKey = `${period}:${mediaType}`;

    // Se estiver em cache, exibe imediatamente e revalida em background
    if (clientCacheRef.current.has(cacheKey)) {
      setData(clientCacheRef.current.get(cacheKey)!);
      setLoading(false);
      setIsRefreshing(true);
    } else {
      if (isInitial || !data) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
    }
    setError(null);

    // Cancela requisição anterior pendente se houver
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await api.get('/api/statistics', {
        params: {
          period,
          media_type: mediaType,
        },
        signal: controller.signal,
      });

      // Atualiza o cache do cliente e o estado da tela
      clientCacheRef.current.set(cacheKey, response.data);
      setData(response.data);
    } catch (err: any) {
      // Ignora cancelamentos intencionais
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
        return;
      }
      console.error('Failed to fetch statistics:', err);
      if (!clientCacheRef.current.has(cacheKey)) {
        setError('Não foi possível carregar as estatísticas. Verifique sua conexão e tente novamente.');
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [period, mediaType]);

  useEffect(() => {
    fetchStats();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStats]);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Skeleton Filters */}
        <div className="h-16 bg-zinc-900/50 rounded-2xl border border-zinc-800/80" />
        {/* Skeleton KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-900/50 rounded-2xl border border-zinc-800/80" />
          ))}
        </div>
        {/* Skeleton Charts */}
        <div className="h-72 bg-zinc-900/50 rounded-2xl border border-zinc-800/80" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-zinc-900/50 rounded-2xl border border-zinc-800/80" />
          <div className="h-72 bg-zinc-900/50 rounded-2xl border border-zinc-800/80" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
        <div className="p-3 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <p className="text-zinc-300 font-medium text-sm max-w-md">{error}</p>
        <button
          onClick={() => fetchStats(true)}
          className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Barra de Filtros no Topo */}
      <StatsFilters
        period={period}
        mediaType={mediaType}
        onPeriodChange={setPeriod}
        onMediaTypeChange={setMediaType}
        isLoading={isRefreshing}
      />

      {/* Cards de KPIs Principais */}
      <StatsKpiCards data={data} mediaType={mediaType} />

      {/* Gráficos Interativos */}
      <StatsCharts data={data} />

      {/* Tabela de Ranking de Gêneros */}
      <StatsRankingTable
        genres={data.rankings?.genres || data.topGenres || []}
        overallAverageRating={data.kpis?.averageRating}
        mediaType={mediaType}
      />
    </div>
  );
}
