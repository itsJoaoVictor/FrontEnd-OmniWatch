"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { api } from "@/lib/axios";

interface MatchScoreData {
  match_score: number;
  match_tags: string[];
}

interface MatchScoreBadgeProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
}

export function MatchScoreBadge({ tmdbId, mediaType }: MatchScoreBadgeProps) {
  const [data, setData] = useState<MatchScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScore() {
      try {
        const res = await api.get<MatchScoreData>(`/api/recommendations/score/${mediaType}/${tmdbId}`);

        if (res.status === 200 && res.data) {
          if (res.data.match_score > 0) {
            setData(res.data);
          }
        }
      } catch {
        // Ignora silenciosamente se o usuário não estiver autenticado ou não houver cálculo de score
      } finally {
        setLoading(false);
      }
    }

    fetchScore();
  }, [tmdbId, mediaType]);

  if (loading || !data) return null;

  return (
    <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-md max-w-xl shadow-xs">
      <div className="flex flex-wrap items-center gap-2.5 mb-2">
        <div className="bg-primary text-primary-foreground text-xs sm:text-sm font-bold px-3 py-1 rounded-full flex items-center shadow-xs">
          <Activity className="w-3.5 h-3.5 mr-1.5" />
          {Math.round(data.match_score)}% de Compatibilidade
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Baseado no seu perfil de gosto
        </span>
      </div>
      
      {data.match_tags && data.match_tags.length > 0 && (() => {
        const isHero =
          data.match_tags[0].startsWith("🍿") ||
          data.match_tags[0].startsWith("🎬") ||
          data.match_tags[0].startsWith("🌟") ||
          data.match_tags[0].startsWith("🚀");
        const heroTag = isHero ? data.match_tags[0] : null;
        const secondaryTags = isHero ? data.match_tags.slice(1) : data.match_tags;

        return (
          <div className="mt-2.5 space-y-2">
            {heroTag && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-300 text-xs font-semibold leading-snug flex items-center gap-1.5">
                {heroTag}
              </div>
            )}
            {secondaryTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {secondaryTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-card/80 border border-border text-foreground font-medium shadow-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
