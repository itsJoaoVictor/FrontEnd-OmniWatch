"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ReleaseEvent } from '@/types/calendar';
import { ReleaseDetailsSheet } from './ReleaseDetailsSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { getDaysInMonth, startOfMonth, getDay, format } from 'date-fns';
import { parseReleaseDate } from '@/lib/dateUtils';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarX2, Compass, ChevronRight } from 'lucide-react';

interface CalendarGridViewProps {
  releases: ReleaseEvent[];
  loading: boolean;
  currentMonth: string;
  selectedDay?: number | null;
  onSelectDay?: (day: number | null) => void;
  selectedEventId?: string | null;
  onSelectEventId?: (id: string | null) => void;
}

export function CalendarGridView({
  releases,
  loading,
  currentMonth,
  selectedDay: propSelectedDay,
  onSelectDay,
  selectedEventId,
  onSelectEventId,
}: CalendarGridViewProps) {
  const [internalSelectedEvent, setInternalSelectedEvent] = useState<ReleaseEvent | null>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);

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

  const [internalSelectedDay, setInternalSelectedDay] = useState<number | null>(() => {
    if (propSelectedDay !== undefined) return propSelectedDay;
    if (now.getFullYear() === year && now.getMonth() === month) {
      return now.getDate();
    }
    return null;
  });

  const selectedDay = propSelectedDay !== undefined ? propSelectedDay : internalSelectedDay;
  const [focusedDay, setFocusedDay] = useState<number | null>(null);
  const dayButtonsRef = useRef<Map<number, HTMLButtonElement>>(new Map());

  const activeFocusDay = focusedDay ?? selectedDay ?? todayDay ?? 1;

  const navigateFocusDay = (targetDay: number) => {
    const clamped = Math.max(1, Math.min(daysInMonth, targetDay));
    setFocusedDay(clamped);
    const btn = dayButtonsRef.current.get(clamped);
    if (btn) {
      btn.focus();
    }
  };

  const handleSelectDay = (d: number | null) => {
    if (onSelectDay) {
      onSelectDay(d);
    } else {
      setInternalSelectedDay(d);
    }
  };

  // Sync selected event from prop or internal
  useEffect(() => {
    if (selectedEventId) {
      const found = releases.find(r => r.id === selectedEventId);
      if (found) {
        setInternalSelectedEvent(found);
      }
    } else if (selectedEventId === null) {
      setInternalSelectedEvent(null);
    }
  }, [selectedEventId, releases]);

  const handleOpenEvent = (event: ReleaseEvent) => {
    setInternalSelectedEvent(event);
    if (onSelectEventId) {
      onSelectEventId(event.id);
    }
  };

  const handleCloseEvent = () => {
    setInternalSelectedEvent(null);
    if (onSelectEventId) {
      onSelectEventId(null);
    }
  };

  const releasesByDay = React.useMemo(() => {
    const map = new Map<number, ReleaseEvent[]>();
    for (const r of releases) {
      const d = parseReleaseDate(r.release_date);
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
    if (propSelectedDay !== undefined && propSelectedDay !== null) {
      return;
    }
    if (isCurrentMonth) {
      handleSelectDay(now.getDate());
    } else {
      const firstWithRelease = releases.find(r => {
        const d = parseReleaseDate(r.release_date);
        return d.getMonth() === month && d.getFullYear() === year;
      });
      if (firstWithRelease) {
        handleSelectDay(parseReleaseDate(firstWithRelease.release_date).getDate());
      } else {
        handleSelectDay(1);
      }
    }
  }, [currentMonth, releases, isCurrentMonth, propSelectedDay]);

  const handleDayClick = (d: number, hasReleases: boolean) => {
    handleSelectDay(d);
    if (typeof window !== 'undefined' && window.innerWidth < 768 && hasReleases) {
      setTimeout(() => {
        mobileDrawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-3 md:p-4 border border-border space-y-3">
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full bg-muted/80 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {Array.from({ length: 28 }).map((_, i) => (
            <Skeleton key={i} className="h-14 md:h-28 w-full bg-muted/50 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const selectedDayReleases = selectedDay ? getReleasesForDay(selectedDay) : [];

  return (
    <div className="bg-card rounded-xl p-3 md:p-4 border border-border shadow-sm">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 text-center text-muted-foreground font-semibold mb-2 text-xs md:text-sm">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 gap-1 md:gap-2" role="grid" aria-label={`Calendário de ${format(date, 'MMMM yyyy', { locale: ptBR })}`}>
        {blanks.map(b => (
          <div key={`blank-${b}`} className="min-h-[52px] md:h-28 bg-muted/20 rounded-xl border border-border/30" aria-hidden="true" />
        ))}
        {days.map(d => {
          const dayReleases = getReleasesForDay(d);
          const isToday = d === todayDay;
          const isSelected = d === selectedDay;
          const hasReleases = dayReleases.length > 0;
          const dayDate = new Date(year, month, d);
          const formattedDayLabel = `${d} de ${format(dayDate, 'MMMM', { locale: ptBR })}${
            hasReleases ? `, ${dayReleases.length} ${dayReleases.length === 1 ? 'lançamento' : 'lançamentos'}` : ', nenhum lançamento'
          }`;

          return (
            <button
              type="button"
              role="gridcell"
              key={d}
              ref={(el) => {
                if (el) {
                  dayButtonsRef.current.set(d, el);
                } else {
                  dayButtonsRef.current.delete(d);
                }
              }}
              tabIndex={d === activeFocusDay ? 0 : -1}
              onClick={() => handleDayClick(d, hasReleases)}
              onFocus={() => setFocusedDay(d)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  navigateFocusDay(d + 1);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  navigateFocusDay(d - 1);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  navigateFocusDay(d + 7);
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  navigateFocusDay(d - 7);
                } else if (e.key === 'Home') {
                  e.preventDefault();
                  navigateFocusDay(1);
                } else if (e.key === 'End') {
                  e.preventDefault();
                  navigateFocusDay(daysInMonth);
                } else if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDayClick(d, hasReleases);
                }
              }}
              aria-label={formattedDayLabel}
              aria-selected={isSelected}
              className={`min-h-[52px] md:h-28 rounded-xl p-1 md:p-1.5 border text-left transition-all cursor-pointer flex flex-col justify-between md:justify-start relative outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:z-10 ${
                isSelected
                  ? 'bg-muted border-red-500 ring-2 ring-red-500/40 shadow-lg'
                  : isToday
                  ? 'bg-muted/90 border-red-500/60 ring-1 ring-red-500/30'
                  : 'bg-card hover:bg-muted/60 border-border'
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
                        ? 'text-red-500 font-bold'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {d}
                  </span>
                  {isToday && (
                    <span className="hidden lg:inline-block text-[10px] uppercase font-bold text-red-500 tracking-wider">
                      Hoje
                    </span>
                  )}
                </div>

                {/* Desktop releases count */}
                {hasReleases && (
                  <span className="hidden md:inline-block text-[10px] text-muted-foreground font-normal">
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

              {/* DESKTOP ONLY: Full Event Cards with Series Title + Episode Code */}
              <div className="hidden md:flex flex-col gap-1 mt-1 overflow-y-auto max-h-[82px] pr-0.5 w-full">
                {dayReleases.map(release => {
                  const isTv = release.media.media_type === 'tv';
                  return (
                    <div
                      key={release.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEvent(release);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          e.preventDefault();
                          handleOpenEvent(release);
                        }
                      }}
                      className={`text-left text-xs rounded p-1 truncate transition-colors flex items-center gap-1.5 border cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-white ${
                        !isTv
                          ? 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 border-sky-500/25'
                          : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border-amber-500/25'
                      }`}
                      title={`${isTv ? 'Série' : 'Filme'}: ${release.media.title}${release.title ? ` • ${release.title}` : ''}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!isTv ? 'bg-sky-400' : 'bg-amber-400'}`} />
                      <span className="truncate font-medium text-zinc-100 flex-1 text-[11px]">
                        {release.media.title}
                      </span>
                      {isTv && release.season_number != null && release.episode_number != null ? (
                        <span className="text-[10px] text-amber-400/90 font-mono font-semibold shrink-0">
                          T{release.season_number}E{release.episode_number}
                        </span>
                      ) : !isTv ? (
                        <span className="text-[9px] text-sky-400/80 uppercase font-semibold shrink-0">
                          Filme
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Empty Month Banner / Call to Action */}
      {releases.length === 0 && (
        <div className="mt-4 p-4 sm:p-5 bg-muted/40 rounded-xl border border-border text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <CalendarX2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Nenhum lançamento previsto para este mês</h2>
              <p className="text-xs text-muted-foreground">Adicione filmes e séries à sua lista para preencher este mês no calendário.</p>
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
      <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-5 mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400 shadow-sm" />
          <span className="text-foreground font-medium">Filme</span>
          <span className="text-muted-foreground text-[11px]">(Cinema / Streaming)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
          <span className="text-foreground font-medium">Série</span>
          <span className="text-muted-foreground text-[11px]">(Novo Episódio)</span>
        </div>
      </div>

      {/* MOBILE ONLY: Selected Day Events Drawer / Panel (omitted if entire month is empty) */}
      {releases.length > 0 && (
        <div ref={mobileDrawerRef} className="block md:hidden mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {selectedDay ? (
              <>
                Lançamentos em{' '}
                <span className="text-foreground font-bold">
                  {format(new Date(year, month, selectedDay), "dd 'de' MMMM", { locale: ptBR })}
                </span>
              </>
            ) : (
              "Selecione um dia no calendário"
            )}
          </h2>
          {selectedDayReleases.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/30 font-medium">
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
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenEvent(release)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenEvent(release);
                      }
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-card hover:bg-muted/70 border border-border active:scale-[0.99] transition-all cursor-pointer min-h-[56px] outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    {release.media.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${release.media.poster_path}`}
                        alt={release.media.title}
                        className="w-11 h-16 object-cover rounded-lg bg-muted shrink-0 shadow-sm"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-11 h-16 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground shrink-0">
                        🎬
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate">{release.media.title}</h3>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {release.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border ${
                          isMovie 
                            ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30' 
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                        }`}>
                          {isMovie ? 'Filme' : 'Série'}
                        </span>
                        {!isMovie && release.season_number != null && release.episode_number != null && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium font-mono">
                            T{release.season_number}E{release.episode_number}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 shrink-0 text-red-500 inline-flex items-center gap-1">
                      Ver <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            // If the whole month is empty, the empty banner already appeared above. Show a simplified line to avoid duplication.
            releases.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhum evento neste dia.</p>
            ) : (
              <div className="py-6 px-4 text-center bg-muted/30 rounded-xl border border-border flex flex-col items-center justify-center">
                <CalendarX2 className="w-6 h-6 text-muted-foreground mb-1.5" />
                <p className="text-xs text-muted-foreground">Nenhum lançamento previsto para este dia.</p>
                <Link href="/explore" className="text-xs text-red-500 hover:text-red-600 font-semibold mt-2 inline-flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" />
                  Explorar novos títulos &rarr;
                </Link>
              </div>
            )
          )
        ) : (
          <div className="py-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-border">
            Toque em um dia no calendário para ver os detalhes.
          </div>
        )}
      </div>
      )}

      <ReleaseDetailsSheet 
        isOpen={!!internalSelectedEvent} 
        onClose={handleCloseEvent} 
        release={internalSelectedEvent} 
      />
    </div>
  );
}
