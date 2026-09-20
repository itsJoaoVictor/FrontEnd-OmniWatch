import { notFound } from "next/navigation";
import { MovieDetailsResponse } from "@/types/details";
import { HeroSection } from "@/components/details/HeroSection";
import { CastCarousel } from "@/components/details/CastCarousel";
import { VideoCarousel } from "@/components/details/VideoCarousel";
import { SimilarCarousel } from "@/components/details/SimilarCarousel";
import { TechnicalDetailsSidebar } from "@/components/details/TechnicalDetailsSidebar";
import { CollectionCarousel } from "@/components/details/CollectionCarousel";
import { DirectorSection } from "@/components/details/DirectorSection";
import { CollectionResponse } from "@/types/details";

async function getMovieData(id: string): Promise<MovieDetailsResponse | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/movies/${id}`, {
      next: { revalidate: process.env.NODE_ENV === 'development' ? 0 : 3600 }
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch data");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching movie data:", error);
    return null;
  }
}

async function getCollectionData(collectionId: number): Promise<CollectionResponse | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/collections/${collectionId}`, {
      next: { revalidate: process.env.NODE_ENV === 'development' ? 0 : 3600 }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching collection data:", error);
    return null;
  }
}

export default async function MovieDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = await getMovieData(id);

  if (!movie) {
    notFound();
  }

  const collectionData = movie.belongs_to_collection 
    ? await getCollectionData(movie.belongs_to_collection.id)
    : null;

  let formattedRuntime = "";
  if (movie.runtime) {
    const hours = Math.floor(movie.runtime / 60);
    const minutes = movie.runtime % 60;
    formattedRuntime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  const metaInfo = [
    movie.release_date ? movie.release_date.split("-")[0] : "",
    formattedRuntime
  ].filter(Boolean);

  return (
    <main className="w-full min-h-screen bg-background">
      <HeroSection
        tmdbId={parseInt(id)}
        mediaType="movie"
        title={movie.title}
        backdropPath={movie.backdrop_path}
        posterPath={movie.poster_path}
        overview={movie.overview}
        tagline={movie.tagline}
        voteAverage={movie.vote_average}
        genres={movie.genres}
        crew={movie.credits.crew}
        metaInfo={metaInfo}
        watchProviders={movie.watch_providers}
      />

      <div className="container mx-auto px-4 pb-12 mt-8">
        <div className="lg:grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 overflow-hidden">
            <CastCarousel cast={movie.credits.cast} />
            <DirectorSection crew={movie.credits.crew} />
            <VideoCarousel videos={movie.videos} />
            {collectionData && <CollectionCarousel collection={collectionData} />}
            <SimilarCarousel items={movie.similar} type="movie" />
          </div>
          <div className="lg:col-span-1 mt-8 lg:mt-0">
            <TechnicalDetailsSidebar
              originalTitle={movie.original_title}
              originalLanguage={movie.original_language}
              status={movie.status}
              productionCompanies={movie.production_companies}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
