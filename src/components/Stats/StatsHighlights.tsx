'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Compass, Sparkles, Award, Clapperboard, Film, Tv, Flame, Share2, Check } from 'lucide-react';
import { StatisticsResponse, MediaTypeFilter, PeriodFilter } from './types';
import { formatWatchTime, formatSimpleDuration } from './StatsKpiCards';

interface StatsHighlightsProps {
  data: StatisticsResponse;
  mediaType?: MediaTypeFilter;
  period?: PeriodFilter;
}

export function StatsHighlights({ data, mediaType = 'all' }: StatsHighlightsProps) {
  const totalMinutes = data.totalTime || 0;
  if (totalMinutes <= 0) return null;

  // 1. Equivalência de Tempo no Mundo Real
  // Circunavegação da Terra de avião comercial a jato (~45.000 km a ~900 km/h) = ~48h de voo (~2.880 min)
  const worldTrips = (totalMinutes / 2880).toFixed(1);
  const totalDays = Math.floor(totalMinutes / 1440);

  // 2. DNA de Consumo: Ratio Séries vs Filmes
  const tvMins = data.totalTimeTv || 0;
  const movieMins = data.totalTimeMovies || 0;
  const isSeriesDominant = tvMins > movieMins;
  const dominantPercent = Math.round((Math.max(tvMins, movieMins) / totalMinutes) * 100);

  let dnaTitle = 'Perfil Equilibrado';
  let dnaIcon = <Sparkles className="w-4 h-4 text-amber-400" />;
  let dnaBadge = 'Multiverso';
  let dnaDesc = 'Equilíbrio notável entre produções cinematográficas e maratonas de séries.';

  if (dominantPercent >= 65) {
    if (isSeriesDominant) {
      dnaTitle = 'Serial Binger';
      dnaIcon = <Tv className="w-4 h-4 text-blue-400" />;
      dnaBadge = 'Maratonista';
      dnaDesc = `${dominantPercent}% do seu tempo foi imerso em temporadas e sagas televisivas.`;
    } else {
      dnaTitle = 'Cinéfilo Devoto';
      dnaIcon = <Film className="w-4 h-4 text-purple-400" />;
      dnaBadge = 'Cineasta';
      dnaDesc = `${dominantPercent}% do seu tempo foi dedicado a filmes e narrativas em longa-metragem.`;
    }
  }

  // 3. Assinatura do Universo: Top Talento (Ator / Diretor)
  const topCast = data.rankings?.cast?.[0];
  const topDirector = data.rankings?.directors?.[0];

  // 4. Conquista de Conclusão / Foco
  const completionRate = data.kpis?.completionRate ?? 0;
  let focusTitle = 'Explorador Curioso';
  let focusBadge = 'Descobridor';
  let focusDesc = 'Gosta de experimentar novos títulos e explorar múltiplos universos.';

  if (completionRate >= 80) {
    focusTitle = 'Finalizador Implacável';
    focusBadge = '100% Foco';
    focusDesc = `Você conclui ${completionRate}% de tudo o que inicia. Quase nada fica pela metade!`;
  } else if (completionRate >= 50) {
    focusTitle = 'Espectador Fiel';
    focusBadge = 'Consistente';
    focusDesc = `${completionRate}% de taxa de conclusão da sua fila, mantendo ótimo ritmo de encerramento.`;
  }

  const [copied, setCopied] = React.useState(false);

  const handleShareHighlights = () => {
    const timeFormatted = totalDays > 0 ? `${totalDays} dias` : `${Math.floor(totalMinutes / 60)}h`;
    const summary = `✨ OmniWatch Highlights | ${timeFormatted} assistidos • Perfil: ${dnaTitle} (${dnaBadge}) • Conclusão: ${completionRate}%!`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            OmniWatch Highlights
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-zinc-500 hidden sm:inline">Insights baseados no seu consumo</span>
          <button
            type="button"
            onClick={handleShareHighlights}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer"
            title="Compartilhar Destaques"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Compartilhar</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Equivalência no Mundo Real */}
        <Card className="bg-gradient-to-br from-blue-950/20 via-zinc-900/60 to-zinc-900/40 border-zinc-800/80 backdrop-blur-md relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all" />
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                  Viagem no Tempo
                </span>
                <Globe className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {totalDays > 0 ? `${totalDays} dias` : `${Math.floor(totalMinutes / 60)}h`} de tela
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                {Number(worldTrips) >= 1 ? (
                  <>
                    Tempo equivalente a <strong className="text-zinc-200">{worldTrips} voltas ao mundo</strong> em voo comercial contínuo.
                  </>
                ) : (
                  <>
                    Mais de <strong className="text-zinc-200">{Math.floor(totalMinutes / 60)} horas</strong> de histórias e vivências registradas.
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: DNA de Consumo */}
        <Card className="bg-gradient-to-br from-purple-950/20 via-zinc-900/60 to-zinc-900/40 border-zinc-800/80 backdrop-blur-md relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all" />
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                  {dnaBadge}
                </span>
                {dnaIcon}
              </div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {dnaTitle}
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                {dnaDesc}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Assinatura do Universo (Ator / Diretor) */}
        {(() => {
          const targetPersonId = topCast?.person_id || topDirector?.person_id;
          const targetProfilePath = topCast?.profile_path || topDirector?.profile_path;
          const targetHref = targetPersonId ? `/person/${targetPersonId}` : null;
          const targetName = topCast?.name || topDirector?.name || 'Talento';

          const cardElement = (
            <Card
              className={`bg-gradient-to-br from-amber-950/20 via-zinc-900/60 to-zinc-900/40 border-zinc-800/80 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300 h-full ${
                targetHref ? 'cursor-pointer hover:shadow-lg hover:shadow-amber-500/10' : ''
              }`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all" />
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      Rosto do Universo
                    </span>
                    <Clapperboard className="w-4 h-4 text-amber-400" />
                  </div>
                  {topCast ? (
                    <>
                      <div className="flex items-center gap-3 my-1.5">
                        {targetProfilePath && (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${targetProfilePath}`}
                            alt={topCast.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-amber-500/40 shadow-md shadow-amber-500/20 shrink-0 group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-extrabold text-white tracking-tight truncate group-hover:text-amber-400 transition-colors" title={topCast.name}>
                            {topCast.name}
                          </h3>
                          <span className="text-[11px] text-zinc-400 font-medium block truncate">
                            {topCast.count} {topCast.count === 1 ? 'obra assistida' : 'obras assistidas'}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                        Presente em <strong className="text-zinc-200">{topCast.count} {topCast.count === 1 ? 'obra' : 'obras'}</strong> ({formatSimpleDuration(topCast.totalTime)} de tela) no seu perfil.
                      </p>
                      {targetHref && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-amber-400/90 group-hover:text-amber-300 transition-colors">
                          <span>Ver perfil completo</span>
                          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                        </div>
                      )}
                    </>
                  ) : topDirector ? (
                    <>
                      <div className="flex items-center gap-3 my-1.5">
                        {targetProfilePath && (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${targetProfilePath}`}
                            alt={topDirector.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-amber-500/40 shadow-md shadow-amber-500/20 shrink-0 group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-extrabold text-white tracking-tight truncate group-hover:text-amber-400 transition-colors" title={topDirector.name}>
                            {topDirector.name}
                          </h3>
                          <span className="text-[11px] text-zinc-400 font-medium block truncate">
                            {topDirector.count} produções
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                        Diretor mais presente no seu catálogo com <strong className="text-zinc-200">{topDirector.count} produções</strong> ({formatSimpleDuration(topDirector.totalTime)}).
                      </p>
                      {targetHref && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-amber-400/90 group-hover:text-amber-300 transition-colors">
                          <span>Ver perfil completo</span>
                          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="text-base font-extrabold text-white tracking-tight">
                        Elenco Estelar
                      </h3>
                      <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                        Continue assistindo para destacar os artistas e diretores favoritos do seu perfil.
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );

          if (targetHref) {
            return (
              <Link
                href={targetHref}
                className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 transition-transform active:scale-[0.99]"
                aria-label={`Ver perfil de ${targetName}`}
              >
                {cardElement}
              </Link>
            );
          }

          return cardElement;
        })()}

        {/* Card 4: Foco & Conclusão */}
        <Card className="bg-gradient-to-br from-emerald-950/20 via-zinc-900/60 to-zinc-900/40 border-zinc-800/80 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {focusBadge}
                </span>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {focusTitle}
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                {focusDesc}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
