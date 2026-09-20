"use client";

import React, { useState } from 'react';
import { ReleaseEvent } from '@/types/calendar';
import { ReleaseDetailsSheet } from './ReleaseDetailsSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { getDaysInMonth, startOfMonth, getDay, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarGridViewProps {
  releases: ReleaseEvent[];
  loading: boolean;
  currentMonth: string;
}

export function CalendarGridView({ releases, loading, currentMonth }: CalendarGridViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<ReleaseEvent | null>(null);

  if (loading) {
    return <div className="grid grid-cols-7 gap-2"><Skeleton className="h-32 w-full" /></div>;
  }

  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const date = new Date(year, month, 1);
  const daysInMonth = getDaysInMonth(date);
  const startDay = getDay(startOfMonth(date));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => i);

  const getReleasesForDay = (day: number) => {
    return releases.filter(r => {
      const d = parseISO(r.release_date);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
      <div className="grid grid-cols-7 gap-2 text-center text-zinc-400 font-semibold mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {blanks.map(b => <div key={`blank-${b}`} className="h-28 bg-zinc-800/20 rounded-md border border-zinc-800/30"></div>)}
        {days.map(d => {
          const dayReleases = getReleasesForDay(d);
          return (
            <div key={d} className="h-28 bg-zinc-800 rounded-md p-1 border border-zinc-700 overflow-y-auto">
              <div className="text-zinc-500 text-sm font-bold ml-1">{d}</div>
              <div className="flex flex-col gap-1 mt-1">
                {dayReleases.map(release => (
                  <button 
                    key={release.id} 
                    onClick={() => setSelectedEvent(release)}
                    className="text-left text-xs bg-red-600/20 hover:bg-red-600/40 text-red-100 border border-red-900 rounded p-1 truncate"
                  >
                    {release.title}
                  </button>
                ))}
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
