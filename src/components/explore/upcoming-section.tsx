"use client";

import { useEffect } from "react";
import { TrendingSkeleton } from "./trending-skeleton";
import { UpcomingTimelineRadar } from "./upcoming-timeline-radar";
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
    <UpcomingTimelineRadar
      movies={movies || []}
      series={series || []}
    />
  );
}
