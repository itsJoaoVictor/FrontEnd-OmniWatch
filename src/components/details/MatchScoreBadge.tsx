"use client";

import { useEffect, useState } from "react";
import { Activity, ChevronRight } from "lucide-react";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";
import {
  MatchBreakdownSheet,
  type MatchScoreData,
} from "./MatchBreakdownSheet";

interface MatchScoreBadgeProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
}

export function MatchScoreBadge({
  tmdbId,
  mediaType,
  title,
  backdropPath,
}: MatchScoreBadgeProps) {
  const itemKey = `${mediaType}-${tmdbId}`;
  const [state, setState] = useState<{
    key: string;
    data: MatchScoreData | null;
  } | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchScore() {
      let nextData: MatchScoreData | null = null;
      try {
        const res = await api.get<MatchScoreData>(
          `/api/recommendations/score/${mediaType}/${tmdbId}`
        );

        if (res.status === 200 && res.data && res.data.match_score > 0) {
          nextData = res.data;
        }
      } catch {
        // Ignora silenciosamente se o usuário não estiver autenticado ou não houver cálculo de score
      } finally {
        if (!cancelled) {
          setState({ key: itemKey, data: nextData });
        }
      }
    }

    fetchScore();

    return () => {
      cancelled = true;
    };
  }, [tmdbId, mediaType, itemKey]);

  const loading = state?.key !== itemKey;
  const data = loading ? null : state?.data ?? null;
  const sheetOpen = openKey === itemKey;

  if (loading || !data) return null;

  const roundedScore = Math.max(0, Math.min(100, Math.round(data.match_score)));
  const hasBreakdown = Boolean(data.breakdown);

  const cardBody = (
    <>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <div className="bg-primary text-primary-foreground text-xs sm:text-sm font-bold px-3 py-1 rounded-full flex items-center shadow-xs">
            <Activity className="w-3.5 h-3.5 mr-1.5" />
            <span className="tabular-nums">{roundedScore}% de Compatibilidade</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {data.is_preliminary
              ? "Match Preliminar"
              : "Baseado no seu perfil de gosto"}
          </span>
        </div>

        {hasBreakdown && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary shrink-0 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors">
            <span>Ver análise</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        )}
      </div>

      <div className="h-1 w-full rounded-full bg-primary/15 overflow-hidden mb-2.5">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${roundedScore}%` }}
        />
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
    </>
  );

  const cardClassName = cn(
    "mt-4 p-3.5 sm:p-4 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-md max-w-xl w-full text-left shadow-xs",
    hasBreakdown &&
      "group cursor-pointer transition-all duration-200 hover:bg-primary/15 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  );

  return (
    <>
      {hasBreakdown ? (
        <button
          type="button"
          onClick={() => setOpenKey(itemKey)}
          className={cardClassName}
          aria-label={`Ver análise detalhada de ${roundedScore}% de compatibilidade`}
        >
          {cardBody}
        </button>
      ) : (
        <div className={cardClassName}>{cardBody}</div>
      )}

      {data.breakdown && (
        <MatchBreakdownSheet
          open={sheetOpen}
          onOpenChange={(open) => setOpenKey(open ? itemKey : null)}
          tmdbId={tmdbId}
          mediaType={mediaType}
          breakdown={data.breakdown}
          title={title}
          backdropPath={backdropPath}
        />
      )}
    </>
  );
}
