import { notFound } from "next/navigation";
import Image from "next/image";
import { PlayCircle } from "lucide-react";
import { EpisodeDetailsResponse } from "@/types/details";
import Link from "next/link";
import { EpisodeWatchButton } from "@/components/details/EpisodeWatchButton";
import { EpisodeRatingControl } from "@/components/details/EpisodeRatingControl";
import { ProgressFetcher } from "@/components/details/ProgressFetcher";
import { formatReleaseDate } from "@/lib/dateUtils";

async function getEpisodeData(id: string, seasonNumber: string, episodeNumber: string): Promise<EpisodeDetailsResponse | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}`, {
      next: { revalidate: process.env.NODE_ENV === 'development' ? 0 : 3600 }
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch data");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching episode data:", error);
    return null;
  }
}

export default async function EpisodeDetailsPage({ params }: { params: Promise<{ id: string, seasonNumber: string, episodeNumber: string }> }) {
  const { id, seasonNumber, episodeNumber } = await params;
  const episode = await getEpisodeData(id, seasonNumber, episodeNumber);

  if (!episode) {
    notFound();
  }

  const stillUrl = "https://image.tmdb.org/t/p/w1280";

  return (
    <main className="w-full min-h-screen bg-background">
      <ProgressFetcher tmdbId={parseInt(id)} />
      <div className="container mx-auto px-4 py-8">
        <Link 
          href={`/tv/${id}`}
          className="text-primary hover:underline mb-6 inline-block"
        >
          &larr; Voltar para a Série
        </Link>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2 aspect-video relative rounded-lg overflow-hidden bg-muted">
            {episode.still_path ? (
              <Image
                src={`${stillUrl}${episode.still_path}`}
                alt={episode.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <PlayCircle size={64} opacity={0.5} />
              </div>
            )}
          </div>
          
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {episode.name}
            </h1>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="text-xl text-gray-400">
                Temporada {episode.season_number} • Episódio {episode.episode_number}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <EpisodeRatingControl 
                  seriesId={parseInt(id)} 
                  seasonNumber={episode.season_number} 
                  episodeNumber={episode.episode_number} 
                />
                <EpisodeWatchButton 
                  seriesId={parseInt(id)} 
                  seasonNumber={episode.season_number} 
                  episodeNumber={episode.episode_number} 
                  airDate={episode.air_date}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-6">
              {episode.air_date && (
                <div className="bg-muted/50 px-3 py-1.5 rounded-md">
                  Data de Estreia: <span className="font-semibold text-white">{formatReleaseDate(episode.air_date)}</span>
                </div>
              )}
              {episode.runtime && (
                <div className="bg-muted/50 px-3 py-1.5 rounded-md">
                  Duração: <span className="font-semibold text-white">{episode.runtime} min</span>
                </div>
              )}
              {episode.vote_average ? (
                <div className="bg-muted/50 px-3 py-1.5 rounded-md">
                  Avaliação: <span className="font-semibold text-white">{(episode.vote_average / 2).toFixed(1)}/5</span>
                </div>
              ) : null}
            </div>

            <div className="prose prose-invert max-w-none">
              <h3 className="text-xl font-semibold mb-3">Sinopse</h3>
              <p className="text-gray-300 leading-relaxed">
                {episode.overview || "Nenhuma sinopse disponível para este episódio."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
