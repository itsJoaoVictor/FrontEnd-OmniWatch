"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserFollowedUniverse } from "@/types/universes";
import { syncUniverse, unfollowUniverse } from "@/services/universes";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  RotateCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  PlayCircle,
  CalendarClock,
  Star,
  Globe,
  Film,
  Tv,
  Layers,
  Ban,
} from "lucide-react";

interface FollowedUniverseCardProps {
  universe: UserFollowedUniverse;
  onUnfollow: (universeKey: string) => void;
  onSyncComplete?: () => void;
}

export function FollowedUniverseCard({
  universe,
  onUnfollow,
  onSyncComplete,
}: FollowedUniverseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUnfollowing, setIsUnfollowing] = useState(false);

  const backdropUrl = universe.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${universe.backdrop_path}`
    : universe.poster_path
    ? `https://image.tmdb.org/t/p/w500${universe.poster_path}`
    : null;

  const activeTotal =
    universe.active_items !== undefined
      ? universe.active_items
      : Math.max(0, universe.total_items - (universe.ignored_items_count || 0));

  const isCompleted = activeTotal > 0 && universe.watched_items >= activeTotal;

  const ratedItems = (universe.items || []).filter(
    (item) => typeof item.rating === "number" && item.rating > 0
  );
  const ratedCount = universe.rated_items_count ?? ratedItems.length;
  const averageRating =
    universe.user_average_rating !== undefined && universe.user_average_rating !== null
      ? universe.user_average_rating.toFixed(1)
      : ratedItems.length > 0
      ? (
          ratedItems.reduce((acc, curr) => acc + (curr.rating || 0), 0) /
          ratedItems.length
        ).toFixed(1)
      : null;

  const detailHref = `/universe/${encodeURIComponent(universe.universe_key)}`;

  async function handleSync() {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncUniverse(universe.universe_key);
      toast.add({
        title: "Universo sincronizado!",
        description: `O universo "${universe.name}" foi atualizado com o catálogo mais recente.`,
        type: "success",
      });
      onSyncComplete?.();
    } catch (err: any) {
      toast.add({
        title: "Erro ao sincronizar",
        description: err.response?.data?.detail || "Falha ao verificar novidades do universo.",
        type: "error",
      });
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleUnfollow() {
    if (isUnfollowing) return;
    if (
      !confirm(
        `Deseja parar de monitorar o universo "${universe.name}"? Os filmes e séries já adicionados continuarão na sua lista.`
      )
    ) {
      return;
    }

    setIsUnfollowing(true);
    try {
      await unfollowUniverse(universe.universe_key);
      toast.add({
        title: "Universo removido",
        description: `Você deixou de seguir "${universe.name}".`,
        type: "info",
      });
      onUnfollow(universe.universe_key);
    } catch (err: any) {
      toast.add({
        title: "Erro",
        description: "Não foi possível deixar de seguir o universo.",
        type: "error",
      });
    } finally {
      setIsUnfollowing(false);
    }
  }

  function getStatusBadge(item: any) {
    if (item.is_ignored) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
          <Ban className="w-3 h-3 text-slate-400" /> Ignorado
        </span>
      );
    }
    const status = item.status;
    switch (status) {
      case "completed":
      case "watched":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3" /> Assistido
          </span>
        );
      case "watching":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/50">
            <PlayCircle className="w-3 h-3" /> Assistindo
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/50">
            <CalendarClock className="w-3 h-3" /> Em Breve
          </span>
        );
      case "plan_to_watch":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800/50">
            <Clock className="w-3 h-3" /> Quero Ver
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Não na lista
          </span>
        );
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden transition-all duration-200 hover:border-purple-500/40">
      {/* Header com Backdrop */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-muted">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={universe.name}
            fill
            className="object-cover object-center transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
            <Globe className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <Link
          href={detailHref}
          aria-label={`Abrir ${universe.name}`}
          className="absolute inset-0 z-[5]"
        />

        {/* Badge flutuante de Nota Média no topo esquerdo */}
        {averageRating && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/30 shadow-sm pointer-events-none">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{averageRating}</span>
          </div>
        )}

        {/* Action buttons no topo direito */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-md hover:bg-background cursor-pointer"
            onClick={handleSync}
            disabled={isSyncing}
            title="Sincronizar novas obras do universo"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-md text-destructive hover:bg-destructive hover:text-white cursor-pointer"
            onClick={handleUnfollow}
            disabled={isUnfollowing}
            title="Deixar de seguir este universo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Info no rodapé da imagem */}
        <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {isCompleted ? (
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700/60">
                100% Concluído
              </span>
            ) : (
              <span className="text-xs font-medium text-purple-300 bg-purple-950/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-purple-700/50">
                Universo Monitorado
              </span>
            )}
            {universe.movies_count > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-black/60 text-zinc-200 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <Film className="w-3 h-3 text-blue-400" /> {universe.movies_count}
              </span>
            )}
            {universe.tv_count > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-black/60 text-zinc-200 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <Tv className="w-3 h-3 text-emerald-400" /> {universe.tv_count}
              </span>
            )}
            {universe.collections_count > 1 && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-black/60 text-zinc-200 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <Layers className="w-3 h-3 text-amber-400" /> {universe.collections_count} sagas
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold truncate drop-shadow-sm">
            {universe.name}
          </h2>
        </div>
      </div>

      {/* Progress & Overview Content */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground font-medium">
            Seu Progresso
          </span>
          <span className="font-semibold text-purple-300">
            {universe.watched_items} de {activeTotal} assistidos ({Math.round(universe.personal_completion_percentage ?? universe.completion_percentage)}%)
          </span>
        </div>

        {universe.ignored_items_count && universe.ignored_items_count > 0 ? (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
            <span>Catálogo canônico total</span>
            <span>
              {universe.watched_items} de {universe.total_items} ({Math.round(universe.canonical_completion_percentage ?? ((universe.watched_items / universe.total_items) * 100))}%) • {universe.ignored_items_count} ignorada(s)
            </span>
          </div>
        ) : null}

        {/* Progress Bar */}
        <div className="w-full bg-secondary/80 rounded-full h-2.5 overflow-hidden mb-3">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              isCompleted ? "bg-emerald-500" : "bg-purple-600"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, universe.personal_completion_percentage ?? universe.completion_percentage))}%` }}
          />
        </div>

        {/* Linha de Avaliação do Universo */}
        <div className="flex items-center justify-between text-xs mb-3 py-1.5 px-3 rounded-lg bg-secondary/30 border border-border/40">
          <span className="text-muted-foreground font-medium flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
            Sua Avaliação
          </span>
          {averageRating ? (
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <span className="text-amber-400 font-bold">{averageRating}</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                ({ratedCount} de {universe.total_items} obras avaliadas)
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground text-[11px]">Sem avaliações</span>
          )}
        </div>

        {universe.overview && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4">
            {universe.overview}
          </p>
        )}

        {/* Toggle Expand Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>
            {isExpanded
              ? "Ocultar obras do universo"
              : `Ver todas as ${universe.total_items} obras (Filmes e Séries)`}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </Button>

        {/* Expandable Media List */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border/50 divide-y divide-border/30 max-h-96 overflow-y-auto pr-1">
            {universe.items.map((item, idx) => {
              const itemHref = item.media_type === "tv" ? `/tv/${item.tmdb_id}` : `/movie/${item.tmdb_id}`;
              return (
                <div
                  key={`${item.media_type}-${item.tmdb_id}-${idx}`}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground w-5 text-center">
                      {idx + 1}
                    </span>
                    <div className="relative w-9 h-13 rounded overflow-hidden bg-muted flex-shrink-0">
                      {item.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                          N/A
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={itemHref}
                        className="text-sm font-medium hover:underline truncate block"
                      >
                        {item.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded bg-secondary/70">
                          {item.media_type === "tv" ? (
                            <>
                              <Tv className="w-2.5 h-2.5 text-emerald-400" /> Série
                            </>
                          ) : (
                            <>
                              <Film className="w-2.5 h-2.5 text-blue-400" /> Filme
                            </>
                          )}
                        </span>
                        {item.release_date && (
                          <span>{item.release_date.split("-")[0]}</span>
                        )}
                        {item.collection_name && (
                          <span className="text-[11px] text-purple-400/90 truncate max-w-[160px]">
                            • {item.collection_name}
                          </span>
                        )}
                        {item.rating && (
                          <span className="flex items-center text-yellow-500 font-medium">
                            <Star className="w-3 h-3 fill-yellow-500 mr-0.5" />
                            {item.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {getStatusBadge(item)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
