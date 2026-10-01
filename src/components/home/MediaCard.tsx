"use client";

import Image from "next/image";
import { Check, Star, StarOff, Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserRatingBadge } from "@/components/shared/UserRatingBadge";
import { useMyListStore } from "@/store/useMyListStore";
import { PosterImage } from "@/components/shared/PosterImage";

export interface MediaItem {
  id: string;
  title: string;
  type: string;
  coverHorizontal?: string;
  coverVertical?: string;
  progress?: number;
  currentEpisode?: string | null;
  nextEpisodeToWatch?: { season: number; episode: number };
  isUpToDate?: boolean;
  release_date?: string | null;
}

interface MediaCardProps {
  item: MediaItem;
  layout?: "tracking" | "poster";
  priority?: boolean;
}

export function MediaCard({ item, layout = "poster", priority = false }: MediaCardProps) {
  const { items, updateStatus, addToList, toggleEpisode } = useMyListStore();
  const tmdbId = parseInt(item.id);
  const savedItem = !isNaN(tmdbId) ? items[tmdbId] : undefined;
  const isWatched = savedItem?.status === 'completed';

  // Layout para "Continue Assistindo" (Estilo Tracker/TV Time)
  if (layout === "tracking") {
    return (
      <div className="group relative flex gap-4 bg-card hover:bg-accent border border-border hover:border-primary/50 rounded-xl p-3 transition-all duration-300">
        <Link 
          href={`/${item.type === 'movie' ? 'movie' : 'tv'}/${item.id}`} 
          className="flex-1 flex gap-4 cursor-pointer overflow-hidden min-w-0"
        >
          <div className="relative w-32 md:w-40 aspect-video rounded-lg overflow-hidden shrink-0 shadow-md bg-muted">
            <PosterImage
              src={item.coverHorizontal || item.coverVertical}
              fallbackSrc={item.coverVertical}
              alt={item.title}
              title={item.title}
              type={item.type}
              fill
              priority={priority}
              sizes="(max-width: 768px) 160px, 200px"
              className="transition-transform duration-500 group-hover:scale-110"
            />
            {/* Overlay escuro leve na imagem */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors pointer-events-none" />
          </div>
          
          <div className="flex-1 flex flex-col justify-center py-1 overflow-hidden">
            <p className="text-xs text-primary font-medium mb-1 tracking-wider uppercase">
              {item.currentEpisode ? `Próximo: ${item.currentEpisode}` : "Novo"}
            </p>
            <h3 className="text-foreground font-bold text-base md:text-lg truncate mb-2">
              {item.title}
            </h3>
            
            {item.progress !== undefined && (
              <div className="mt-auto flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{item.progress}%</span>
              </div>
            )}
          </div>
        </Link>

        <div className="flex items-center justify-center pr-2 shrink-0 z-10">
          {item.type === 'tv' && item.isUpToDate ? (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full whitespace-nowrap shadow-sm select-none" title="Você assistiu a todos os episódios disponíveis até o momento">
              Em dia
            </span>
          ) : (item.type === 'movie' && !Boolean(
            (item.release_date || savedItem?.release_date) && 
            typeof (item.release_date || savedItem?.release_date) === 'string' && 
            (item.release_date || savedItem?.release_date)!.trim() !== '' && 
            new Date((item.release_date || savedItem?.release_date)!.trim()) <= new Date()
          )) || savedItem?.status === 'upcoming' ? (
            <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full whitespace-nowrap shadow-sm select-none" title="Aguardando data de estreia">
              Aguardando Estreia
            </span>
          ) : (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (isNaN(tmdbId)) return; // Se for dado mockado
                
                if (item.type === 'tv' && item.nextEpisodeToWatch) {
                  await toggleEpisode(tmdbId, item.nextEpisodeToWatch.season, item.nextEpisodeToWatch.episode, true);
                } else {
                  if (isWatched) {
                    await updateStatus(tmdbId, 'watching');
                  } else {
                    if (!savedItem) {
                      await addToList(tmdbId, item.type as 'movie' | 'tv', {
                        title: item.title,
                        poster_path: item.coverVertical,
                        backdrop_path: item.coverHorizontal,
                        release_date: item.release_date || undefined,
                        status: 'completed',
                      });
                    } else {
                      await updateStatus(tmdbId, 'completed');
                    }
                  }
                }
              }}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 border-2",
                isWatched 
                  ? "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                  : "bg-transparent border-muted-foreground/50 text-muted-foreground hover:border-primary hover:text-primary"
              )}
              title="Marcar como visto"
            >
              <Check className={cn("w-5 h-5", isWatched && "stroke-[3px]")} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Layout Poster Clássico (Descobrir/Em Alta)
  return (
    <Link href={`/${item.type === 'movie' ? 'movie' : 'tv'}/${item.id}`} className="relative group cursor-pointer w-full transition-all duration-300 hover:-translate-y-2 block">
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-muted shadow-lg border border-border group-hover:border-primary/50 transition-colors">
        <PosterImage
          src={item.coverVertical}
          fallbackSrc={item.coverHorizontal}
          alt={item.title}
          title={item.title}
          type={item.type}
          fill
          priority={priority}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Status Badge, Avaliação e Progresso */}
        {savedItem && (
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start max-w-[calc(100%-48px)]">
            {/* Linha 1: Status com indicador de progresso para Séries */}
            {savedItem.status === 'watching' && item.type === 'tv' ? (
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full shadow-md backdrop-blur-md uppercase tracking-wider border border-white/15 bg-black/90 text-amber-400 flex items-center gap-1.5 whitespace-nowrap">
                <span>Assistindo</span>
                <span className="text-white/30 text-[10px]">•</span>
                {(savedItem.is_up_to_date ?? item.isUpToDate) ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 lowercase first-letter:uppercase">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>Em dia</span>
                  </span>
                ) : (savedItem.next_episode || item.nextEpisodeToWatch) ? (
                  <span className="text-sky-300 font-semibold flex items-center gap-1">
                    <Play className="w-2.5 h-2.5 fill-sky-300" />
                    <span>
                      {savedItem.next_episode
                        ? `T${savedItem.next_episode.season_number}:E${savedItem.next_episode.episode_number}`
                        : `T${item.nextEpisodeToWatch!.season}:E${item.nextEpisodeToWatch!.episode}`}
                    </span>
                  </span>
                ) : null}
              </span>
            ) : (
              <StatusBadge tmdb_id={parseInt(item.id)} />
            )}
            
            {/* Linha 2: Avaliação ou Sem Nota */}
            {savedItem.rating ? (
              <UserRatingBadge tmdb_id={parseInt(item.id)} />
            ) : (savedItem.status === 'completed' || savedItem.status === 'watching') ? (
              <div 
                className="flex items-center gap-1 bg-black/90 backdrop-blur-md border border-amber-500/60 px-2 py-0.5 rounded-full text-amber-300 text-[11px] font-semibold shadow-md"
                title="Pendente de avaliação"
              >
                <StarOff className="w-3 h-3 text-amber-400 stroke-[2.2]" />
                <span>Sem nota</span>
              </div>
            ) : null}
          </div>
        )}

        {/* Overlay do Poster - sempre dark para garantir leitura sobre imagem */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5">
          <div className="flex flex-col gap-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight">
              {item.title}
            </h3>
            {savedItem && !savedItem.rating && (savedItem.status === 'completed' || savedItem.status === 'watching') && (
              <span className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400" />
                Sem avaliação
              </span>
            )}
          </div>
        </div>

        {/* Botão de adicionar sempre visível no canto superior direito */}
        {!isNaN(tmdbId) && tmdbId > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <AddToListButton
              tmdb_id={tmdbId}
              media_type={item.type as 'movie' | 'tv'}
              title={item.title}
              poster_path={item.coverVertical}
              backdrop_path={item.coverHorizontal}
              release_date={item.release_date || savedItem?.release_date}
              className="w-8 h-8 [&>svg]:w-4 [&>svg]:h-4"
            />
          </div>
        )}
      </div>
    </Link>
  );
}
