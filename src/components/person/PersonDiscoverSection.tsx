"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Trophy, Activity, Star } from "lucide-react";
import { PersonCastItem, PersonDetailsResponse, PersonDiscoverResponse } from "@/types/person";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { useMyListStore } from "@/store/useMyListStore";
import { api } from "@/lib/axios";

interface PersonDiscoverSectionProps {
  person: PersonDetailsResponse;
}

const EXCLUDED_ACTING_GENRE_IDS = new Set([10767, 10763, 10764, 99]);
const EXCLUDED_CHARACTER_TOKENS = [
  "self",
  "himself",
  "herself",
  "ele mesmo",
  "ela mesma",
  "uncredited",
  "não creditado",
  "archive footage",
  "archive sound",
  "cameo",
];

function computeLocalRoleScore(item: PersonCastItem, targetDept: string): { score: number; label: string } {
  const dept = item.department || targetDept;

  if (dept === "Acting") {
    if (item.media_type === "tv") {
      const epCount = item.episode_count ?? 0;
      if (epCount >= 16) return { score: 1.0, label: "Elenco Principal" };
      if (epCount >= 8) return { score: 0.9, label: "Protagonista" };
      if (epCount >= 4) return { score: 0.7, label: "Destaque na Série" };
      if (epCount >= 2) return { score: 0.35, label: "Participação" };
      return { score: 0.1, label: "Participação Especial" };
    }

    const order = item.order;
    if (order === null || order === undefined) return { score: 0.5, label: "Elenco" };
    if (order === 0) return { score: 1.0, label: "Protagonista" };
    if (order === 1) return { score: 0.95, label: "Protagonista" };
    if (order === 2) return { score: 0.85, label: "Co-protagonista" };
    if (order <= 4) return { score: 0.75, label: "Papel de Destaque" };
    if (order <= 7) return { score: 0.55, label: "Coadjuvante" };
    if (order <= 12) return { score: 0.3, label: "Elenco de Apoio" };
    return { score: 0.0, label: "Participação" };
  }

  const jobLower = (item.job || "").toLowerCase();
  if (dept === "Directing" || jobLower.includes("director")) {
    if (jobLower === "director" || jobLower === "series director" || jobLower === "diretor") {
      return { score: 1.0, label: "Direção" };
    }
    return { score: 0.65, label: item.job || "Direção" };
  }

  if (dept === "Writing" || dept === "Creator" || ["creator", "screenplay", "writer", "story"].includes(jobLower)) {
    return { score: 0.95, label: item.job || "Roteiro / Criação" };
  }

  if (dept === "Production") {
    if (jobLower === "producer") return { score: 0.85, label: "Produção" };
    return { score: 0.6, label: item.job || "Produção" };
  }

  return { score: 0.6, label: item.job || dept };
}

function computeLocalQualityScore(item: PersonCastItem): number {
  const v = Math.max(0, item.vote_count || 0);
  const r = item.vote_average || 0;
  const m = 250;
  const c = 6.8;

  const bayesian = (v / (v + m)) * r + (m / (v + m)) * c;
  const ratingNorm = Math.max(0, Math.min(1, (bayesian - 5.2) / 3.0));

  const logVotes = Math.log10(Math.max(1, v));
  const reachNorm = Math.max(0, Math.min(1, (logVotes - 1.7) / 2.0));

  return 0.6 * ratingNorm + 0.4 * reachNorm;
}

