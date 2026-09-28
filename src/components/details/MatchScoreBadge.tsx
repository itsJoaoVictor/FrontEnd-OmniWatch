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
          // Only show if there's actually a score calculated
          if (res.data.match_score > 0) {
            setData(res.data);
          }
        }
      } catch (err) {
        // Ignora silenciosamente se o usuário não estiver autenticado ou se não houver cálculo de score
      } finally {
        setLoading(false);
      }
    }

    fetchScore();
  }, [tmdbId, mediaType]);

  if (loading || !data) return null;

  return (
    <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-sm max-w-xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full flex items-center">
          <Activity className="w-4 h-4 mr-2" />
          {Math.round(data.match_score)}% de Compatibilidade
        </div>
        <span className="text-sm font-medium text-foreground/80">
          Baseado no seu perfil
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
          <div className="mt-3 space-y-2">
            {heroTag && (
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs md:text-sm font-medium leading-snug flex items-center gap-1.5">
                {heroTag}
              </div>
            )}
            {secondaryTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {secondaryTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 bg-background/50 rounded-md border border-border/50 text-foreground/80 font-medium"
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
