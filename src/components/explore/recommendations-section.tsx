"use client";

import { useEffect } from "react";
import { MoviesBentoRecommendations } from "./movies-bento-recommendations";
import { SeriesShowrunnerRecommendations } from "./series-showrunner-recommendations";
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

  const movies = items.filter((item) => item.media_type === "movie");
  const series = items.filter((item) => item.media_type === "tv");

  if (movies.length === 0 && series.length === 0) return null;

  return (
    <div className="flex flex-col gap-12 mb-12">
      {movies.length > 0 && <MoviesBentoRecommendations items={movies} />}

      {series.length > 0 && <SeriesShowrunnerRecommendations items={series} />}
    </div>
  );
}
