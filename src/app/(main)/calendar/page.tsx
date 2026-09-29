"use client";

import React, { useState, useEffect } from 'react';
import { CalendarGridView } from '@/components/calendar/CalendarGridView';
import { CalendarListView } from '@/components/calendar/CalendarListView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ReleaseEvent } from '@/types/calendar';
import { api } from '@/lib/axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parse, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarPage() {
  const [gridReleases, setGridReleases] = useState<ReleaseEvent[]>([]);
  const [agendaReleases, setAgendaReleases] = useState<ReleaseEvent[]>([]);
  const [gridLoading, setGridLoading] = useState(true);
  const [agendaLoading, setAgendaLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grid');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthCacheRef = React.useRef<Record<string, ReleaseEvent[]>>({});

  const goToPreviousMonth = () => {
    const parsed = parse(currentMonth, 'yyyy-MM', new Date());
    const prev = subMonths(parsed, 1);
    setCurrentMonth(format(prev, 'yyyy-MM'));
  };

  const goToNextMonth = () => {
    const parsed = parse(currentMonth, 'yyyy-MM', new Date());
    const next = addMonths(parsed, 1);
    setCurrentMonth(format(next, 'yyyy-MM'));
  };

  const goToCurrentMonth = () => {
    const d = new Date();
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const currentMonthDate = parse(currentMonth, 'yyyy-MM', new Date());
  const formattedMonth = format(currentMonthDate, 'MMMM yyyy', { locale: ptBR });
  const displayMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  const now = new Date();
  const todayMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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

  // Busca todos os lançamentos futuros da agenda
  useEffect(() => {
    const fetchAgenda = async () => {
      setAgendaLoading(true);
      try {
        const res = await api.get('/api/calendar/my-releases');
        setAgendaReleases(res.data);
      } catch (error) {
        console.error('Error fetching agenda releases:', error);
      } finally {
        setAgendaLoading(false);
      }
    };

    fetchAgenda();
  }, []);

  const activeReleases = activeTab === 'grid' ? gridReleases : agendaReleases;
  const activeLoading = activeTab === 'grid' ? gridLoading : agendaLoading;

  const counts = React.useMemo(() => {
    const movies = activeReleases.filter(r => r.media.media_type === 'movie').length;
    const tv = activeReleases.filter(r => r.media.media_type === 'tv').length;
    return {
      all: activeReleases.length,
      movie: movies,
      tv: tv,
    };
  }, [activeReleases]);

  const filteredReleases = React.useMemo(() => {
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
              className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg"
              title="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 px-2">
              <span className="text-sm font-semibold text-white min-w-[130px] text-center">
                {displayMonth}
              </span>
              {!isCurrentMonthNow && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToCurrentMonth}
                  className="h-7 text-xs px-2 border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md"
                >
                  Hoje
                </Button>
              )}
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToNextMonth}
              className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg"
              title="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <TabsList className="bg-secondary/50 w-full sm:w-auto p-1 h-auto">
            <TabsTrigger value="grid" className="flex-1 sm:flex-initial px-4 py-1.5 flex items-center justify-center gap-2">
              <span>Grade (Mensal)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {gridReleases.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex-1 sm:flex-initial px-4 py-1.5 flex items-center justify-center gap-2">
              <span>Lista (Agenda)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {agendaReleases.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Chips de Filtro por Tipo de Mídia */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setMediaFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shrink-0 ${
                mediaFilter === 'all'
                  ? 'bg-red-600 border-red-500 text-white shadow-sm'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
            >
              <span>Todos</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                mediaFilter === 'all' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setMediaFilter('movie')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shrink-0 ${
                mediaFilter === 'movie'
                  ? 'bg-sky-600 border-sky-500 text-white shadow-sm'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
            >
              <span>🎬 Filmes</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                mediaFilter === 'movie' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {counts.movie}
              </span>
            </button>

            <button
              onClick={() => setMediaFilter('tv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shrink-0 ${
                mediaFilter === 'tv'
                  ? 'bg-amber-600 border-amber-500 text-white shadow-sm'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
            >
              <span>📺 Séries</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                mediaFilter === 'tv' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {counts.tv}
              </span>
            </button>
          </div>
        </div>

        <TabsContent value="grid">
          <CalendarGridView releases={filteredReleases} loading={gridLoading} currentMonth={currentMonth} />
        </TabsContent>
        <TabsContent value="list">
          <CalendarListView releases={filteredReleases} loading={agendaLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
