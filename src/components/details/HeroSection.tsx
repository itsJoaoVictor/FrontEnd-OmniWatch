"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ListPlus, Globe, Play, Tv, Send } from "lucide-react";
import { GenreItem, CrewItem, WatchProviderItem, UniverseRef } from "@/types/details";
import Link from "next/link";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { SaveToCustomListModal } from "@/components/custom_lists/SaveToCustomListModal";
import { RecommendToFriendModal } from "@/components/shared/RecommendToFriendModal";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserRatingBadge } from "@/components/shared/UserRatingBadge";
import { PosterImage } from "@/components/shared/PosterImage";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  backdropPath: string | null;
  posterPath: string | null;
  overview: string;
  tagline: string;
  voteAverage: number;
  genres: GenreItem[];
  crew: CrewItem[];
  metaInfo: string[]; // ex: ['2023', '120 min', '12 Seasons']
  watchProviders?: WatchProviderItem[];
  releaseDate?: string | null;
  universe?: UniverseRef | null;
  hasVideos?: boolean;
}

export function HeroSection({
  tmdbId,
  mediaType,
  title,
  backdropPath,
  posterPath,
  overview,
  tagline,
  voteAverage,
  genres,
  metaInfo,
  watchProviders,
  releaseDate,
  universe,
  hasVideos = false,
}: HeroSectionProps) {
  const [customListModalOpen, setCustomListModalOpen] = useState(false);
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const imageUrl = "https://image.tmdb.org/t/p/w1280";

  const handleScrollToTrailers = () => {
    const el = document.getElementById("trailers-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const cleanTagline = tagline?.replace(/^["'“”]+|["'“”]+$/g, "").trim();

  return (
    <div className="relative w-full min-h-[580px] md:min-h-[640px] flex items-end bg-background pt-24 pb-12 overflow-hidden">
      {/* Backdrop com Vinheta Cinematográfica e Fade Gradual Suave (sem corte seco) */}
      {backdropPath && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src={`${imageUrl}${backdropPath}`}
            alt={title}
            fill
            className="object-cover object-top opacity-35 md:opacity-45"
            priority
          />
          {/* Degradês multi-camadas adaptativos ao tema da página */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        </div>
      )}

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-end">
          
          {/* Pôster em Destaque */}
          <div className="flex-shrink-0 w-[200px] sm:w-[240px] md:w-[280px] flex flex-col gap-4">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-[2/3] w-full relative bg-muted/60 transition-transform duration-300 hover:scale-[1.02]">
              <PosterImage
                src={posterPath}
                fallbackSrc={backdropPath}
                alt={title}
                title={title}
                type={mediaType}
                fill
                priority
                sizes="(max-width: 768px) 200px, 280px"
              />
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white tracking-widest border border-white/20 pointer-events-none">
                4K HDR
              </div>
            </div>
          </div>

          {/* Informações Principais & Ações */}
          <div className="flex-1 text-left w-full max-w-4xl">
            
            {/* Metadados e Gêneros em Linha com Badges Semânticos */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {universe && (
                <Link
                  href={`/universe/${encodeURIComponent(universe.universe_key)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-all shadow-xs"
                  title={`Ver todo o universo ${universe.name}`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Universo: {universe.name}</span>
                </Link>
              )}

              {metaInfo.map((info, idx) => (
                <span
                  key={idx}
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/70"
                >
                  {info}
                </span>
              ))}

              {genres.map((g) => (
                <span
                  key={g.id}
                  className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-secondary/70 text-secondary-foreground border border-border/50"
                >
                  {g.name}
                </span>
              ))}
            </div>

            {/* Título do Filme */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-2 leading-tight">
              {title}
            </h1>

            {/* Tagline Elegante */}
            {cleanTagline && (
              <p className="italic text-muted-foreground text-sm sm:text-base mb-4 font-normal">
                &ldquo;{cleanTagline}&rdquo;
              </p>
            )}

            {/* Barra de Avaliações (TMDB + Avaliação do Usuário + Status) */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <StatusBadge tmdb_id={tmdbId} />

              <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur-md border border-border px-3 py-1 rounded-full shadow-xs text-xs">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-bold text-foreground">{(voteAverage / 2).toFixed(1)}</span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider ml-0.5">
                  TMDB
                </span>
              </div>

              {/* Widget Interativo de Avaliação */}
              <UserRatingBadge tmdb_id={tmdbId} mediaType={mediaType} />
            </div>

            {/* Match Score de Afinidade */}
            <div className="mb-6">
              <MatchScoreBadge tmdbId={tmdbId} mediaType={mediaType} />
            </div>

            {/* BARRA DE AÇÕES PRINCIPAIS CINEMATOGRÁFICAS */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {hasVideos && (
                <Button
                  onClick={handleScrollToTrailers}
                  size="default"
                  className="rounded-xl font-bold gap-2 text-sm shadow-md shadow-primary/20 cursor-pointer transition-all hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Assistir Trailer</span>
                </Button>
              )}

              <AddToListButton
                tmdb_id={tmdbId}
                media_type={mediaType}
                title={title}
                poster_path={posterPath ?? undefined}
                backdrop_path={backdropPath ?? undefined}
                release_date={releaseDate}
                className="w-11 h-11 rounded-xl shadow-xs"
              />

              <button
                type="button"
                onClick={() => setCustomListModalOpen(true)}
                className="w-11 h-11 rounded-xl flex items-center justify-center bg-card hover:bg-accent text-foreground border border-border shadow-xs transition-all hover:scale-105 cursor-pointer"
                title="Salvar em Lista Personalizada"
                aria-label="Salvar em Lista Personalizada"
              >
                <ListPlus className="w-5 h-5 text-primary" />
              </button>

              <button
                type="button"
                onClick={() => setRecommendModalOpen(true)}
                className="w-11 h-11 rounded-xl flex items-center justify-center bg-card hover:bg-accent text-foreground border border-border shadow-xs transition-all hover:scale-105 cursor-pointer"
                title="Recomendar a um Amigo"
                aria-label="Recomendar a um Amigo"
              >
                <Send className="w-5 h-5 text-primary" />
              </button>

              <FavoriteButton
                tmdb_id={tmdbId}
                size="lg"
              />
            </div>

            {/* BLOCO "ONDE ASSISTIR" (Com layout adaptativo aos temas) */}
            {watchProviders && watchProviders.length > 0 && (
              <div className="bg-card/85 border border-border/80 rounded-2xl p-3.5 max-w-xl backdrop-blur-md shadow-xs mb-6">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Tv className="w-3.5 h-3.5 text-primary" />
                    <span>Disponível no Brasil</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Streaming
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {watchProviders.slice(0, 3).map((provider) => (
                    <div
                      key={provider.provider_id}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/60 text-xs font-semibold text-foreground shadow-xs"
                    >
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                        alt={provider.provider_name}
                        width={24}
                        height={24}
                        className="rounded-md object-cover shadow-xs"
                      />
                      <span>{provider.provider_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sinopse Alinhada à Esquerda */}
            <div className="space-y-1.5">
              <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground">
                Sinopse
              </h2>
              <p className="text-foreground/90 text-sm sm:text-base leading-relaxed text-left">
                {overview || "Nenhuma sinopse disponível para este título."}
              </p>
            </div>

          </div>

        </div>
      </div>

      <SaveToCustomListModal
        open={customListModalOpen}
        onOpenChange={setCustomListModalOpen}
        media={{
          tmdb_id: tmdbId,
          media_type: mediaType,
          title,
          poster_path: posterPath,
          backdrop_path: backdropPath,
          release_date: releaseDate,
        }}
      />

      <RecommendToFriendModal
        isOpen={recommendModalOpen}
        onClose={() => setRecommendModalOpen(false)}
        media={{
          tmdbId,
          mediaType,
          title,
          posterPath,
          releaseDate,
          voteAverage,
        }}
      />
    </div>
  );
}
