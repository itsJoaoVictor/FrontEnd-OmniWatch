import { notFound } from "next/navigation";
import { TvSeriesDetailsResponse } from "@/types/details";
import { HeroSection } from "@/components/details/HeroSection";
import { CastCarousel } from "@/components/details/CastCarousel";
import { CreativeCrewSection } from "@/components/details/CreativeCrewSection";
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

  // Calcula o período de exibição da série (ex: 2005 – 2014)
  const startYear = tv.first_air_date ? tv.first_air_date.split("-")[0] : "";
  const endYear = tv.last_episode_to_air?.air_date
    ? tv.last_episode_to_air.air_date.split("-")[0]
    : "";

  let yearsRange = startYear;
  if (startYear) {
    if (tv.status === "Ended" || tv.status === "Canceled") {
      yearsRange = endYear && endYear !== startYear ? `${startYear} – ${endYear}` : startYear;
    } else {
      yearsRange = `${startYear} – Presente`;
    }
  }

  const metaInfo = [
    yearsRange,
    tv.number_of_seasons
      ? `${tv.number_of_seasons} Temporada${tv.number_of_seasons > 1 ? "s" : ""}`
      : "",
    tv.number_of_episodes
      ? `${tv.number_of_episodes} Episódios`
      : "",
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
        universe={tv.universe}
        hasVideos={Boolean(tv.videos && tv.videos.length > 0)}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 mt-10">
        <div className="lg:grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8 overflow-hidden">
            <CreativeCrewSection crew={tv.credits.crew} />
            <CastCarousel cast={tv.credits.cast} />
            <SeasonsList seasons={tv.seasons} fallbackPosterPath={tv.poster_path} seriesId={tv.id} />
            {tv.videos && tv.videos.length > 0 && <VideoCarousel videos={tv.videos} />}
          </div>
          <div className="lg:col-span-1 mt-8 lg:mt-0 space-y-6 lg:sticky lg:top-24">
            <TvTechnicalDetailsSidebar
              seriesId={tv.id}
              status={tv.status}
              networks={tv.networks}
              nextEpisodeToAir={tv.next_episode_to_air}
              lastEpisodeToAir={tv.last_episode_to_air}
              numberOfSeasons={tv.number_of_seasons}
              numberOfEpisodes={tv.number_of_episodes}
              seasons={tv.seasons}
            />
          </div>
        </div>

        {/* Séries Similares em Largura Total */}
        {tv.similar && tv.similar.length > 0 && (
          <div className="w-full mt-14 pt-8 border-t border-border">
            <SimilarCarousel items={tv.similar} type="tv" />
          </div>
        )}
      </div>
    </main>
  );
}
