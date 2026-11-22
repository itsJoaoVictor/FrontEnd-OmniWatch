"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clapperboard,
  Film,
  Globe,
  Heart,
  Info,
  RotateCcw,
  Sparkles,
  Star,
  Tag,
  TrendingDown,
  TrendingUp,
  Tv,
  Users,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PosterImage } from "@/components/shared/PosterImage";
import { cn } from "@/lib/utils";

export interface MatchPillar {
  key: "semantic" | "genres" | "themes" | "talent" | "language" | "format" | string;
  label: string;
  percent: number;
  status: "strong" | "moderate" | "novelty" | "low" | string;
  impact?: "high" | "medium" | "low" | string;
  impact_label?: string;
  description: string;
  chips: string[];
}

export interface MatchAnchor {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  similarity: number;
  is_favorite: boolean;
  rating: number | null;
  rewatch_count: number;
  ep_rewatches: number;
  reason_label: string;
  shared_genres?: string[];
  priority_note?: string | null;
}

export interface MatchPersonaScore {
  id: string;
  name: string;
  emoji: string;
  score: number;
  is_primary: boolean;
}

export interface MatchFactor {
  key: string;
  label: string;
  detail: string;
  delta: number | null;
}

export interface MatchScoreBreakdown {
  score: number;
  base_score?: number;
  base_source_label?: string;
  net_adjustment?: number;
  tier_label: string;
  summary: string;
  is_preliminary: boolean;
  user_item_count: number;
  semantic_available: boolean;
  pillars: MatchPillar[];
  anchors: MatchAnchor[];
  personas: MatchPersonaScore[];
  boosts: MatchFactor[];
  restraints: MatchFactor[];
}

export interface MatchScoreData {
  match_score: number;
  match_tags: string[];
  is_preliminary?: boolean;
  breakdown?: MatchScoreBreakdown | null;
}

interface MatchBreakdownSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  breakdown: MatchScoreBreakdown;
  title?: string;
  backdropPath?: string | null;
}

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const size = 84;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div className="relative w-[84px] h-[84px] shrink-0 flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/70"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-primary transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black tracking-tight text-foreground tabular-nums leading-none">
          {clamped}%
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
          Match
        </span>
      </div>
    </div>
  );
}

function PillarIcon({ pillar }: { pillar: MatchPillar }) {
  const iconClass = "w-4 h-4 text-primary shrink-0";
  switch (pillar.key) {
    case "semantic":
      return <Sparkles className={iconClass} />;
    case "genres":
      return <Film className={iconClass} />;
    case "themes":
      return <Tag className={iconClass} />;
    case "talent":
      return <Users className={iconClass} />;
    case "language":
      return <Globe className={iconClass} />;
    case "format":
      return pillar.chips?.[0] === "Séries" ? (
        <Tv className={iconClass} />
      ) : (
        <Clapperboard className={iconClass} />
      );
    default:
      return <Activity className={iconClass} />;
  }
}

function getPillarBarClass(status: string): string {
  switch (status) {
    case "strong":
      return "bg-primary";
    case "moderate":
      return "bg-amber-500";
    case "novelty":
      return "bg-muted-foreground/40";
    case "low":
    default:
      return "bg-rose-500/80";
  }
}

function AnchorReasonIcon({ anchor }: { anchor: MatchAnchor }) {
  if (anchor.is_favorite) {
    return <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />;
  }
  if (anchor.rewatch_count > 0 || anchor.ep_rewatches >= 2) {
    return <RotateCcw className="w-3 h-3 text-sky-500 shrink-0" />;
  }
  if (anchor.rating && anchor.rating > 0) {
    return <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />;
  }
  return <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />;
}

