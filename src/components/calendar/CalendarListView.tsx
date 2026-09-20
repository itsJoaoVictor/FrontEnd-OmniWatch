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
    return <div className="text-center text-zinc-500 py-12">Nenhum lançamento futuro encontrado.</div>;
  }

  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
      <div className="space-y-4">
        {releases.map(release => (
          <div 
            key={release.id} 
            className="flex items-center gap-4 bg-zinc-800 p-3 rounded-lg border border-zinc-700 hover:bg-zinc-750 cursor-pointer"
            onClick={() => setSelectedEvent(release)}
          >
            <div className="flex-shrink-0 w-20 text-center">
              <div className="text-xs text-zinc-400 uppercase font-bold">{format(parseISO(release.release_date), 'MMM yyyy', { locale: ptBR })}</div>
              <div className="text-2xl font-bold text-white">{format(parseISO(release.release_date), 'dd')}</div>
            </div>
            {release.media.poster_path ? (
              <img src={`https://image.tmdb.org/t/p/w92${release.media.poster_path}`} className="w-12 h-18 object-cover rounded" alt="poster" />
            ) : (
              <div className="w-12 h-18 bg-zinc-700 rounded flex items-center justify-center">?</div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg">{release.media.title}</h3>
              <p className="text-zinc-400 text-sm">{release.title}</p>
            </div>
          </div>
        ))}
      </div>

      <ReleaseDetailsSheet 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        release={selectedEvent} 
      />
    </div>
  );
}
