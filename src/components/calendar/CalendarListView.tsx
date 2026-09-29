"use client";

import React, { useState } from 'react';
import { ReleaseEvent } from '@/types/calendar';
import { ReleaseDetailsSheet } from './ReleaseDetailsSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarListViewProps {
  releases: ReleaseEvent[];
  loading: boolean;
}

export function CalendarListView({ releases, loading }: CalendarListViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<ReleaseEvent | null>(null);

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
  }

  if (releases.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl p-10 border border-zinc-800 text-center">
        <p className="text-zinc-400 text-sm">Nenhum lançamento encontrado para o filtro selecionado.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-3 md:p-4 border border-zinc-800 shadow-sm">
      <div className="space-y-3">
        {releases.map(release => {
          const isMovie = release.media.media_type === 'movie';
          const isDuplicateTitle = isMovie && release.title.trim().toLowerCase() === release.media.title.trim().toLowerCase();
          const cleanTitle = isDuplicateTitle
            ? "Lançamento nos Cinemas / Streaming"
            : release.title.replace(/Lancamento/gi, 'Lançamento');

          return (
            <div 
              key={release.id} 
              className="flex items-center gap-3 md:gap-4 bg-zinc-800/80 hover:bg-zinc-800 p-3 rounded-xl border border-zinc-700/60 transition-all cursor-pointer group"
              onClick={() => setSelectedEvent(release)}
            >
              <div className="flex-shrink-0 w-16 md:w-20 text-center py-1 px-1 rounded-lg bg-zinc-900/60 border border-zinc-700/40">
                <div className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">
                  {format(parseISO(release.release_date), 'MMM yyyy', { locale: ptBR })}
                </div>
                <div className="text-xl md:text-2xl font-black text-white">
                  {format(parseISO(release.release_date), 'dd')}
                </div>
              </div>

              {release.media.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${release.media.poster_path}`}
                  className="w-12 h-16 md:w-14 md:h-20 object-cover rounded-lg bg-zinc-700 shadow-sm shrink-0"
                  alt={release.media.title}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-16 md:w-14 md:h-20 bg-zinc-700/60 rounded-lg flex items-center justify-center text-xs text-zinc-400 shrink-0">
                  🎬
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-white text-base md:text-lg group-hover:text-red-400 transition-colors truncate">
                    {release.media.title}
                  </h3>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-zinc-700/70 text-zinc-300 shrink-0">
                    {isMovie ? 'Filme' : 'Série'}
                  </span>
                  {!isMovie && release.season_number != null && release.episode_number != null && (
                    <span className="text-[10px] text-red-400 font-medium shrink-0">
                      T{release.season_number}E{release.episode_number}
                    </span>
                  )}
                </div>
                <p className="text-zinc-400 text-xs md:text-sm mt-1 truncate">
                  {cleanTitle}
                </p>
              </div>

              <div className="hidden sm:block text-xs text-zinc-400 group-hover:text-white transition-colors pr-2">
                Ver detalhes &rarr;
              </div>
            </div>
          );
        })}
      </div>

      <ReleaseDetailsSheet 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        release={selectedEvent} 
      />
    </div>
  );
}
