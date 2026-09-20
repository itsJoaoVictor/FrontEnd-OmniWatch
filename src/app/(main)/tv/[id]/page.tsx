import { notFound } from "next/navigation";
import { TvSeriesDetailsResponse } from "@/types/details";
import { HeroSection } from "@/components/details/HeroSection";
import { CastCarousel } from "@/components/details/CastCarousel";
import { DirectorSection } from "@/components/details/DirectorSection";
import { VideoCarousel } from "@/components/details/VideoCarousel";
import { SeasonsList } from "@/components/details/SeasonsList";
import { SimilarCarousel } from "@/components/details/SimilarCarousel";
import { TvTechnicalDetailsSidebar } from "@/components/details/TvTechnicalDetailsSidebar";
import { ProgressFetcher } from "@/components/details/ProgressFetcher";

async function getTvData(id: string): Promise<TvSeriesDetailsResponse | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/tv/${id}`, {
      next: { revalidate: process.env.NODE_ENV === 'development' ? 0 : 3600 }
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch data");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching tv data:", error);
    return null;
  }
}

export default async function TvDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tv = await getTvData(id);

  if (!tv) {
    notFound();
  }

  const metaInfo = [
    tv.first_air_date ? tv.first_air_date.split("-")[0] : "",
    tv.number_of_seasons ? `${tv.number_of_seasons} Temporada${tv.number_of_seasons > 1 ? "s" : ""}` : ""
  ].filter(Boolean);

  return (
    <main className="w-full min-h-screen bg-background">
      <ProgressFetcher tmdbId={parseInt(id)} />
      <HeroSection
        tmdbId={parseInt(id)}
        mediaType="tv"
        title={tv.title}
        backdropPath={tv.backdrop_path}
        posterPath={tv.poster_path}
        overview={tv.overview}
        tagline={tv.tagline}
        voteAverage={tv.vote_average}
        genres={tv.genres}
        crew={tv.credits.crew}
        metaInfo={metaInfo}
        watchProviders={tv.watch_providers}
      />

      <div className="container mx-auto px-4 pb-12 mt-8">
        <div className="lg:grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 overflow-hidden">
            <CastCarousel cast={tv.credits.cast} />
            <DirectorSection crew={tv.credits.crew} title="Criador(es)" />
            <SeasonsList seasons={tv.seasons} fallbackPosterPath={tv.poster_path} seriesId={tv.id} />
            <VideoCarousel videos={tv.videos} />
            <SimilarCarousel items={tv.similar} type="tv" />
          </div>
          <div className="lg:col-span-1 mt-8 lg:mt-0">
            <TvTechnicalDetailsSidebar
              status={tv.status}
              networks={tv.networks}
              nextEpisodeToAir={tv.next_episode_to_air}
              lastEpisodeToAir={tv.last_episode_to_air}
              numberOfSeasons={tv.number_of_seasons}
              numberOfEpisodes={tv.number_of_episodes}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