export function MatchBreakdownSheet({
  open,
  onOpenChange,
  breakdown,
  title,
  backdropPath,
}: MatchBreakdownSheetProps) {
  const [failedBackdrop, setFailedBackdrop] = useState<string | null>(null);
  const hasAdjustments =
    breakdown.boosts.length > 0 || breakdown.restraints.length > 0;
  const netAdjustment = breakdown.net_adjustment ?? 0;
  const showAdjustmentsSection =
    hasAdjustments || Math.abs(netAdjustment) >= 0.5;
  const showBackdrop = Boolean(backdropPath && failedBackdrop !== backdropPath);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="responsive" className="p-0">
        {/* Header fixo */}
        <SheetHeader className="relative shrink-0 overflow-hidden border-b border-border/70 px-5 sm:px-6 pt-4 pb-4 bg-popover">
          {showBackdrop && backdropPath && (
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
              <Image
                src={`https://image.tmdb.org/t/p/w780${backdropPath}`}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 460px"
                aria-hidden="true"
                onError={() => setFailedBackdrop(backdropPath)}
                className="object-cover opacity-20 blur-xs scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-popover/60 via-popover/90 to-popover" />
            </div>
          )}

          <div className="relative z-10 pr-10">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>Raio-X da Compatibilidade</span>
            </div>
            <SheetTitle className="line-clamp-2">
              {title || "Detalhes do Match"}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Análise detalhada dos pilares, obras similares e fatores que compõem a sua compatibilidade com este título.
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Corpo rolável */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 space-y-6">
          {/* Bloco 1: Resumo + Veredito humano */}
          <section className="rounded-2xl bg-card/90 border border-border/80 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-4">
              <ScoreRing score={breakdown.score} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/25">
                  {breakdown.tier_label}
                </span>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  {breakdown.summary}
                </p>
              </div>
            </div>

            {breakdown.is_preliminary && (
              <div className="flex items-start gap-2 rounded-xl px-3 py-2 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-300 text-xs leading-snug">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Você tem{" "}
                  <strong>
                    {breakdown.user_item_count}{" "}
                    {breakdown.user_item_count === 1 ? "título" : "títulos"}
                  </strong>{" "}
                  no perfil. O match fica mais preciso a partir de 8 obras avaliadas.
                </span>
              </div>
            )}
          </section>

          {/* Bloco 2: Conexões diretas com a biblioteca */}
          {breakdown.anchors.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Porque lembrou sua biblioteca
                </h3>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Conexões diretas
                </span>
              </div>

              <div className="space-y-2">
                {breakdown.anchors.map((anchor) => (
                  <Link
                    key={`${anchor.media_type}-${anchor.tmdb_id}`}
                    href={`/${anchor.media_type}/${anchor.tmdb_id}`}
                    onClick={() => onOpenChange(false)}
                    className="group flex items-center gap-3 p-2.5 rounded-xl bg-card/80 hover:bg-accent/70 border border-border/70 hover:border-primary/40 transition-all"
                  >
                    <PosterImage
                      src={anchor.poster_path}
                      alt={anchor.title}
                      title={anchor.title}
                      type={anchor.media_type}
                      tmdbSize="w185"
                      showTitleInFallback={false}
                      containerClassName="w-11 h-16 rounded-lg shrink-0 border border-border/60"
                    />

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {anchor.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/80 border border-border/60 text-foreground/90 font-medium">
                          <AnchorReasonIcon anchor={anchor} />
                          {anchor.reason_label}
                        </span>
                        <span className="text-muted-foreground font-semibold tabular-nums">
                          {anchor.similarity}% similar
                        </span>
                        {anchor.priority_note && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold">
                            {anchor.priority_note}
                          </span>
                        )}
                      </div>
                      {anchor.shared_genres && anchor.shared_genres.length > 0 && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          Em comum: {anchor.shared_genres.join(" · ")}
                        </p>
                      )}
                    </div>

                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Bloco 3: Decomposição por pilares */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pilares da Compatibilidade
            </h3>

            <div className="space-y-3">
              {breakdown.pillars.map((pillar) => {
                const isNovelty = pillar.status === "novelty";
                const clampedPct = Math.max(0, Math.min(100, Math.round(pillar.percent)));

                return (
                  <div
                    key={pillar.key}
                    className="rounded-xl bg-card/70 border border-border/70 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <PillarIcon pillar={pillar} />
                        <span className="text-sm font-semibold text-foreground truncate">
                          {pillar.label}
                        </span>
                        {pillar.impact_label && (
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded-md border shrink-0",
                              pillar.impact === "high"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-muted/60 text-muted-foreground border-border/60"
                            )}
                          >
                            {pillar.impact_label}
                          </span>
                        )}
                      </div>

                      {isNovelty ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/70 shrink-0">
                          Novidade
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-foreground tabular-nums shrink-0">
                          {clampedPct}%
                        </span>
                      )}
                    </div>

                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500 ease-out",
                          getPillarBarClass(pillar.status)
                        )}
                        style={{ width: `${clampedPct}%` }}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {pillar.description}
                    </p>

                    {pillar.chips && pillar.chips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {pillar.chips.map((chip) => (
                          <span
                            key={chip}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted/70 border border-border/60 text-foreground/90"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Bloco 4: Mapa das Facetas (Personas) */}
          {breakdown.personas.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mapa das suas Facetas
                </h3>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Personas do perfil
                </span>
              </div>

              <div className="space-y-2">
                {breakdown.personas.map((persona) => {
                  const pct = Math.max(0, Math.min(100, Math.round(persona.score)));
                  return (
                    <div
                      key={persona.id || persona.name}
                      className={cn(
                        "rounded-xl border p-3 space-y-2 transition-colors",
                        persona.is_primary
                          ? "bg-primary/10 border-primary/30"
                          : "bg-card/60 border-border/70"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base leading-none shrink-0" aria-hidden="true">
                            {persona.emoji}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                            {persona.name}
                          </span>
                          {persona.is_primary && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground shrink-0">
                              Principal
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-foreground tabular-nums shrink-0">
                          {pct}%
                        </span>
                      </div>

                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500 ease-out",
                            persona.is_primary ? "bg-primary" : "bg-foreground/45"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Bloco 5: O que impulsionou vs. O que segurou a nota */}
          {showAdjustmentsSection && (
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                O que puxou e o que segurou a nota
              </h3>

              {breakdown.base_score !== undefined && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card/80 border border-border/80 px-3.5 py-2.5 text-xs">
                  <span className="text-muted-foreground font-medium truncate">
                    {breakdown.base_source_label || "Base do perfil"}
                  </span>
                  <div className="flex items-center gap-1.5 font-bold tabular-nums shrink-0">
                    <span className="text-foreground">
                      {Math.round(breakdown.base_score)}%
                    </span>
                    {Math.abs(netAdjustment) >= 0.1 && (
                      <>
                        <span className="text-muted-foreground font-normal">→</span>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded-md text-[11px]",
                            netAdjustment > 0
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                          )}
                        >
                          {netAdjustment > 0
                            ? `+${netAdjustment.toFixed(1).replace(".0", "")}%`
                            : `${netAdjustment.toFixed(1).replace(".0", "")}%`}
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground font-normal">=</span>
                    <span className="text-primary font-black">
                      {Math.round(breakdown.score)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {breakdown.boosts.map((boost) => (
                  <div
                    key={boost.key}
                    className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3"
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {boost.label}
                        </span>
                        {boost.delta !== null && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25 tabular-nums shrink-0">
                            +{boost.delta.toFixed(1).replace(".0", "")}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {boost.detail}
                      </p>
                    </div>
                  </div>
                ))}

                {breakdown.restraints.map((restraint) => {
                  const hasNumericPenalty = restraint.delta !== null && restraint.delta < 0;
                  return (
                    <div
                      key={restraint.key}
                      className="flex items-start gap-2.5 rounded-xl bg-muted/60 border border-border p-3"
                    >
                      {hasNumericPenalty ? (
                        <TrendingDown className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground">
                            {restraint.label}
                          </span>
                          {restraint.delta !== null && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/25 tabular-nums shrink-0">
                              {restraint.delta.toFixed(1).replace(".0", "")}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug">
                          {restraint.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Rodapé discreto */}
          <footer className="pt-2 pb-4 border-t border-border/60">
            <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
              Cálculo dinâmico que combina suas avaliações, favoritos, títulos reassistidos e as facetas do seu perfil de gosto no OmniWatch.
            </p>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}
