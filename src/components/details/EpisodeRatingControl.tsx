"use client";

import { useState } from "react";
import { Star, StarHalf } from "lucide-react";
import { useMyListStore } from "@/store/useMyListStore";
import { cn } from "@/lib/utils";
import { getRatingLabel } from "@/lib/ratingLabel";

interface EpisodeRatingControlProps {
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
}

export function EpisodeRatingControl({
  seriesId,
  seasonNumber,
  episodeNumber
}: EpisodeRatingControlProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  
  const episodeProgress = useMyListStore(state => state.episodeProgress[seriesId]);
  const updateEpisodeRating = useMyListStore(state => state.updateEpisodeRating);

  const currentEp = (episodeProgress || []).find(
    p => p.season_number === seasonNumber && p.episode_number === episodeNumber
  );
  const currentRating = currentEp?.rating ?? null;
  const activeRating = hoverRating !== null ? hoverRating : (currentRating || 0);

  return (
    <div className="flex items-center gap-3 bg-muted/40 backdrop-blur-sm border border-border/50 px-3.5 py-2 rounded-lg">
      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
        {currentRating ? (
          <>
            Sua Nota: <span className="text-yellow-400 font-bold">{currentRating.toFixed(1)}</span>
          </>
        ) : (
          "Avaliar Episódio"
        )}
      </span>

      <div 
        className="flex items-center gap-1"
        onMouseLeave={() => setHoverRating(null)}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const fullValue = starIndex;
          const halfValue = starIndex - 0.5;
          const isFull = activeRating >= fullValue;
          const isHalf = activeRating === halfValue;

          return (
            <div key={starIndex} className="relative w-5 h-5 text-muted-foreground cursor-pointer">
              {/* Star visuals */}
              {isHalf ? (
                <div className="absolute inset-0 text-yellow-400 flex items-center justify-center">
                  <Star className="w-5 h-5 absolute opacity-30" />
                  <StarHalf className="w-5 h-5 absolute fill-yellow-400" />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Star className={cn("w-5 h-5 transition-colors", isFull ? "text-yellow-400 fill-yellow-400" : "opacity-30")} />
                </div>
              )}

              {/* Left half click area */}
              <div 
                className="absolute left-0 top-0 w-1/2 h-full z-10" 
                onMouseEnter={() => setHoverRating(halfValue)}
                onClick={() => updateEpisodeRating(seriesId, seasonNumber, episodeNumber, halfValue)}
                title={`${halfValue} estrelas`}
              />
              {/* Right half click area */}
              <div 
                className="absolute right-0 top-0 w-1/2 h-full z-10" 
                onMouseEnter={() => setHoverRating(fullValue)}
                onClick={() => updateEpisodeRating(seriesId, seasonNumber, episodeNumber, fullValue)}
                title={`${fullValue} estrelas`}
              />
            </div>
          );
        })}
      </div>
      {(() => {
        const info = getRatingLabel(activeRating);
        return info ? (
          <span className={cn("text-xs font-semibold whitespace-nowrap min-w-[5.5rem]", info.colorClass)}>
            {info.label}
          </span>
        ) : null;
      })()}
    </div>
  );
}
