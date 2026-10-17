"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UniverseSuggestion } from "@/types/universes";
import { followUniverse, dismissUniverseSuggestion } from "@/services/universes";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Globe, BookmarkPlus, X, Film, Tv, Layers, Check, Eye, Sparkles } from "lucide-react";

import { UniverseFollowModal } from "@/components/universes/UniverseFollowModal";

interface UniverseSuggestionCardProps {
  suggestion: UniverseSuggestion;
  onFollow: (universeKey: string) => void;
  onDismiss: (universeKey: string) => void;
}

export function UniverseSuggestionCard({
  suggestion,
  onFollow,
  onDismiss,
}: UniverseSuggestionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const backdropUrl = suggestion.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${suggestion.backdrop_path}`
    : suggestion.poster_path
    ? `https://image.tmdb.org/t/p/w500${suggestion.poster_path}`
    : null;

  const detailHref = `/universe/${encodeURIComponent(suggestion.universe_key)}`;

  function handleFollowClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  }

  function handleModalSuccess(res: { items_added: number; ignored_count: number }) {
    toast.add({
      title: "Universo seguido!",
      description: `Você começou a acompanhar ${suggestion.name}. ${res.items_added} novas obras adicionadas (${res.ignored_count} ignoradas).`,
      type: "success",
    });
    onFollow(suggestion.universe_key);
  }

  async function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isDismissing) return;

    setIsDismissing(true);
    try {
      await dismissUniverseSuggestion(suggestion.universe_key);
      toast.add({
        title: "Sugestão dispensada",
        description: `O universo "${suggestion.name}" foi dispensado. Se você começar a acompanhar novos formatos desta franquia, ele poderá ser reativado.`,
        type: "info",
      });
      onDismiss(suggestion.universe_key);
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
    <div className="relative group rounded-xl border border-purple-500/30 bg-gradient-to-b from-card to-card/90 overflow-hidden shadow-sm hover:shadow-md hover:border-purple-500/50 transition-all duration-300 flex flex-col justify-between">
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
            <Globe className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Suggestion Badge */}
        {suggestion.is_reactivated ? (
          <div
            className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-950 font-bold text-xs shadow-md backdrop-blur-sm border border-amber-300/60"
            title={suggestion.reactivation_reason || "Sugestão reativada por aumento de afinidade"}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sugestão Reativada</span>
          </div>
        ) : (
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-600/90 text-white font-semibold text-xs shadow-md backdrop-blur-sm">
            <Globe className="w-3.5 h-3.5" />
            <span>Universo Sugerido</span>
          </div>
        )}

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          disabled={isDismissing}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
          title="Dispensar sugestão"
          aria-label="Dispensar sugestão"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Click overlay leading to universe details */}
        <Link
          href={detailHref}
          className="absolute inset-0 z-[5]"
          aria-label={`Ver detalhes de ${suggestion.name}`}
        />
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <Link
              href={detailHref}
              className="text-base font-semibold hover:text-purple-400 transition-colors line-clamp-1"
            >
              {suggestion.name}
            </Link>
          </div>

          {suggestion.is_reactivated && suggestion.reactivation_reason && (
            <div className="mb-2.5 flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 rounded-lg px-2.5 py-1.5">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
              <span className="line-clamp-2">{suggestion.reactivation_reason}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Você tem {suggestion.items_in_list} de {suggestion.total_items} obras
            </span>

            {suggestion.movies_count > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
                <Film className="w-3 h-3 text-blue-400" />
                {suggestion.movies_count} {suggestion.movies_count === 1 ? "filme" : "filmes"}
              </span>
            )}

            {suggestion.tv_count > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
                <Tv className="w-3 h-3 text-emerald-400" />
                {suggestion.tv_count} {suggestion.tv_count === 1 ? "série" : "séries"}
              </span>
            )}

            {suggestion.collections_count > 1 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
                <Layers className="w-3 h-3 text-amber-400" />
                {suggestion.collections_count} sagas
              </span>
            )}
          </div>

          {suggestion.matched_titles && suggestion.matched_titles.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] text-muted-foreground mb-1 font-medium">Já na sua lista:</p>
              <div className="flex flex-wrap gap-1">
                {suggestion.matched_titles.slice(0, 3).map((title, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] bg-secondary/70 text-secondary-foreground px-2 py-0.5 rounded-md line-clamp-1 max-w-[200px]"
                  >
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{title}</span>
                  </span>
                ))}
                {suggestion.matched_titles.length > 3 && (
                  <span className="text-[10px] text-muted-foreground self-center">
                    +{suggestion.matched_titles.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <Button
            size="sm"
            onClick={handleFollowClick}
            className="flex-1 gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            Seguir Universo
          </Button>

          <Link href={detailHref} className="shrink-0">
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

      {/* Modal de Confirmação e Seleção Granular */}
      <UniverseFollowModal
        isOpen={isModalOpen}
        universeKey={suggestion.universe_key}
        universeName={suggestion.name}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
