"use client";

import { useMyListStore } from "@/store/useMyListStore";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { hasMissingPreviousEpisodes } from "@/lib/utils";

interface EpisodeWatchButtonProps {
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
}

export function EpisodeWatchButton({ seriesId, seasonNumber, episodeNumber }: EpisodeWatchButtonProps) {
  const episodeProgress = useMyListStore(state => state.episodeProgress[seriesId]);
  const toggleEpisode = useMyListStore(state => state.toggleEpisode);

  const isWatched = (episodeProgress || []).some(
    p => p.season_number === seasonNumber && p.episode_number === episodeNumber
  );

  return (
    <button
      onClick={async () => {
        await toggleEpisode(seriesId, seasonNumber, episodeNumber, !isWatched);
        if (!isWatched && (seasonNumber > 1 || episodeNumber > 1)) {
          const progress = useMyListStore.getState().episodeProgress[seriesId];
          if (hasMissingPreviousEpisodes(progress, seasonNumber, episodeNumber)) {
            if (window.confirm(`Você marcou o episódio ${episodeNumber}. Deseja marcar todos os anteriores da série como assistidos?`)) {
              useMyListStore.getState().bulkMarkEpisodes(seriesId, seasonNumber, episodeNumber);
            }
          }
        }
      }}
      className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors ${
        isWatched 
          ? "bg-primary/20 text-primary hover:bg-primary/30" 
          : "bg-muted hover:bg-muted/80 text-foreground"
      }`}
    >
      {isWatched ? (
        <>
          <CheckCircle2 size={20} />
          <span>Assistido</span>
        </>
      ) : (
        <>
          <Circle size={20} />
          <span>Marcar como Assistido</span>
        </>
      )}
    </button>
  );
}
