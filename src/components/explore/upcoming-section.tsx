"use client";

import { useEffect } from "react";
import { RecommendationsCarousel } from "./recommendations-carousel";
import { TrendingSkeleton } from "./trending-skeleton";
import { useExploreStore } from "@/store/useExploreStore";

export function UpcomingSection() {
  const data = useExploreStore((state) => state.upcomingData);
  const isLoading = useExploreStore((state) => state.isLoadingUpcoming);
  const fetchFeed = useExploreStore((state) => state.fetchFeed);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const { movies, series } = data;
  const hasData = (movies && movies.length > 0) || (series && series.length > 0);

  if (isLoading && !hasData) {
    return <TrendingSkeleton />;
  }

  if (!hasData) {
    return null;
  }

  return (
    <div className="flex flex-col gap-12 mb-12">
      {movies && movies.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            🗓️ Próximos Filmes para Você
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Filmes que ainda vão estrear selecionados com base no seu perfil de compatibilidade.
          </p>
          <RecommendationsCarousel items={movies} showReleaseDate={true} />
        </section>
      )}

      {series && series.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            🗓️ Novas Séries para Você
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Séries inéditas que vão estrear selecionadas com base no seu perfil de compatibilidade.
          </p>
          <RecommendationsCarousel items={series} showReleaseDate={true} />
        </section>
      )}
    </div>
  );
}
