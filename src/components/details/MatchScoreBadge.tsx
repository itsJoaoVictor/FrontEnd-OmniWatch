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
      
      {data.match_tags && data.match_tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {data.match_tags.map((tag, idx) => (
            <span key={idx} className="text-xs px-2 py-1 bg-background/50 rounded-md border border-border/50 text-foreground/70">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
