"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ListPlus } from "lucide-react";
import { GenreItem, CrewItem, WatchProviderItem } from "@/types/details";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { SaveToCustomListModal } from "@/components/custom_lists/SaveToCustomListModal";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserRatingBadge } from "@/components/shared/UserRatingBadge";
import { PosterImage } from "@/components/shared/PosterImage";

interface HeroSectionProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
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
  crew,
  metaInfo,
  watchProviders,
  releaseDate
}: HeroSectionProps) {
  const [customListModalOpen, setCustomListModalOpen] = useState(false);
  const imageUrl = "https://image.tmdb.org/t/p/w1280";

  return (
    <div className="relative w-full h-auto md:min-h-[600px] flex items-center bg-black/90 pt-20 md:pt-24 pb-8 md:pb-12">
      {/* Backdrop */}
      {backdropPath && (
        <div className="absolute inset-0 z-0">
          <Image
            src={`${imageUrl}${backdropPath}`}
            alt={title}
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent md:bg-gradient-to-r md:from-black md:via-black/80" />
        </div>
      )}

      <div className="container relative z-10 mx-auto px-4 py-8 md:py-0">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Poster */}
          <div className="flex-shrink-0 w-[200px] md:w-[300px] flex flex-col gap-4">
            <div className="rounded-lg overflow-hidden shadow-2xl aspect-[2/3] w-full relative">
              <PosterImage
                src={posterPath}
                fallbackSrc={backdropPath}
                alt={title}
                title={title}
                type={mediaType}
                fill
                priority
                sizes="(max-width: 768px) 200px, 300px"
              />
            </div>
            
            {watchProviders && watchProviders.length > 0 && (
              <div className="flex items-center gap-3 bg-[#032541] hover:bg-[#032541]/80 transition-colors cursor-pointer rounded-lg p-3 w-full shadow-lg">
                <Image
                  src={`https://image.tmdb.org/t/p/w92${watchProviders[0].logo_path}`}
                  alt={watchProviders[0].provider_name}
                  width={46}
                  height={46}
                  className="rounded-md"
                />
                <div className="flex flex-col justify-center leading-tight">
                  <span className="text-[12px] text-gray-300 font-medium">No Ar</span>
                  <span className="text-[16px] font-bold text-white">Assista Agora</span>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left text-white max-w-3xl">
            <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-4 mb-2">
              <h1 className="text-3xl md:text-5xl font-bold">{title}</h1>
              <div className="flex items-center justify-center gap-3">
                <AddToListButton
                  tmdb_id={tmdbId}
                  media_type={mediaType}
                  title={title}
                  poster_path={posterPath ?? undefined}
                  backdrop_path={backdropPath ?? undefined}
                  release_date={releaseDate}
                  className="w-12 h-12 [&>svg]:w-6 [&>svg]:h-6"
                />
                <button
                  type="button"
                  onClick={() => setCustomListModalOpen(true)}
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)] bg-black/60 hover:bg-black/80 text-white border border-white/40 backdrop-blur-md transition-all hover:scale-105 hover:border-primary hover:text-primary cursor-pointer"
                  title="Salvar em Lista Personalizada"
                >
                  <ListPlus className="w-5 h-5" />
                </button>
                <FavoriteButton
                  tmdb_id={tmdbId}
                  size="lg"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4 text-sm md:text-base text-gray-300">
              <StatusBadge tmdb_id={tmdbId} />
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/10 px-2.5 py-0.5 rounded-full" title="Nota do TMDB">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-yellow-500 text-[13px]">{(voteAverage / 2).toFixed(1)}</span>
                  <span className="text-[10px] text-gray-300 font-medium uppercase tracking-wider ml-1">TMDB</span>
                </div>
                <UserRatingBadge tmdb_id={tmdbId} />
              </div>
              
              {metaInfo.map((info, idx) => (
                <span key={idx} className="flex items-center gap-4">
                  {idx > 0 && <span className="w-1 h-1 rounded-full bg-gray-500" />}
                  {info}
                </span>
              ))}
            </div>

            <div className="mb-4">
              <MatchScoreBadge tmdbId={tmdbId} mediaType={mediaType} />
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
              {genres.map((g) => (
                <span key={g.id} className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium">
                  {g.name}
                </span>
              ))}
            </div>

            {tagline && (
              <p className="italic text-gray-400 mb-4 text-lg">&quot;{tagline}&quot;</p>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Sinopse</h3>
              <p className="text-gray-200 leading-relaxed">
                {overview || "Nenhuma sinopse disponível."}
              </p>
            </div>

            {crew.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                {crew.map((member) => (
                  <div key={member.id}>
                    <p className="font-bold text-sm">{member.name}</p>
                    <p className="text-xs text-gray-400">{member.job}</p>
                  </div>
                ))}
              </div>
            )}
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
    </div>
  );
}
