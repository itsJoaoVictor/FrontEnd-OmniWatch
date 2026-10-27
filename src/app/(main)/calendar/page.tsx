"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { CalendarGridView } from '@/components/calendar/CalendarGridView';
import { CalendarListView } from '@/components/calendar/CalendarListView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReleaseEvent } from '@/types/calendar';
import { api } from '@/lib/axios';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { format, parse, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthYearPickerModal } from '@/components/calendar/MonthYearPickerModal';

function CalendarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [gridReleases, setGridReleases] = useState<ReleaseEvent[]>([]);
  const [agendaReleases, setAgendaReleases] = useState<ReleaseEvent[]>([]);
  const [gridLoading, setGridLoading] = useState(true);
  const [agendaLoading, setAgendaLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const monthCacheRef = useRef<Record<string, ReleaseEvent[]>>({});
  const agendaFetchedRef = useRef(false);

  // Derivações da URL (Single Source of Truth)
  const now = useMemo(() => new Date(), []);
  const todayMonthStr = useMemo(
    () => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    [now]
  );

  const paramMonth = searchParams.get('month');
  const currentMonth = useMemo(() => {
    if (paramMonth && /^\d{4}-\d{2}$/.test(paramMonth)) {
      return paramMonth;
    }
    return todayMonthStr;
  }, [paramMonth, todayMonthStr]);

  const paramView = searchParams.get('view');
  const activeTab = paramView === 'grid' ? 'grid' : 'list';

  const paramType = searchParams.get('type');
  const mediaFilter = (paramType === 'movie' || paramType === 'tv') ? paramType : 'all';

  const paramDay = searchParams.get('day');
  const selectedDay = paramDay && !isNaN(Number(paramDay)) ? Number(paramDay) : null;

  const episodeModalId = searchParams.get('episode');

  // Atualização atômica de searchParams na URL
  const updateParam = useCallback(
    (updates: Record<string, string | null>, pushToHistory = false) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === undefined || val === '') {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
      const qs = params.toString();
      const targetUrl = qs ? `${pathname}?${qs}` : pathname;

      if (pushToHistory) {
        router.push(targetUrl, { scroll: false });
      } else {
        router.replace(targetUrl, { scroll: false });
      }
    },
    [router, pathname, searchParams]
  );

  // Ações de navegação de mês sincronizadas com a URL
  const goToPreviousMonth = useCallback(() => {
    const parsed = parse(currentMonth, 'yyyy-MM', new Date());
    const prev = subMonths(parsed, 1);
    const newMonthStr = format(prev, 'yyyy-MM');
    updateParam({ month: newMonthStr === todayMonthStr ? null : newMonthStr, day: null }, false);
  }, [currentMonth, todayMonthStr, updateParam]);

  const goToNextMonth = useCallback(() => {
    const parsed = parse(currentMonth, 'yyyy-MM', new Date());
    const next = addMonths(parsed, 1);
    const newMonthStr = format(next, 'yyyy-MM');
    updateParam({ month: newMonthStr === todayMonthStr ? null : newMonthStr, day: null }, false);
  }, [currentMonth, todayMonthStr, updateParam]);

  const goToCurrentMonth = useCallback(() => {
    updateParam({ month: null, day: null }, false);
  }, [updateParam]);

  const handleSelectMonth = useCallback(
    (monthStr: string) => {
      updateParam({ month: monthStr === todayMonthStr ? null : monthStr, day: null }, false);
    },
    [todayMonthStr, updateParam]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      updateParam({ view: value === 'list' ? null : 'grid' }, false);
    },
    [updateParam]
  );

  const handleFilterChange = useCallback(
    (type: 'all' | 'movie' | 'tv') => {
      updateParam({ type: type === 'all' ? null : type }, false);
    },
    [updateParam]
  );

  const handleSelectDay = useCallback(
    (day: number | null) => {
      updateParam({ day: day != null ? String(day) : null }, false);
    },
    [updateParam]
  );

  const handleSelectEventId = useCallback(
    (id: string | null) => {
      // Usar push ao abrir modal para permitir que o botão Voltar do navegador feche o modal
      updateParam({ episode: id }, id !== null);
    },
    [updateParam]
  );

  const currentMonthDate = useMemo(() => parse(currentMonth, 'yyyy-MM', new Date()), [currentMonth]);
  const formattedMonth = useMemo(() => format(currentMonthDate, 'MMMM yyyy', { locale: ptBR }), [currentMonthDate]);
  const displayMonth = useMemo(() => formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1), [formattedMonth]);
  const isCurrentMonthNow = currentMonth === todayMonthStr;

  // Busca lançamentos do mês selecionado com cache em memória
  useEffect(() => {
    const fetchMonth = async () => {
      if (monthCacheRef.current[currentMonth]) {
        setGridReleases(monthCacheRef.current[currentMonth]);
        setGridLoading(false);
        return;
      }

      setGridLoading(true);
      try {
        const res = await api.get('/api/calendar/my-releases', { params: { month: currentMonth } });
        monthCacheRef.current[currentMonth] = res.data;
        setGridReleases(res.data);
      } catch (error) {
        console.error('Error fetching calendar month releases:', error);
      } finally {
        setGridLoading(false);
      }
    };

    fetchMonth();
  }, [currentMonth]);

  // Função para buscar lançamentos da agenda sob demanda
  const fetchAgenda = useCallback(async () => {
    if (agendaFetchedRef.current) return;
    agendaFetchedRef.current = true;
    setAgendaLoading(true);
    try {
      const res = await api.get('/api/calendar/my-releases');
      setAgendaReleases(res.data);
    } catch (error) {
      agendaFetchedRef.current = false;
      console.error('Error fetching agenda releases:', error);
    } finally {
      setAgendaLoading(false);
    }
  }, []);

  // Carregamento sob demanda ao alternar para lista ou em idle
  useEffect(() => {
    if (activeTab === 'list') {
      fetchAgenda();
      return;
    }

    if (!gridLoading && !agendaFetchedRef.current) {
      const schedulePrefetch = typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? (window as any).requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 1000);

      const handle = schedulePrefetch(() => {
        fetchAgenda();
      });

      return () => {
        if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(handle);
        } else {
          clearTimeout(handle);
        }
      };
    }
  }, [activeTab, gridLoading, fetchAgenda]);

  const activeReleases = activeTab === 'grid' ? gridReleases : agendaReleases;

  const counts = useMemo(() => {
    const movies = activeReleases.filter(r => r.media.media_type === 'movie').length;
    const tv = activeReleases.filter(r => r.media.media_type === 'tv').length;
    return {
      all: activeReleases.length,
      movie: movies,
      tv: tv,
    };
  }, [activeReleases]);

  const filteredReleases = useMemo(() => {
    if (mediaFilter === 'all') return activeReleases;
    return activeReleases.filter(r => r.media.media_type === mediaFilter);
  }, [activeReleases, mediaFilter]);

  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 max-w-[1600px] mx-auto pb-32 md:pb-28">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">Calendário de Lançamentos</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">Acompanhe as estreias e novos episódios dos títulos que você segue</p>
        </div>

        {activeTab === 'grid' && (
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl w-full sm:w-auto justify-between sm:justify-start shadow-sm">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToPreviousMonth}
              className="h-11 w-11 sm:h-8 sm:w-8 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg shrink-0"
              title="Mês anterior"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Container com largura mínima estável para evitar layout shift com o botão Hoje */}
            <div className="flex items-center justify-center gap-1.5 px-1 min-w-[160px] sm:min-w-[185px]">
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-bold text-white hover:bg-zinc-800 transition-colors group cursor-pointer"
                title="Escolher mês e ano diretamente"
                aria-haspopup="dialog"
                aria-expanded={isPickerOpen}
              >
                <span>{displayMonth}</span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white transition-transform" />
              </button>
              {!isCurrentMonthNow && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToCurrentMonth}
                  className="h-7 text-xs px-2 border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md shrink-0"
                >
                  Hoje
                </Button>
              )}
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToNextMonth}
              className="h-11 w-11 sm:h-8 sm:w-8 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg shrink-0"
              title="Próximo mês"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          {/* Seletor de Abas com Área de Toque Ergonômica (min-h-[44px]) */}
          <TabsList className="bg-secondary/50 w-full sm:w-auto p-1 h-auto">
            <TabsTrigger 
              value="list" 
              className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold rounded-lg"
            >
              <span>Lista (Agenda)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {agendaReleases.length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="grid" 
              className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold rounded-lg"
            >
              <span>Grade (Mensal)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {gridReleases.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Chips de Filtro por Tipo com Área de Toque Otimizada (>= 44px) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className={`flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                mediaFilter === 'all'
                  ? 'bg-red-600 border-red-500 text-white shadow-sm'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
            >
              <span>Todos</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                mediaFilter === 'all' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('movie')}
              className={`flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                mediaFilter === 'movie'
                  ? 'bg-sky-600 border-sky-500 text-white shadow-sm'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
            >
              <span>🎬 Filmes</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                mediaFilter === 'movie' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {counts.movie}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('tv')}
              className={`flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                mediaFilter === 'tv'
                  ? 'bg-amber-600 border-amber-500 text-white shadow-sm'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
            >
              <span>📺 Séries</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                mediaFilter === 'tv' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {counts.tv}
              </span>
            </button>
          </div>
        </div>

        <TabsContent value="list">
          <CalendarListView 
            releases={filteredReleases} 
            loading={agendaLoading}
            selectedEventId={episodeModalId}
            onSelectEventId={handleSelectEventId}
          />
        </TabsContent>
        <TabsContent value="grid">
          <CalendarGridView 
            releases={filteredReleases} 
            loading={gridLoading} 
            currentMonth={currentMonth}
            selectedDay={selectedDay}
            onSelectDay={handleSelectDay}
            selectedEventId={episodeModalId}
            onSelectEventId={handleSelectEventId}
          />
        </TabsContent>
      </Tabs>

      <MonthYearPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        currentMonth={currentMonth}
        onSelectMonth={handleSelectMonth}
      />
    </div>
  );
}

function CalendarPageSkeleton() {
  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 max-w-[1600px] mx-auto pb-32 md:pb-28">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-64 bg-zinc-800/80 rounded-lg" />
        <Skeleton className="h-10 w-44 bg-zinc-800/80 rounded-lg" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full bg-zinc-800/60 rounded-xl" />
        <Skeleton className="h-96 w-full bg-zinc-800/40 rounded-xl" />
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarPageSkeleton />}>
      <CalendarContent />
    </Suspense>
  );
}