export function PersonDiscoverSection({ person }: PersonDiscoverSectionProps) {
  const [serverDiscover, setServerDiscover] = useState<PersonDiscoverResponse | null>(null);
  const [mode, setMode] = useState<"discover" | "known_for">("discover");

  const listItems = useMyListStore((state) => state.items);
  const posterUrl = "https://image.tmdb.org/t/p/w185";
  const targetDept = person.known_for_department || "Acting";

  useEffect(() => {
    let active = true;
    async function loadPersonalizedDiscover() {
      try {
        const res = await api.get<PersonDiscoverResponse>(`/api/person/${person.id}/discover?limit=16`);
        if (active && res.status === 200 && res.data?.items) {
          setServerDiscover(res.data);
        }
      } catch {
        // Fallback silencioso para o cálculo local se offline ou não autenticado
      }
    }
    loadPersonalizedDiscover();
    return () => {
      active = false;
    };
  }, [person.id]);

  // IDs já assistidos, em andamento ou abandonados na store local
  const watchedOrSkippedIds = useMemo(() => {
    const ids = new Set<number>();
    for (const saved of Object.values(listItems)) {
      if (saved && (saved.status === "completed" || saved.status === "watching" || saved.status === "dropped")) {
        ids.add(Number(saved.tmdb_id));
      }
    }
    return ids;
  }, [listItems]);

  // Lista clássica "Conhecido(a) por" (sem filtrar assistidos, ordenada por vote_count)
  const classicKnownFor = useMemo(() => {
    const filtered = person.combined_credits.filter((item) => {
      if (!item.poster_path) return false;
      if (item.department !== targetDept) return false;
      if (targetDept === "Acting") {
        const charLower = (item.character || "").toLowerCase();
        if (EXCLUDED_CHARACTER_TOKENS.some((tok) => charLower.includes(tok))) return false;
        if (item.order !== null && item.order !== undefined && item.order > 10) return false;
      }
      return true;
    });

    filtered.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

    const seen = new Set<number>();
    const result: PersonCastItem[] = [];
    for (const item of filtered) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        const { label } = computeLocalRoleScore(item, targetDept);
        result.push({
          ...item,
          role_label: item.role_label || label,
        });
      }
      if (result.length >= 8) break;
    }
    return result;
  }, [person.combined_credits, targetDept]);

  // Lista "Para Você Descobrir" (Score de Destaque Personalizado 40/35/25 + filtro reativo de assistidos)
  const discoverItems = useMemo(() => {
    // Se já recebemos o ranking personalizado do servidor (40% Protagonismo + 35% Qualidade + 25% Afinidade),
    // filtramos reativamente com a store local e retornamos os 8 melhores.
    if (serverDiscover && serverDiscover.items.length > 0) {
      const filteredServer = serverDiscover.items.filter(
        (item) => item.poster_path && !watchedOrSkippedIds.has(item.id)
      );
      if (filteredServer.length > 0) {
        return filteredServer.slice(0, 8);
      }
    }

    // Cálculo imediato de fallback (40% Protagonismo + 35% Qualidade escalado para 100%)
    const selectLocalCandidates = (minVotes: number, strictRole: boolean) => {
      const map = new Map<number, PersonCastItem>();
      for (const item of person.combined_credits) {
        if (!item.poster_path || watchedOrSkippedIds.has(item.id)) continue;
        if (item.department !== targetDept) continue;
        if ((item.vote_count || 0) < minVotes) continue;

        if (targetDept === "Acting") {
          const charLower = (item.character || "").toLowerCase();
          if (EXCLUDED_CHARACTER_TOKENS.some((tok) => charLower.includes(tok))) continue;
          if (strictRole && (item.genre_ids || []).some((gid) => EXCLUDED_ACTING_GENRE_IDS.has(gid))) continue;
          if (item.media_type === "movie") {
            if (item.order !== null && item.order !== undefined && item.order > (strictRole ? 10 : 15)) continue;
          } else if (item.media_type === "tv") {
            if (strictRole && item.episode_count !== null && item.episode_count !== undefined && item.episode_count <= 2) {
              continue;
            }
          }
        }

        const existing = map.get(item.id);
        if (!existing || (item.order ?? 99) < (existing.order ?? 99)) {
          map.set(item.id, item);
        }
      }
      return Array.from(map.values());
    };

    let candidates = selectLocalCandidates(30, true);
    if (candidates.length < 6) {
      candidates = selectLocalCandidates(5, false);
    }

    const scored: PersonCastItem[] = [];
    for (const item of candidates) {
      const { score: roleNorm, label: roleLabel } = computeLocalRoleScore(item, targetDept);
      if (roleNorm <= 0) continue;

      const qualityNorm = computeLocalQualityScore(item);
      const base75 = roleNorm * 40.0 + qualityNorm * 35.0;
      const suggestionScore = Math.round(((base75 / 75.0) * 100.0) * 10) / 10;

      scored.push({
        ...item,
        suggestion_score: suggestionScore,
        role_label: roleLabel,
      });
    }

    scored.sort((a, b) => (b.suggestion_score || 0) - (a.suggestion_score || 0) || (b.vote_count || 0) - (a.vote_count || 0));
    return scored.slice(0, 8);
  }, [serverDiscover, person.combined_credits, targetDept, watchedOrSkippedIds]);

  const displayedItems = mode === "discover" && discoverItems.length > 0 ? discoverItems : classicKnownFor;

  if (displayedItems.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            {mode === "discover" && discoverItems.length > 0 ? (
              <>
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Para Você Descobrir</h3>
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-semibold">Conhecido(a) por</h3>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mode === "discover" && discoverItems.length > 0
              ? "Papéis de destaque que você ainda não viu"
              : "Obras mais populares de toda a carreira"}
          </p>
        </div>

        {discoverItems.length > 0 && classicKnownFor.length > 0 && (
          <div className="inline-flex items-center rounded-lg bg-muted/60 p-1 border border-border/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMode("discover")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === "discover"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Para Você Descobrir
            </button>
            <button
              type="button"
              onClick={() => setMode("known_for")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === "known_for"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Conhecido(a) por
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {displayedItems.map((item) => {
          const displayScore = item.suggestion_score ?? item.match_score;
          const hasDisplayScore = typeof displayScore === "number" && displayScore > 0;
          const hasVoteAvg = typeof item.vote_average === "number" && item.vote_average > 0;

          return (
            <div
              key={`${mode}-${item.id}`}
              className="snap-start flex-shrink-0 w-[140px] flex flex-col gap-1.5 relative group"
            >
              <Link href={`/${item.media_type}/${item.id}`}>
                <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-muted shadow-sm border border-border/40 group-hover:border-primary/50 transition-all">
                  {item.poster_path && (
                    <Image
                      src={`${posterUrl}${item.poster_path}`}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  )}

                  {/* Badge do Score de Destaque Personalizado (40/35/25) ou Nota no topo esquerdo */}
                  {mode === "discover" && hasDisplayScore ? (
                    <div
                      title={`${Math.round(displayScore!)}% de Destaque Personalizado`}
                      className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-primary/40 text-[10px] font-bold text-primary flex items-center gap-1 shadow-sm"
                    >
                      <Activity className="w-2.5 h-2.5" />
                      {Math.round(displayScore!)}%
                    </div>
                  ) : hasVoteAvg ? (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-semibold text-amber-300 flex items-center gap-1 shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      {item.vote_average!.toFixed(1)}
                    </div>
                  ) : null}
                </div>
              </Link>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <AddToListButton
                  tmdb_id={item.id}
                  media_type={item.media_type as "movie" | "tv"}
                  release_date={item.release_date}
                  className="w-8 h-8 [&>svg]:w-4 [&>svg]:h-4"
                />
              </div>

              <Link href={`/${item.media_type}/${item.id}`} className="mt-0.5">
                <p className="text-xs font-semibold text-center truncate hover:underline" title={item.title}>
                  {item.title}
                </p>
              </Link>

              {item.role_label && (
                <span className="text-[11px] text-muted-foreground text-center truncate">
                  {item.role_label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
