'use client';

import React from 'react';
import { PeriodFilter, MediaTypeFilter } from './types';
import { Calendar, Film, Tv, Layers, Filter } from 'lucide-react';

interface StatsFiltersProps {
  period: PeriodFilter;
  mediaType: MediaTypeFilter;
  onPeriodChange: (p: PeriodFilter) => void;
  onMediaTypeChange: (m: MediaTypeFilter) => void;
  isLoading: boolean;
}

const PERIOD_OPTIONS: { id: PeriodFilter; label: string }[] = [
  { id: 'all', label: 'Todos os Tempos' },
  { id: 'year', label: 'Últimos 12 Meses' },
  { id: '6months', label: 'Últimos 6 Meses' },
  { id: '30days', label: 'Últimos 30 Dias' },
];

const MEDIA_OPTIONS: { id: MediaTypeFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Tudo', icon: <Layers className="w-4 h-4 mr-1.5" /> },
  { id: 'movie', label: 'Filmes', icon: <Film className="w-4 h-4 mr-1.5" /> },
  { id: 'tv', label: 'Séries', icon: <Tv className="w-4 h-4 mr-1.5" /> },
];

export function StatsFilters({
  period,
  mediaType,
  onPeriodChange,
  onMediaTypeChange,
  isLoading,
}: StatsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-md shadow-lg shadow-black/20">
      {/* Seletor de Tipo */}
      <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
        {MEDIA_OPTIONS.map((opt) => {
          const active = mediaType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onMediaTypeChange(opt.id)}
              className={`flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 select-none ${
                active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 active:scale-95'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Seletor de Período */}
      <div className="flex items-center gap-1 overflow-x-auto scroll-smooth scrollbar-none p-1 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
        <div className="items-center pl-2 pr-1 text-zinc-500 text-xs hidden lg:flex">
          <Calendar className="w-3.5 h-3.5 mr-1" />
          <span>Período:</span>
        </div>
        {PERIOD_OPTIONS.map((opt) => {
          const active = period === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPeriodChange(opt.id)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-all duration-200 select-none ${
                active
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 active:scale-95'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
