"use client";

import React, { useState, useEffect } from 'react';
import { ReleaseEvent } from '@/types/calendar';
import { ReleaseDetailsSheet } from './ReleaseDetailsSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { getDaysInMonth, startOfMonth, getDay, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarX2, Compass } from 'lucide-react';

interface CalendarGridViewProps {
  releases: ReleaseEvent[];
  loading: boolean;
  currentMonth: string;
}

export function CalendarGridView({ releases, loading, currentMonth }: CalendarGridViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<ReleaseEvent | null>(null);

  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const date = new Date(year, month, 1);
  const daysInMonth = getDaysInMonth(date);
  const startDay = getDay(startOfMonth(date));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => i);

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
  const todayDay = isCurrentMonth ? now.getDate() : null;

  const [selectedDay, setSelectedDay] = useState<number | null>(() => {
    const current = new Date();
    if (current.getFullYear() === year && current.getMonth() === month) {
      return current.getDate();
    }
    return null;
  });

  const releasesByDay = React.useMemo(() => {
    const map = new Map<number, ReleaseEvent[]>();
    for (const r of releases) {
      const d = parseISO(r.release_date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        const list = map.get(day) || [];
        list.push(r);
        map.set(day, list);
      }
    }
    return map;
  }, [releases, month, year]);

  const getReleasesForDay = (day: number) => {
    return releasesByDay.get(day) || [];
  };

  useEffect(() => {
    if (isCurrentMonth) {
      setSelectedDay(now.getDate());
    } else {
      const firstWithRelease = releases.find(r => {
        const d = parseISO(r.release_date);
        return d.getMonth() === month && d.getFullYear() === year;
      });
      if (firstWithRelease) {
        setSelectedDay(parseISO(firstWithRelease.release_date).getDate());
      } else {
        setSelectedDay(1);
      }
    }
  }, [currentMonth, releases]);

  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-xl p-3 md:p-4 border border-zinc-800 space-y-3">
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full bg-zinc-800/80 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {Array.from({ length: 28 }).map((_, i) => (
            <Skeleton key={i} className="h-14 md:h-28 w-full bg-zinc-800/50 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const selectedDayReleases = selectedDay ? getReleasesForDay(selectedDay) : [];

  return (
    <div className="bg-zinc-900 rounded-xl p-3 md:p-4 border border-zinc-800 shadow-sm">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 text-center text-zinc-400 font-semibold mb-2 text-xs md:text-sm">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {blanks.map(b => (
          <div key={`blank-${b}`} className="min-h-[52px] md:h-28 bg-zinc-800/10 rounded-xl border border-zinc-800/20" />
        ))}
        {days.map(d => {
          const dayReleases = getReleasesForDay(d);
          const isToday = d === todayDay;
          const isSelected = d === selectedDay;
          const hasReleases = dayReleases.length > 0;

          return (
            <div
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`min-h-[52px] md:h-28 rounded-xl p-1 md:p-1.5 border transition-all cursor-pointer flex flex-col justify-between md:justify-start relative ${
                isSelected
                  ? 'bg-zinc-800 border-red-500 ring-2 ring-red-500/40 shadow-lg'
                  : isToday
                  ? 'bg-zinc-800/90 border-red-500/60 ring-1 ring-red-500/30'
                  : 'bg-zinc-800/40 hover:bg-zinc-800/80 border-zinc-750'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold flex items-center justify-center transition-colors ${
                      isToday
                        ? 'w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-600 text-white shadow-sm font-black'
                        : isSelected
                        ? 'text-red-400 font-bold'
                        : 'text-zinc-400'
                    }`}
                  >
                    {d}
                  </span>
                  {isToday && (
                    <span className="hidden lg:inline-block text-[10px] uppercase font-bold text-red-400 tracking-wider">
                      Hoje
                    </span>
                  )}
                </div>

                {/* Desktop releases count */}
                {hasReleases && (
                  <span className="hidden md:inline-block text-[10px] text-zinc-400 font-normal">
                    {dayReleases.length} {dayReleases.length === 1 ? 'evento' : 'eventos'}
                  </span>
                )}
              </div>

              {/* MOBILE ONLY: Dot Indicators */}
              <div className="flex md:hidden items-center justify-center gap-1 my-auto h-3">
                {hasReleases && (
                  <>
                    {dayReleases.slice(0, 3).map((release, idx) => {
                      const isMovie = release.media.media_type === 'movie';
                      return (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full shadow-sm ${
                            isMovie ? 'bg-sky-400' : 'bg-amber-500'
                          }`}
                        />
                      );
                    })}
                    {dayReleases.length > 3 && (
                      <span className="text-[9px] font-bold text-red-400 leading-none">
                        +{dayReleases.length - 3}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* DESKTOP ONLY: Full Event Cards */}
              <div className="hidden md:flex flex-col gap-1 mt-1 overflow-y-auto max-h-[82px] pr-0.5">
                {dayReleases.map(release => {
                  const isMovie = release.media.media_type === 'movie';
                  return (
                    <button
                      key={release.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(release);
                      }}
                      className={`text-left text-xs rounded p-1 truncate transition-colors flex items-center gap-1.5 border ${
                        isMovie
                          ? 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 border-sky-500/25'
                          : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border-amber-500/25'
                      }`}
                      title={`${isMovie ? 'Filme' : 'Série'}: ${release.media.title} - ${release.title}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMovie ? 'bg-sky-400' : 'bg-amber-400'}`} />
                      <span className="truncate">{release.title || release.media.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty Month Banner / Call to Action */}
      {releases.length === 0 && (
        <div className="mt-4 p-4 sm:p-5 bg-zinc-800/40 rounded-xl border border-zinc-800 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <CalendarX2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Nenhum lançamento previsto para este mês</h4>
              <p className="text-xs text-zinc-400">Adicione filmes e séries à sua lista para preencher este mês no calendário.</p>
            </div>
          </div>
          <Link href="/explore">
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shrink-0 inline-flex items-center gap-1.5 shadow-sm">
              <Compass className="w-3.5 h-3.5" />
              Explorar Catálogo
            </Button>
          </Link>
        </div>
      )}

      {/* Mini-legenda cromática */}
      <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-5 mt-3 pt-3 border-t border-zinc-800/60 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400 shadow-sm" />
          <span className="text-zinc-300 font-medium">Filme</span>
          <span className="text-zinc-500 text-[11px]">(Cinema / Streaming)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
          <span className="text-zinc-300 font-medium">Série</span>
          <span className="text-zinc-500 text-[11px]">(Novo Episódio)</span>
        </div>
      </div>

      {/* MOBILE ONLY: Selected Day Events Drawer / Panel */}
      <div className="block md:hidden mt-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-300">
            {selectedDay ? (
              <>
                Lançamentos em{' '}
                <span className="text-white font-bold">
                  {format(new Date(year, month, selectedDay), "dd 'de' MMMM", { locale: ptBR })}
                </span>
              </>
            ) : (
              "Selecione um dia no calendário"
            )}
          </h3>
          {selectedDayReleases.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium">
              {selectedDayReleases.length} {selectedDayReleases.length === 1 ? 'evento' : 'eventos'}
            </span>
          )}
        </div>

        {selectedDay ? (
          selectedDayReleases.length > 0 ? (
            <div className="space-y-2">
              {selectedDayReleases.map(release => {
                const isMovie = release.media.media_type === 'movie';
                return (
                  <div
                    key={release.id}
                    onClick={() => setSelectedEvent(release)}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    {release.media.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${release.media.poster_path}`}
                        alt={release.media.title}
                        className="w-11 h-16 object-cover rounded bg-zinc-700 shrink-0 shadow-sm"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-11 h-16 bg-zinc-700/60 rounded flex items-center justify-center text-xs text-zinc-400 shrink-0">
                        🎬
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{release.media.title}</h4>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {release.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border ${
                          isMovie 
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' 
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {isMovie ? 'Filme' : 'Série'}
                        </span>
                        {!isMovie && release.season_number != null && release.episode_number != null && (
                          <span className="text-[10px] text-amber-400 font-medium">
                            T{release.season_number}E{release.episode_number}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 shrink-0 ${
                      isMovie ? 'text-sky-400 hover:text-sky-300' : 'text-amber-400 hover:text-amber-300'
                    }`}>
                      Ver &rarr;
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 px-4 text-center bg-zinc-800/30 rounded-xl border border-zinc-800/50 flex flex-col items-center justify-center">
              <CalendarX2 className="w-6 h-6 text-zinc-500 mb-1.5" />
              <p className="text-xs text-zinc-400">Nenhum lançamento previsto para este dia.</p>
              <Link href="/explore" className="text-xs text-red-400 hover:text-red-300 font-semibold mt-2 inline-flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" />
                Explorar novos títulos &rarr;
              </Link>
            </div>
          )
        ) : (
          <div className="py-6 text-center text-xs text-zinc-500 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
            Toque em um dia no calendário para ver os detalhes.
          </div>
        )}
      </div>

      <ReleaseDetailsSheet 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        release={selectedEvent} 
      />
    </div>
  );
}
