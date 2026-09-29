"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ReleaseEvent } from '@/types/calendar';
import { ReleaseDetailsSheet } from './ReleaseDetailsSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarX2, Compass } from 'lucide-react';

interface CalendarListViewProps {
  releases: ReleaseEvent[];
  loading: boolean;
}

export function CalendarListView({ releases, loading }: CalendarListViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<ReleaseEvent | null>(null);

  const groupedReleases = React.useMemo(() => {
    const groups: { monthKey: string; monthLabel: string; items: ReleaseEvent[] }[] = [];
    const map = new Map<string, ReleaseEvent[]>();

    for (const release of releases) {
      const d = parseISO(release.release_date);
      const monthKey = format(d, 'yyyy-MM');
      const list = map.get(monthKey) || [];
      list.push(release);
      map.set(monthKey, list);
    }

    for (const [monthKey, items] of map.entries()) {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const raw = format(date, 'MMMM yyyy', { locale: ptBR });
      const monthLabel = raw.charAt(0).toUpperCase() + raw.slice(1);
      groups.push({ monthKey, monthLabel, items });
    }

    return groups;
  }, [releases]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full bg-zinc-800/60 rounded-xl" />
        <Skeleton className="h-32 w-full bg-zinc-800/60 rounded-xl" />
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-8 sm:p-12 border border-zinc-800 text-center max-w-lg mx-auto shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <CalendarX2 className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Nenhum lançamento encontrado</h3>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          Você não possui filmes ou novos episódios agendados para este filtro. Explore novos títulos e adicione à sua lista para acompanhar seu calendário pessoal!
        </p>
        <Link href="/explore">
          <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2">
            <Compass className="w-4 h-4" />
            Explorar Novos Títulos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedReleases.map(group => (
        <div key={group.monthKey} className="bg-zinc-900 rounded-xl p-3 md:p-5 border border-zinc-800 shadow-sm">
          {/* Timeline Month Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {group.monthLabel}
              </h2>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 font-medium">
              {group.items.length} {group.items.length === 1 ? 'lançamento' : 'lançamentos'}
            </span>
          </div>

          {/* Releases List in Month */}
          <div className="space-y-3">
            {group.items.map(release => {
              const isMovie = release.media.media_type === 'movie';
              const isDuplicateTitle = isMovie && release.title.trim().toLowerCase() === release.media.title.trim().toLowerCase();
              const cleanTitle = isDuplicateTitle
                ? "Lançamento nos Cinemas / Streaming"
                : release.title.replace(/Lancamento/gi, 'Lançamento');

              const releaseDate = parseISO(release.release_date);

              return (
                <div 
                  key={release.id} 
                  className="flex items-center gap-3 md:gap-4 bg-zinc-800/80 hover:bg-zinc-800 p-3 rounded-xl border border-zinc-700/60 transition-all cursor-pointer group"
                  onClick={() => setSelectedEvent(release)}
                >
                  {/* Date Block */}
                  <div className="flex-shrink-0 w-16 md:w-20 text-center py-1 px-1 rounded-lg bg-zinc-900/60 border border-zinc-700/40">
                    <div className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">
                      {format(releaseDate, 'EEE', { locale: ptBR })}
                    </div>
                    <div className="text-xl md:text-2xl font-black text-white">
                      {format(releaseDate, 'dd')}
                    </div>
                  </div>

                  {/* Poster Thumbnail */}
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

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-base md:text-lg group-hover:text-red-400 transition-colors truncate">
                        {release.media.title}
                      </h3>
                      <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border ${
                        isMovie
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {isMovie ? 'Filme' : 'Série'}
                      </span>
                      {!isMovie && release.season_number != null && release.episode_number != null && (
                        <span className="text-[10px] text-amber-400 font-medium shrink-0">
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
        </div>
      ))}

      <ReleaseDetailsSheet 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        release={selectedEvent} 
      />
    </div>
  );
}
