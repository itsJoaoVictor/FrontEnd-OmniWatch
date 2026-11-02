"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CollectionSuggestion } from "@/types/collections";
import { followCollection, dismissCollectionSuggestion } from "@/services/collections";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Sparkles, BookmarkPlus, X, Film, Check, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollectionSuggestionCardProps {
  suggestion: CollectionSuggestion;
  onFollow: (tmdbId: number) => void;
  onDismiss: (tmdbId: number) => void;
}

export function CollectionSuggestionCard({
  suggestion,
  onFollow,
  onDismiss,
}: CollectionSuggestionCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const backdropUrl = suggestion.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${suggestion.backdrop_path}`
    : suggestion.poster_path
    ? `https://image.tmdb.org/t/p/w500${suggestion.poster_path}`
    : null;

  async function handleFollow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isFollowing) return;

    setIsFollowing(true);
    try {
      const res = await followCollection(suggestion.tmdb_id);
      toast.add({
        title: "Coleção seguida!",
        description: `Você começou a acompanhar ${suggestion.name}. ${res.movies_added} novos filmes foram adicionados à sua lista.`,
        type: "success",
      });
      onFollow(suggestion.tmdb_id);
    } catch (err: any) {
      toast.add({
        title: "Erro ao seguir coleção",
        description: err?.response?.data?.detail || "Ocorreu uma falha ao seguir a coleção.",
        type: "error",
      });
      setIsFollowing(false);
    }
  }

  async function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isDismissing) return;

    setIsDismissing(true);
    try {
      await dismissCollectionSuggestion(suggestion.tmdb_id);
      toast.add({
        title: "Sugestão ignorada",
        description: `A coleção "${suggestion.name}" não será mais sugerida.`,
        type: "info",
      });
      onDismiss(suggestion.tmdb_id);
    } catch (err) {
      toast.add({
        title: "Erro ao dispensar",
        description: "Não foi possível dispensar a sugestão.",
        type: "error",
      });
      setIsDismissing(false);
    }
  }

  return (
    <div className="relative group rounded-2xl border border-amber-500/30 hover:border-amber-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      {/* Top Banner Image with Gradient */}
      <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-muted">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={suggestion.name}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
            <Film className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />

        {/* Suggestion Badge */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs shadow-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Saga Detectada</span>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          disabled={isDismissing}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer border border-border/50"
          title="Dispensar sugestão"
          aria-label="Dispensar sugestão"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Click overlay leading to collection details */}
        <Link
          href={`/collection/${suggestion.tmdb_id}`}
          className="absolute inset-0 z-[5]"
          aria-label={`Ver detalhes de ${suggestion.name}`}
        />
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <Link
              href={`/collection/${suggestion.tmdb_id}`}
              className="text-base font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {suggestion.name}
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
              Você tem {suggestion.movies_in_list} de {suggestion.total_movies} filmes
            </span>
          </div>

          {suggestion.matched_movie_titles && suggestion.matched_movie_titles.length > 0 && (
            <div className="mb-2">
              <p className="text-[11px] text-muted-foreground mb-1 font-medium">Já na sua biblioteca:</p>
              <div className="flex flex-wrap gap-1">
                {suggestion.matched_movie_titles.slice(0, 3).map((title, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] bg-secondary text-secondary-foreground border border-border/50 px-2 py-0.5 rounded-md line-clamp-1 max-w-[200px]"
                  >
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{title}</span>
                  </span>
                ))}
                {suggestion.matched_movie_titles.length > 3 && (
                  <span className="text-[10px] text-muted-foreground self-center">
                    +{suggestion.matched_movie_titles.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Button
            size="sm"
            onClick={handleFollow}
            disabled={isFollowing}
            className="flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>{isFollowing ? "Seguindo..." : "Seguir Franquia"}</span>
          </Button>

          <Link href={`/collection/${suggestion.tmdb_id}`} className="shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
