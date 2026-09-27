"use client";

import { useEffect, useState } from "react";
import { RecommendationItem, UpcomingRecommendations } from "@/types/recommendation";
import { RecommendationsCarousel } from "./recommendations-carousel";
import { api } from "@/lib/axios";
import { TrendingSkeleton } from "./trending-skeleton";

export function UpcomingSection() {
  const [data, setData] = useState<UpcomingRecommendations>({ movies: [], series: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/api/recommendations/upcoming");
        setData(res.data || { movies: [], series: [] });
      } catch (error) {
        console.error("Error loading upcoming recommendations section:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <TrendingSkeleton />;
  }

  const { movies, series } = data;

  if ((!movies || movies.length === 0) && (!series || series.length === 0)) {
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
