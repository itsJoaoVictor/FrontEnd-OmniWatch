"use client";

import { useEffect } from "react";
import { RecommendationsCarousel } from "./recommendations-carousel";
import { TrendingSkeleton } from "./trending-skeleton";
import { useExploreStore } from "@/store/useExploreStore";

export function RecommendationsSection() {
  const items = useExploreStore((state) => state.exploreItems);
  const isLoading = useExploreStore((state) => state.isLoadingExplore);
  const fetchFeed = useExploreStore((state) => state.fetchFeed);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  if (isLoading && items.length === 0) {
    return <TrendingSkeleton />;
  }

  if (!items || items.length === 0) {
    return null;
  }

  const movies = items.filter(item => item.media_type === "movie");
  const series = items.filter(item => item.media_type === "tv");

  if (movies.length === 0 && series.length === 0) return null;

  return (
    <div className="flex flex-col gap-12 mb-12">
      {movies.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            ✨ Filmes Recomendados
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Filmes escolhidos a dedo com base no seu perfil de compatibilidade.
          </p>
          <RecommendationsCarousel items={movies} />
        </section>
      )}

      {series.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            ✨ Séries Recomendadas
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Séries escolhidas a dedo com base no seu perfil de compatibilidade.
          </p>
          <RecommendationsCarousel items={series} />
        </section>
      )}
    </div>
  );
}
