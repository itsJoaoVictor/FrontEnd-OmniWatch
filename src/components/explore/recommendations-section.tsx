"use client";

import { useEffect, useState } from "react";
import { RecommendationItem } from "@/types/recommendation";
import { RecommendationsCarousel } from "./recommendations-carousel";
import { api } from "@/lib/axios";
import { TrendingSkeleton } from "./trending-skeleton";

export function RecommendationsSection() {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/api/recommendations/explore");
        setItems(res.data);
      } catch (error) {
        console.error("Error loading recommendations section:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
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
