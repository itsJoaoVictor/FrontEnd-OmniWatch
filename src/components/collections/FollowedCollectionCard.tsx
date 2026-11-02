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
  Film,
  Check,
  ArrowRight
} from "lucide-react";
import { PosterImage } from "@/components/shared/PosterImage";
import { cn } from "@/lib/utils";

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

  const pct = Math.min(100, Math.max(0, collection.completion_percentage));

  async function handleSync(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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

  async function handleUnfollow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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
    } catch {
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
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            <Check className="w-3 h-3 stroke-[2.5]" /> Assistido
          </span>
        );
      case "watching":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            <PlayCircle className="w-3 h-3" /> Assistindo
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
      {/* Top Banner com Backdrop e Badges Flutuantes */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-muted">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={collection.name}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
            <Film className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradiente multi-camada compatível com todos os temas */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none" />

        {/* Link principal no banner */}
        <Link
          href={`/collection/${collection.tmdb_id}`}
          aria-label={`Abrir detalhes de ${collection.name}`}
          className="absolute inset-0 z-[5]"
        />

        {/* Badge flutuante de Nota Média no topo esquerdo */}
        {averageRating && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-md pointer-events-none">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{averageRating}</span>
          </div>
        )}

        {/* Botões de Ação no topo direito (Sincronizar e Deixar de seguir) */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-md hover:bg-background border border-border/60 text-foreground cursor-pointer shadow-sm"
            onClick={handleSync}
            disabled={isSyncing}
            title="Sincronizar novos filmes com TMDB"
          >
            <RotateCw className={cn("w-3.5 h-3.5 text-primary", isSyncing && "animate-spin")} />
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-md hover:bg-destructive hover:text-white border border-border/60 text-destructive cursor-pointer shadow-sm"
            onClick={handleUnfollow}
            disabled={isUnfollowing}
            title="Deixar de monitorar esta franquia"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Título e Status no rodapé do banner */}
        <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            {isCompleted ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-700/60 shadow-sm flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[2.5]" /> 100% Concluída
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-foreground/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 shadow-sm">
                Franquia Monitorada
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-bold truncate drop-shadow-md text-foreground group-hover:text-primary transition-colors">
            {collection.name}
          </h3>
        </div>
      </div>

      {/* Corpo de Conteúdo */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Progresso de Visualização */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Progresso</span>
              <span className="font-bold text-foreground">
                {collection.watched_movies} de {collection.total_movies} ({pct}%)
              </span>
            </div>

            {/* Barra de Progresso Sólida */}
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border/40">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isCompleted ? "bg-emerald-500" : "bg-primary"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Miniaturas dos Filmes da Franquia (Visual Rápido Instantâneo) */}
          {collection.items && collection.items.length > 0 && (
            <div className="mb-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5 font-medium">
                <span>Obras da saga:</span>
                <span>{collection.items.length} {collection.items.length === 1 ? 'filme' : 'filmes'}</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {collection.items.slice(0, 5).map((part, i) => {
                  const isWatched = part.status === "completed";
                  return (
                    <div
                      key={part.id || i}
                      className="relative w-8 h-12 rounded-md overflow-hidden bg-muted border border-border/60 shrink-0 shadow-xs group/thumb"
                      title={`${part.title} (${isWatched ? "Assistido" : "Pendente"})`}
                    >
                      <PosterImage
                        src={part.poster_path}
                        alt={part.title}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                      {isWatched && (
                        <div className="absolute inset-0 bg-emerald-950/60 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {collection.items.length > 5 && (
                  <span className="text-[10px] text-muted-foreground font-semibold px-1">
                    +{collection.items.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {collection.overview && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {collection.overview}
            </p>
          )}
        </div>

        {/* Rodapé do Card com Ações (Ver Detalhes & Expandir) */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
          <Link
            href={`/collection/${collection.tmdb_id}`}
            className="flex-1"
          >
            <Button
              variant="default"
              size="sm"
              className="w-full gap-1.5 text-xs font-semibold cursor-pointer shadow-sm"
            >
              <span>Ver Franquia</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            title={isExpanded ? "Ocultar lista interna" : "Expandir lista rápida"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Lista Rápida Expansível */}
        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-border/40 divide-y divide-border/30 animate-in fade-in duration-200">
            {collection.items.map((item, idx) => (
              <div
                key={item.id}
                className="py-2 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] text-muted-foreground w-3.5 shrink-0">
                    {idx + 1}
                  </span>
                  <Link
                    href={`/movie/${item.tmdb_id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors truncate"
                    title={item.title}
                  >
                    {item.title}
                  </Link>
                </div>
                <div className="shrink-0">{getStatusBadge(item.status)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
