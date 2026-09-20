import Image from "next/image";
import { Star } from "lucide-react";
import { GenreItem, CrewItem, WatchProviderItem } from "@/types/details";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserRatingBadge } from "@/components/shared/UserRatingBadge";

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
  watchProviders
}: HeroSectionProps) {
  const imageUrl = "https://image.tmdb.org/t/p/original";
  const posterUrl = "https://image.tmdb.org/t/p/w500";

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
            <div className="rounded-lg overflow-hidden shadow-2xl">
              {posterPath ? (
                <Image
                  src={`${posterUrl}${posterPath}`}
                  alt={title}
                  width={300}
                  height={450}
                  className="w-full h-auto object-cover"
                  priority
                />
              ) : (
                <div className="w-[300px] h-[450px] bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">Sem imagem</span>
                </div>
              )}
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
                <AddToListButton tmdb_id={tmdbId} media_type={mediaType} className="w-12 h-12 [&>svg]:w-6 [&>svg]:h-6" />
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
    </div>
  );
}
