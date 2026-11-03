"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { Check, Star, StarOff, Play, Clock, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
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

export const MediaCard = memo(function MediaCard({ item, layout = "poster", priority = false }: MediaCardProps) {
  const updateStatus = useMyListStore((state) => state.updateStatus);
  const addToList = useMyListStore((state) => state.addToList);
  const toggleEpisode = useMyListStore((state) => state.toggleEpisode);
  const tmdbId = parseInt(item.id, 10);
  const savedItem = useMyListStore((state) => (!isNaN(tmdbId) ? state.items[tmdbId] : undefined));
  const isWatched = savedItem?.status === 'completed';
  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleQuickAdvance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isNaN(tmdbId) || isAdvancing) return;

    setIsAdvancing(true);
    try {
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
    } catch (err) {
      console.error("Erro ao avançar episódio:", err);
    } finally {
      setTimeout(() => setIsAdvancing(false), 400);
    }
  };

  // =========================================================================
  // Layout Cinemático Widescreen para "Continue Assistindo" (Apple TV+ Style)
  // =========================================================================
  if (layout === "tracking") {
    const isUpToDate = item.type === 'tv' && (item.isUpToDate || savedItem?.is_up_to_date);

    return (
      <div className="group relative flex flex-col rounded-2xl bg-card/80 hover:bg-card border border-border/80 hover:border-primary/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
        {/* Imagem Widescreen 16:9 com overlay e badge */}
        <Link 
          href={`/${item.type === 'movie' ? 'movie' : 'tv'}/${item.id}`} 
          prefetch={false}
          className="relative w-full aspect-video overflow-hidden bg-muted block cursor-pointer"
        >
          <PosterImage
            src={item.coverHorizontal || item.coverVertical}
            fallbackSrc={item.coverVertical}
            alt={item.title}
            title={item.title}
            type={item.type}
            fill
            priority={priority}
            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 25vw"
            className="transition-transform duration-500 group-hover:scale-105 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

          {/* Badge do Próximo Episódio ou Status */}
          {item.currentEpisode && (
            <span className={cn(
              "absolute bottom-2.5 left-2.5 text-xs font-bold px-2.5 py-0.5 rounded-md backdrop-blur-md shadow-sm border",
              isUpToDate
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-black/80 text-primary border-primary/30"
            )}>
              {item.currentEpisode}
            </span>
          )}

          {/* Botão de Check-in Rápido flutuante no topo direito */}
          {!isUpToDate && (
            <button
              onClick={handleQuickAdvance}
              disabled={isAdvancing}
              className={cn(
                "absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md transition-all duration-200 active:scale-90 z-20 shadow-lg",
                isAdvancing
                  ? "bg-emerald-600 text-white scale-110"
                  : "bg-primary/90 hover:bg-primary text-primary-foreground hover:scale-105"
              )}
              title="Marcar próximo episódio como visto (+1 Ep)"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </Link>

        {/* Informações da Série & Barra de Progresso */}
        <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
          <div>
            <Link 
              href={`/${item.type === 'movie' ? 'movie' : 'tv'}/${item.id}`}
              prefetch={false}
              className="hover:text-primary transition-colors block"
            >
              <h3 className="text-sm font-bold text-foreground truncate">
                {item.title}
              </h3>
            </Link>
            {item.nextEpisodeToWatch && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Temporada {item.nextEpisodeToWatch.season} • Episódio {item.nextEpisodeToWatch.episode}
              </p>
            )}
          </div>

          {/* Barra de Progresso Estilizada */}
          {item.progress !== undefined && (
            <div className="pt-1">
              <div className="flex justify-between text-[11px] text-muted-foreground font-medium mb-1">
                <span>Progresso Total</span>
                <span className="text-primary font-semibold">{item.progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // Layout Poster Clássico Cinemático (Filmes & Séries na Fila)
  // =========================================================================
  return (
    <Link 
      href={`/${item.type === 'movie' ? 'movie' : 'tv'}/${item.id}`} 
      prefetch={false}
      className="relative group cursor-pointer w-full transition-all duration-300 hover:-translate-y-1.5 block"
    >
      <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-md border border-border group-hover:border-primary/50 group-hover:shadow-xl group-hover:shadow-primary/10 transition-all duration-300">
        <PosterImage
          src={item.coverVertical}
          fallbackSrc={item.coverHorizontal}
          alt={item.title}
          title={item.title}
          type={item.type}
          fill
          priority={priority}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
          className="transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Status Badge, Avaliação e Progresso */}
        {savedItem && (
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start max-w-[calc(100%-48px)]">
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
              <StatusBadge tmdb_id={parseInt(item.id, 10)} />
            )}
            
            {savedItem.rating ? (
              <UserRatingBadge tmdb_id={parseInt(item.id, 10)} />
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

        {/* Overlay Cinemático com informações no hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5">
          <div className="flex flex-col gap-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight">
              {item.title}
            </h3>
            <p className="text-[11px] text-zinc-300 flex items-center gap-1">
              <span>{item.type === 'movie' ? 'Filme' : 'Série'}</span>
              {item.release_date && (
                <span>• {new Date(item.release_date).getFullYear()}</span>
              )}
            </p>
          </div>
        </div>

        {/* Botões rápidos de favorito e adicionar à lista */}
        {!isNaN(tmdbId) && tmdbId > 0 && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
            <FavoriteButton
              tmdb_id={tmdbId}
              size="sm"
            />
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
});
