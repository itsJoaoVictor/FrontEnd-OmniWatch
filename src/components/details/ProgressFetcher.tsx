"use client";

import { useEffect } from "react";
import { useMyListStore } from "@/store/useMyListStore";

interface ProgressFetcherProps {
  tmdbId: number;
}

export function ProgressFetcher({ tmdbId }: ProgressFetcherProps) {
  const fetchProgress = useMyListStore(state => state.fetchProgress);
  const item = useMyListStore(state => state.items[tmdbId]);

  useEffect(() => {
    if (item?.id) {
      fetchProgress(tmdbId);
    }
  }, [tmdbId, fetchProgress, item?.id]);

  return null;
}
