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
  ArrowRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
          <Ban className="w-3 h-3 text-muted-foreground" /> Ignorado
        </span>
      );
    }
    const status = item.status;
    switch (status) {
      case "completed":
      case "watched":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Assistido
          </span>
        );
      case "watching":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            <PlayCircle className="w-3 h-3" /> Assistindo
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
            <CalendarClock className="w-3 h-3" /> Em Breve
          </span>
        );
      case "plan_to_watch":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
            <Clock className="w-3 h-3" /> Quero Ver
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-md border border-border/40">
            Não na lista
          </span>
        );
    }
  }

  return (
    <div className="group rounded-2xl border border-border/80 hover:border-border bg-card hover:bg-card/95 overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between">
      {/* Header com Backdrop e Badges Flutuantes */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-muted">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={universe.name}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
            <Globe className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none" />
        <Link
          href={detailHref}
          aria-label={`Abrir detalhes de ${universe.name}`}
          className="absolute inset-0 z-[5]"
        />

        {/* Badge flutuante de Nota Média no topo esquerdo */}
        {averageRating && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-md pointer-events-none">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{averageRating}</span>
          </div>
        )}

        {/* Action buttons no topo direito */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-md hover:bg-background border border-border/60 text-foreground cursor-pointer shadow-sm"
            onClick={handleSync}
            disabled={isSyncing}
            title="Sincronizar novas obras do universo"
          >
            <RotateCw className={cn("w-3.5 h-3.5 text-primary", isSyncing && "animate-spin")} />
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-md hover:bg-destructive hover:text-white border border-border/60 text-destructive cursor-pointer shadow-sm"
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-700/60 shadow-sm flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[2.5]" /> 100% Concluído
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-foreground/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 shadow-sm">
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
          <h3 className="text-lg sm:text-xl font-bold truncate drop-shadow-md text-foreground group-hover:text-primary transition-colors">
            {universe.name}
          </h3>
        </div>
      </div>

      {/* Progress & Overview Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Progresso de Visualização */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Progresso</span>
              <span className="font-bold text-foreground">
                {universe.watched_items} de {activeTotal} ({Math.round(universe.personal_completion_percentage ?? universe.completion_percentage)}%)
              </span>
            </div>

            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border/40">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-primary to-amber-500"
                )}
                style={{ width: `${Math.min(100, Math.max(0, universe.personal_completion_percentage ?? universe.completion_percentage))}%` }}
              />
            </div>

            {universe.ignored_items_count && universe.ignored_items_count > 0 ? (
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                <span>Catálogo total: {universe.total_items}</span>
                <span>{universe.ignored_items_count} obra(s) ignorada(s)</span>
              </div>
            ) : null}
          </div>

          {/* Miniaturas das Obras do Universo (Visual Rápido Instantâneo) */}
          {universe.items && universe.items.length > 0 && (
            <div className="mb-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5 font-medium">
                <span>Obras do universo:</span>
                <span>{universe.total_items} {universe.total_items === 1 ? 'obra' : 'obras'}</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {universe.items.slice(0, 5).map((part, i) => {
                  const isWatched = part.status === "completed" || part.status === "watched";
                  const posterUrl = part.poster_path ? `https://image.tmdb.org/t/p/w92${part.poster_path}` : null;
                  return (
                    <div
                      key={`${part.media_type}-${part.tmdb_id}-${i}`}
                      className="relative w-8 h-12 rounded-md overflow-hidden bg-muted border border-border/60 shrink-0 shadow-xs group/thumb"
                      title={`${part.title} (${isWatched ? "Assistido" : "Pendente"})`}
                    >
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={part.title}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground font-mono">
                          {part.media_type === "tv" ? "TV" : "FILM"}
                        </div>
                      )}
                      {isWatched && (
                        <div className="absolute inset-0 bg-emerald-950/60 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {universe.items.length > 5 && (
                  <span className="text-[10px] text-muted-foreground font-semibold px-1">
                    +{universe.items.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {universe.overview && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {universe.overview}
            </p>
          )}
        </div>

        {/* Rodapé do Card com Ações (Ver Universo & Expandir) */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
          <Link
            href={detailHref}
            className="flex-1"
          >
            <Button
              variant="default"
              size="sm"
              className="w-full gap-1.5 text-xs font-semibold cursor-pointer shadow-sm"
            >
              <span>Ver Universo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            title={isExpanded ? "Ocultar lista interna" : `Ver todas as ${universe.total_items} obras`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Expandable Media List */}
        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-border/40 divide-y divide-border/30 max-h-80 overflow-y-auto pr-1 animate-in fade-in duration-200">
            {universe.items.map((item, idx) => {
              const itemHref = item.media_type === "tv" ? `/tv/${item.tmdb_id}` : `/movie/${item.tmdb_id}`;
              return (
                <div
                  key={`${item.media_type}-${item.tmdb_id}-${idx}`}
                  className="py-2 flex items-center justify-between gap-2.5 hover:bg-muted/40 px-1.5 rounded-lg transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-muted-foreground w-4 text-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="relative w-7 h-10 rounded overflow-hidden bg-muted shrink-0 border border-border/40">
                      {item.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">
                          N/A
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={itemHref}
                        className="font-medium text-foreground hover:text-primary transition-colors truncate block"
                      >
                        {item.title}
                      </Link>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <span>{item.media_type === "tv" ? "Série" : "Filme"}</span>
                        {item.release_date && (
                          <span>• {item.release_date.split("-")[0]}</span>
                        )}
                        {item.rating && (
                          <span className="flex items-center text-amber-500 font-medium">
                            • <Star className="w-2.5 h-2.5 fill-amber-500 ml-0.5 mr-0.5" />
                            {item.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
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
