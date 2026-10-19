'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StatBacklog, MediaTypeFilter } from './types';
import { 
  Hourglass, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Film, 
  Tv, 
  PlayCircle, 
  TrendingUp,
  Sliders,
  Flame,
  Zap
} from 'lucide-react';
import { formatSimpleDuration } from './StatsKpiCards';

interface StatsBacklogEstimatorProps {
  backlog: StatBacklog;
  mediaType?: MediaTypeFilter;
}

const PRESET_PACES = [
  { minutes: 30, label: '30 min', sublabel: '1 ep leve' },
  { minutes: 60, label: '1 hora', sublabel: 'Equilibrado' },
  { minutes: 90, label: '1h 30m', sublabel: '★ Recomendado' },
  { minutes: 120, label: '2 horas', sublabel: 'Cinéfilo' },
  { minutes: 180, label: '3 horas', sublabel: 'Maratonista' },
];

export function StatsBacklogEstimator({ backlog, mediaType = 'all' }: StatsBacklogEstimatorProps) {
  const [paceMinutes, setPaceMinutes] = useState<number>(90);

  // Carrega preferência do usuário salva no localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('omniwatch_backlog_pace_mins');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 15 && val <= 360) {
          setPaceMinutes(val);
        }
      }
    } catch {
      // Ignora erro de localStorage desabilitado
    }
  }, []);

  const handlePaceChange = (mins: number) => {
    setPaceMinutes(mins);
    try {
      localStorage.setItem('omniwatch_backlog_pace_mins', String(mins));
    } catch {
      // Ignora erro
    }
  };

  const totalMinutes = backlog?.totalMinutes || 0;
  if (totalMinutes <= 0) {
    return (
      <Card className="bg-gradient-to-br from-emerald-950/20 via-zinc-900/60 to-zinc-900/40 border-emerald-500/20 backdrop-blur-md">
        <CardContent className="p-6 flex items-center gap-4 text-emerald-400">
          <CheckCircle2 className="w-8 h-8 shrink-0" />
          <div>
            <h3 className="text-base font-bold text-white">Lista 100% Zerada!</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Você não tem nenhum filme ou série pendente no momento. Parabéns pelo foco!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Cálculos de Projeção em Tempo Real
  const daysNeeded = Math.ceil(totalMinutes / paceMinutes);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysNeeded);

  const formattedTargetDate = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(targetDate);

  // Relativo amigável
  let relativeDuration = '';
  if (daysNeeded < 30) {
    relativeDuration = `em ~${daysNeeded} ${daysNeeded === 1 ? 'dia' : 'dias'}`;
  } else if (daysNeeded < 365) {
    const months = Math.round(daysNeeded / 30);
    relativeDuration = `em ~${months} ${months === 1 ? 'mês' : 'meses'}`;
  } else {
    const years = (daysNeeded / 365).toFixed(1);
    relativeDuration = `em ~${years} anos (~${Math.round(daysNeeded / 30)} meses)`;
  }

  // Marco 1: Séries em Andamento (watching)
  const watchingMins = backlog.tvWatchingRemainingMinutes || 0;
  const watchingDays = watchingMins > 0 ? Math.ceil(watchingMins / paceMinutes) : 0;
  const watchingTargetDate = new Date();
  watchingTargetDate.setDate(watchingTargetDate.getDate() + watchingDays);
  const formattedWatchingDate = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(watchingTargetDate);

  // Dica de Antecipação
  const boostMins = paceMinutes <= 60 ? 30 : 30;
  const boostedPace = paceMinutes + boostMins;
  const boostedDays = Math.ceil(totalMinutes / boostedPace);
  const daysSaved = daysNeeded - boostedDays;

  // Formatação do ritmo escolhido
  const paceHours = Math.floor(paceMinutes / 60);
  const paceRemainingMins = paceMinutes % 60;
  const paceLabel = paceHours > 0 
    ? `${paceHours}h${paceRemainingMins > 0 ? ` ${paceRemainingMins}m` : ''}` 
    : `${paceRemainingMins} min`;

  return (
    <Card className="bg-gradient-to-br from-indigo-950/20 via-zinc-900/70 to-zinc-900/50 border-zinc-800/80 backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300 shadow-xl">
      {/* Luz ambiente de fundo */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/15 transition-all" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />

      <CardContent className="p-5 sm:p-6 relative z-10 space-y-6">
        {/* Cabeçalho do Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 flex items-center gap-1.5 shadow-sm">
                <Hourglass className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                Missão Zerar a Lista
              </span>
              <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded">
                Simulador Interativo
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Previsão de Término do Backlog
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
              Estima a data exata para concluir todos os títulos pendentes com base na meta diária de tempo que você escolher.
            </p>
          </div>

          {/* Badge Resumo de Volume */}
          <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800/90 rounded-xl px-3.5 py-2 shrink-0">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Carga Pendente</span>
              <span className="text-sm font-extrabold text-indigo-300">
                {formatSimpleDuration(totalMinutes)}
              </span>
              <span className="text-[10px] text-zinc-400 ml-1.5 font-medium">
                ({backlog.totalItems} {backlog.totalItems === 1 ? 'item' : 'itens'})
              </span>
            </div>
          </div>
        </div>

        {/* Grade de Composição da Fila Pendente */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Filmes em Quero Ver */}
          <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-zinc-400 block truncate">
                Filmes Quero Ver
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-white">
                  {backlog.moviesPlanCount}
                </span>
                <span className="text-[11px] text-zinc-400">
                  • {formatSimpleDuration(backlog.moviesPlanMinutes)}
                </span>
              </div>
            </div>
          </div>

          {/* Séries em Quero Ver */}
          <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
              <Tv className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-zinc-400 block truncate">
                Séries na Fila
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-white">
                  {backlog.tvPlanCount}
                </span>
                <span className="text-[11px] text-zinc-400">
                  • {formatSimpleDuration(backlog.tvPlanMinutes)}
                </span>
              </div>
            </div>
          </div>

          {/* Séries em Andamento (O que falta) */}
          <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
              <PlayCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-zinc-400 block truncate">
                Séries em Andamento
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-white">
                  {backlog.tvWatchingCount}
                </span>
                <span className="text-[11px] text-zinc-400 truncate">
                  ({backlog.tvWatchingRemainingEpisodes} eps • {formatSimpleDuration(backlog.tvWatchingRemainingMinutes)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Seletor Interativo de Ritmo de Consumo */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Quanto tempo você pretende assistir por dia?
              </span>
            </div>
            <span className="text-sm font-extrabold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20 self-start sm:self-auto">
              {paceLabel} / dia
            </span>
          </div>

          {/* Chips de Ritmo Pré-definidos */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PRESET_PACES.map((p) => {
              const isSelected = paceMinutes === p.minutes;
              return (
                <button
                  key={p.minutes}
                  type="button"
                  onClick={() => handlePaceChange(p.minutes)}
                  className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 scale-[1.02]'
                      : 'bg-zinc-900/60 text-zinc-300 border-zinc-800/80 hover:bg-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs font-bold block">{p.label}</span>
                  <span className={`text-[10px] block font-medium truncate ${isSelected ? 'text-indigo-100' : 'text-zinc-500'}`}>
                    {p.sublabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Slider Fino */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
              <span>15 min</span>
              <span>1 hora</span>
              <span>2 horas</span>
              <span>3 horas</span>
              <span>4 horas</span>
            </div>
            <input
              type="range"
              min={15}
              max={240}
              step={15}
              value={paceMinutes}
              onChange={(e) => handlePaceChange(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
            />
          </div>
        </div>

        {/* Bloco de Resultados e Projeção Dinâmica */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {/* Card Principal: Data Prevista */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-zinc-900/80 to-zinc-900/40 border border-indigo-500/30 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/20">
                  Data Prevista de Conclusão
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  ({relativeDuration})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tight capitalize">
                    {formattedTargetDate}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    No ritmo de <strong className="text-indigo-300">{paceLabel} por dia</strong>, restam <strong className="text-zinc-200">{daysNeeded} dias</strong> para zerar toda a sua fila atual.
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-marco: Séries em Andamento */}
            {watchingMins > 0 && (
              <div className="pt-3 border-t border-zinc-800/80 flex items-center gap-2.5 text-xs text-zinc-300">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong className="text-amber-300 font-bold">Etapa 1:</strong> Você zera todas as <strong>{backlog.tvWatchingCount} séries que já começou</strong> até <strong className="text-white underline decoration-amber-400/40">{formattedWatchingDate}</strong> (~{watchingDays} dias).
                </span>
              </div>
            )}
          </div>

          {/* Card Lateral: Otimização / Gamificação */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-4 h-4" />
                <span>Acelerar Meta</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Assistindo apenas <strong className="text-white">+{boostMins} min/dia</strong> (total de {paceMinutes + boostMins}m/dia):
              </p>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <span className="text-xs font-extrabold block">
                  🚀 Você antecipa o término em:
                </span>
                <span className="text-base font-black text-white">
                  {daysSaved >= 30 ? `~${Math.round(daysSaved / 30)} meses` : `~${daysSaved} dias`} mais cedo!
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500">
              💡 As estimativas consideram a duração exata de cada filme e o total oficial de episódios das temporadas.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
