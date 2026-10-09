"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserFollowedCollection } from "@/types/collections";
import { syncCollection, unfollowCollection } from "@/services/collections";
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
  Star,
  Film
} from "lucide-react";

interface FollowedCollectionCardProps {
  collection: UserFollowedCollection;
  onUnfollow: (tmdbId: number) => void;
  onSyncComplete?: () => void;
}

export function FollowedCollectionCard({
  collection,
  onUnfollow,
  onSyncComplete,
}: FollowedCollectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUnfollowing, setIsUnfollowing] = useState(false);

  const backdropUrl = collection.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${collection.backdrop_path}`
    : collection.poster_path
    ? `https://image.tmdb.org/t/p/w500${collection.poster_path}`
    : null;

  const isCompleted =
    collection.total_movies > 0 &&
    collection.watched_movies === collection.total_movies;

  // Calcula média de notas dos filmes avaliados da coleção
  const ratedItems = (collection.items || []).filter(
    (item) => typeof item.rating === "number" && item.rating > 0
  );
  const ratedCount = collection.rated_movies_count ?? ratedItems.length;
  const averageRating =
    collection.user_average_rating !== undefined && collection.user_average_rating !== null
      ? collection.user_average_rating.toFixed(1)
      : ratedItems.length > 0
      ? (
          ratedItems.reduce((acc, curr) => acc + (curr.rating || 0), 0) /
          ratedItems.length
        ).toFixed(1)
      : null;

  async function handleSync() {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncCollection(collection.tmdb_id);
      const totalAdded = (res.new_parts_count || 0) + (res.reconciled_count || 0);
      if (totalAdded > 0) {
        toast.add({
          title: "Coleção sincronizada!",
          description: `${totalAdded} filme(s) foram colocados na sua lista em "Quero Ver".`,
          type: "success",
        });
      } else {
        toast.add({
          title: "Tudo atualizado!",
          description: "Todos os filmes da franquia já estão na sua lista e não há lançamentos novos no TMDB.",
          type: "info",
        });
      }
      onSyncComplete?.();
    } catch (err: any) {
      toast.add({
        title: "Erro ao sincronizar",
        description: err.response?.data?.detail || "Falha ao verificar novidades no TMDB.",
        type: "error",
      });
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleUnfollow() {
    if (isUnfollowing) return;
    if (!confirm(`Deseja parar de monitorar a coleção "${collection.name}"? Os filmes adicionados continuarão na sua lista.`)) {
      return;
    }

    setIsUnfollowing(true);
    try {
      await unfollowCollection(collection.tmdb_id);
      toast.add({
        title: "Coleção removida",
        description: `Você deixou de seguir "${collection.name}".`,
        type: "info",
      });
      onUnfollow(collection.tmdb_id);
    } catch (err: any) {
      toast.add({
        title: "Erro",
        description: "Não foi possível deixar de seguir a coleção.",
        type: "error",
      });
    } finally {
      setIsUnfollowing(false);
    }
  }

  function getStatusBadge(status?: string | null) {
    switch (status) {
      case "completed":
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
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden transition-all duration-200 hover:border-border">
      {/* Header com Backdrop */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-muted">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={collection.name}
            fill
            className="object-cover object-center transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
            <Film className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <Link
          href={`/collection/${collection.tmdb_id}`}
          aria-label={`Abrir ${collection.name}`}
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
            title="Sincronizar novos filmes com TMDB"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-md text-destructive hover:bg-destructive hover:text-white cursor-pointer"
            onClick={handleUnfollow}
            disabled={isUnfollowing}
            title="Deixar de seguir esta coleção"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Info no rodapé da imagem */}
        <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            {isCompleted ? (
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700/60">
                100% Concluída
              </span>
            ) : (
              <span className="text-xs font-medium text-muted-foreground bg-background/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                Franquia Monitorada
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold truncate drop-shadow-sm">
            {collection.name}
          </h2>
        </div>
      </div>

      {/* Progress & Overview Content */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground font-medium">
            Progresso da Coleção
          </span>
          <span className="font-semibold">
            {collection.watched_movies} de {collection.total_movies} assistidos ({collection.completion_percentage}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-secondary/80 rounded-full h-2.5 overflow-hidden mb-3">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              isCompleted ? "bg-emerald-500" : "bg-primary"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, collection.completion_percentage))}%` }}
          />
        </div>

        {/* Linha de Avaliação da Franquia */}
        <div className="flex items-center justify-between text-xs mb-3 py-1.5 px-3 rounded-lg bg-secondary/30 border border-border/40">
          <span className="text-muted-foreground font-medium flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
            Sua Avaliação
          </span>
          {averageRating ? (
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <span className="text-amber-400 font-bold">{averageRating}</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                ({ratedCount} de {collection.total_movies} {collection.total_movies === 1 ? "filme" : "filmes"} avaliados)
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground text-[11px]">Sem avaliações</span>
          )}
        </div>

        {collection.overview && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4">
            {collection.overview}
          </p>
        )}

        {/* Toggle Expand Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{isExpanded ? "Ocultar filmes da franquia" : `Ver todos os ${collection.total_movies} filmes`}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </Button>

        {/* Expandable Movie List */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border/50 divide-y divide-border/30">
            {collection.items.map((item, idx) => (
              <div
                key={item.id}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-muted-foreground w-4 text-center">
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
                      href={`/movie/${item.tmdb_id}`}
                      className="text-sm font-medium hover:underline truncate block"
                    >
                      {item.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {item.release_date && (
                        <span>{item.release_date.split("-")[0]}</span>
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
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
