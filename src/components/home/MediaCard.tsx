"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { useState } from "react";
import { cn, hasMissingPreviousEpisodes } from "@/lib/utils";
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
      <Link href={`/${item.type === 'movie' ? 'movie' : 'tv'}/${item.id}`} className="group relative flex gap-4 bg-card hover:bg-accent border border-border hover:border-primary/50 rounded-xl p-3 transition-all duration-300 cursor-pointer block">
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

        <div className="flex items-center justify-center pr-2">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              e.preventDefault();
              if (isNaN(tmdbId)) return; // Se for dado mockado
              
              if (item.type === 'tv' && item.nextEpisodeToWatch) {
                await toggleEpisode(tmdbId, item.nextEpisodeToWatch.season, item.nextEpisodeToWatch.episode, true);
                if (item.nextEpisodeToWatch.season > 1 || item.nextEpisodeToWatch.episode > 1) {
                  const progress = useMyListStore.getState().episodeProgress[tmdbId];
                  if (hasMissingPreviousEpisodes(progress, item.nextEpisodeToWatch.season, item.nextEpisodeToWatch.episode)) {
                    if (window.confirm(`Você marcou o episódio ${item.nextEpisodeToWatch.episode}. Deseja marcar todos os anteriores da série como assistidos?`)) {
                      useMyListStore.getState().bulkMarkEpisodes(tmdbId, item.nextEpisodeToWatch.season, item.nextEpisodeToWatch.episode);
                    }
                  }
                }
              } else {
                if (isWatched) {
                  await updateStatus(tmdbId, 'watching');
                } else {
                  if (!savedItem) {
                    await addToList(tmdbId, item.type as 'movie' | 'tv', {
                      title: item.title,
                      poster_path: item.coverVertical,
                      backdrop_path: item.coverHorizontal,
                    });
                  }
                  await updateStatus(tmdbId, 'completed');
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
        </div>
      </Link>
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
        
        {/* Status Badge e Avaliação */}
        {savedItem && (
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
            <StatusBadge tmdb_id={parseInt(item.id)} />
            <UserRatingBadge tmdb_id={parseInt(item.id)} />
          </div>
        )}

        {/* Overlay do Poster - sempre dark para garantir leitura sobre imagem */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="flex items-center justify-between translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight flex-1">
              {item.title}
            </h3>
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
              className="w-8 h-8 [&>svg]:w-4 [&>svg]:h-4"
            />
          </div>
        )}
      </div>
    </Link>
  );
}
