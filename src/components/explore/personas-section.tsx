"use client";

import { useEffect } from "react";
import { TrendingSkeleton } from "./trending-skeleton";
import { PersonasMoodSwitcher } from "./personas-mood-switcher";
import { useExploreStore } from "@/store/useExploreStore";

export function PersonasSection() {
  const personas = useExploreStore((state) => state.personasData);
  const isLoading = useExploreStore((state) => state.isLoadingPersonas);
  const fetchFeed = useExploreStore((state) => state.fetchFeed);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const validPersonas = (personas || []).filter(
    (p) => p.recommendations && p.recommendations.length > 0
  );

  if (isLoading && validPersonas.length === 0) {
    return <TrendingSkeleton />;
  }

  if (validPersonas.length === 0) {
    return null;
  }

  return <PersonasMoodSwitcher personas={validPersonas} />;
}
