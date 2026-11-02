'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Star, Check, Play, Clock, Bookmark, Sparkles, XCircle, RotateCcw } from 'lucide-react';
import { SavedItem } from '@/store/useMyListStore';
import { PosterImage } from '@/components/shared/PosterImage';
import { FavoriteButton } from '@/components/shared/FavoriteButton';
import { AddToListButton } from '@/components/shared/AddToListButton';
import { cn } from '@/lib/utils';

interface LibraryCardProps {
  item: SavedItem;
  priority?: boolean;
}

export const LibraryCard = memo(function LibraryCard({ item, priority = false }: LibraryCardProps) {
  const tmdbId = item.tmdb_id;
  const mediaType = item.media_type || 'movie';
  const releaseYear = item.release_date ? String(item.release_date).substring(0, 4) : null;
  const isTv = mediaType === 'tv';
  const isWatching = item.status === 'watching';
  const isCompleted = item.status === 'completed';

  return (
    <Link
      href={`/${mediaType}/${tmdbId}`}
      className="group relative flex flex-col justify-between rounded-2xl bg-zinc-900/50 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700/80 p-2 sm:p-2.5 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1.5 cursor-pointer select-none min-w-0"
    >
      {/* ========================================= */}
      {/* ÁREA DO POSTER LIMPO E POLIDO             */}
      {/* ========================================= */}
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-zinc-950 shadow-sm border border-white/5">
        <PosterImage
          src={item.poster_path}
          fallbackSrc={item.backdrop_path}
          alt={item.title || 'Título'}
          title={item.title}
          type={mediaType}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          className="transition-transform duration-500 group-hover:scale-105"
        />

        {/* Micro-Badge de Tipo no Canto Superior Esquerdo */}
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-black/75 backdrop-blur-md text-zinc-300 uppercase tracking-wider border border-white/10">
            {isTv ? 'Série' : 'Filme'}
          </span>
        </div>

        {/* Botão de Favorito no Canto Superior Direito */}
        <div
          className="absolute top-1.5 right-1.5 z-10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <FavoriteButton
            tmdb_id={tmdbId}
            size="sm"
            className="w-7 h-7 bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/10 text-white shadow-md"
          />
        </div>

        {/* Micro-Badge de Avaliação no Rodapé Esquerdo */}
        {item.rating && item.rating > 0 ? (
          <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center gap-1 shadow-md pointer-events-none">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{item.rating.toFixed(1)}</span>
          </div>
        ) : (isCompleted || isWatching) ? (
          <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-zinc-400 text-[10px] font-medium border border-white/5 pointer-events-none">
            Sem nota
          </div>
        ) : null}

        {/* Badge de Rewatch se houver */}
        {item.rewatch_count && item.rewatch_count > 0 ? (
          <div className="absolute bottom-2 right-2 z-10 px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-zinc-950 font-bold text-[9px] flex items-center gap-0.5 shadow-md pointer-events-none">
            <RotateCcw className="w-2.5 h-2.5" />
            <span>{item.rewatch_count > 1 ? `${item.rewatch_count}x` : '2x'}</span>
          </div>
        ) : null}
      </div>

      {/* ========================================= */}
      {/* CORPO DE METADADOS INTEGRADO AO CONTAINER  */}
      {/* ========================================= */}
      <div className="pt-2.5 px-0.5 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <h3
            className="text-xs sm:text-sm font-semibold text-zinc-100 line-clamp-1 group-hover:text-rose-400 transition-colors"
            title={item.title}
          >
            {item.title}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-0.5">
            <span>{releaseYear || (isTv ? 'Série' : 'Filme')}</span>
            <span className="text-[10px] text-zinc-500">
              {isTv ? 'Série de TV' : 'Longa-metragem'}
            </span>
          </div>
        </div>

        {/* Linha de Progresso (para Séries em Assistindo) ou Pill de Status */}
        {isTv && isWatching ? (
          <div className="mt-1 pt-1.5 border-t border-zinc-800/60">
            <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
              {item.is_up_to_date ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <Check className="w-2.5 h-2.5 stroke-[2.5]" /> Em dia
                </span>
              ) : item.next_episode ? (
                <span className="text-sky-400 flex items-center gap-1 font-bold">
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>T{item.next_episode.season_number}:E{item.next_episode.episode_number}</span>
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> Assistindo
                </span>
              )}
              <span className="text-zinc-500 text-[9px] font-medium">
                {item.is_up_to_date ? '100%' : 'Em andamento'}
              </span>
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  item.is_up_to_date ? "bg-emerald-500 w-full" : "bg-gradient-to-r from-sky-500 to-rose-500 w-3/4"
                )}
              />
            </div>
          </div>
        ) : (
          <div className="mt-1 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between gap-1">
            {/* Pill Semântica de Status */}
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md truncate",
                item.status === 'completed'
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                  : item.status === 'watching'
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                  : item.status === 'plan_to_watch'
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                  : item.status === 'upcoming'
                  ? "bg-purple-500/15 text-purple-400 border border-purple-500/25"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
              )}
            >
              {item.status === 'completed' && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
              {item.status === 'watching' && <Play className="w-2.5 h-2.5 fill-current" />}
              {item.status === 'plan_to_watch' && <Bookmark className="w-2.5 h-2.5" />}
              {item.status === 'upcoming' && <Sparkles className="w-2.5 h-2.5 text-amber-400" />}
              {item.status === 'dropped' && <XCircle className="w-2.5 h-2.5" />}
              <span>
                {item.status === 'completed'
                  ? 'Concluído'
                  : item.status === 'watching'
                  ? 'Assistindo'
                  : item.status === 'plan_to_watch'
                  ? 'Quero Ver'
                  : item.status === 'upcoming'
                  ? 'Aguardando'
                  : 'Abandonado'}
              </span>
            </span>

            {/* Ação rápida de menu de status com AddToListButton */}
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="shrink-0"
            >
              <AddToListButton
                tmdb_id={tmdbId}
                media_type={mediaType}
                title={item.title}
                poster_path={item.poster_path}
                backdrop_path={item.backdrop_path}
                release_date={item.release_date}
                className="w-6 h-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md [&>svg]:w-3.5 [&>svg]:h-3.5"
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
});
