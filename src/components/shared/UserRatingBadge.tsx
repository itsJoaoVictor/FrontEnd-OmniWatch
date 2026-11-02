"use client";

import { useState, useRef, useEffect } from "react";
import { Star, StarHalf, X } from "lucide-react";
import { useMyListStore } from "@/store/useMyListStore";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface UserRatingBadgeProps {
  tmdb_id: number;
  mediaType?: "movie" | "tv";
  className?: string;
}

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  0.5: { label: "Péssimo", color: "text-red-400" },
  1.0: { label: "Muito Ruim", color: "text-red-400" },
  1.5: { label: "Ruim", color: "text-orange-400" },
  2.0: { label: "Regular", color: "text-orange-400" },
  2.5: { label: "Médio", color: "text-yellow-400" },
  3.0: { label: "Bom", color: "text-yellow-400" },
  3.5: { label: "Muito Bom", color: "text-lime-400" },
  4.0: { label: "Ótimo", color: "text-lime-400" },
  4.5: { label: "Excelente", color: "text-emerald-400" },
  5.0: { label: "Obra-prima", color: "text-emerald-400" },
};

export function UserRatingBadge({ tmdb_id, mediaType = "movie", className }: UserRatingBadgeProps) {
  const { items, updateRating, addToList } = useMyListStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const savedItem = items[tmdb_id];
  const currentRating = savedItem?.rating || null;

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleRate = async (value: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (!savedItem) {
        await addToList(tmdb_id, mediaType);
      }
      await updateRating(tmdb_id, value);
      toast.add({
        title: "Nota registrada!",
        description: `Avaliado com nota ${value.toFixed(1)} ★`,
        type: "success",
      });
    } catch {
      toast.add({
        title: "Erro ao salvar nota",
        description: "Não foi possível registrar sua avaliação.",
        type: "error",
      });
    } finally {
      setIsOpen(false);
    }
  };

  const handleRemoveRating = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await updateRating(tmdb_id, 0);
      toast.add({
        title: "Nota removida",
        type: "info",
      });
    } catch {
      toast.add({
        title: "Erro ao remover nota",
        type: "error",
      });
    } finally {
      setIsOpen(false);
    }
  };

  const activeDisplayRating = hoverRating !== null ? hoverRating : currentRating;
  const ratingInfo = activeDisplayRating ? RATING_LABELS[activeDisplayRating] : null;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-sm select-none border",
          currentRating
            ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-500/50"
            : "bg-card hover:bg-accent text-muted-foreground hover:text-foreground border-border",
          className
        )}
        title={currentRating ? `Sua nota: ${currentRating.toFixed(1)} (clique para alterar)` : "Clique para dar sua nota"}
      >
        <Star className={cn("w-3.5 h-3.5", currentRating ? "fill-amber-400 text-amber-400" : "text-amber-400/80")} />
        {currentRating ? (
          <>
            <span className="font-bold text-amber-400">{currentRating.toFixed(1)}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Você</span>
          </>
        ) : (
          <span>Avaliar</span>
        )}
      </button>

      {/* Popover Interativo de Estrelas */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 z-50 w-64 p-3 bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/60">
            <span className="text-xs font-bold text-foreground">Sua Avaliação</span>
            {currentRating && (
              <button
                type="button"
                onClick={handleRemoveRating}
                className="text-[11px] text-muted-foreground hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                title="Remover nota"
              >
                <X className="w-3 h-3" />
                <span>Remover</span>
              </button>
            )}
          </div>

          {/* Fileira de 5 estrelas interativas com suporte a meias-estrelas */}
          <div
            className="flex items-center justify-center gap-1.5 py-2"
            onMouseLeave={() => setHoverRating(null)}
          >
            {[1, 2, 3, 4, 5].map((starIndex) => {
              const fullValue = starIndex;
              const halfValue = starIndex - 0.5;
              const displayVal = activeDisplayRating || 0;
              const isFull = displayVal >= fullValue;
              const isHalf = displayVal === halfValue;

              return (
                <div key={starIndex} className="relative w-7 h-7 cursor-pointer transition-transform hover:scale-115">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isHalf ? (
                      <div className="relative w-6 h-6 flex items-center justify-center">
                        <Star className="w-6 h-6 text-muted-foreground/30 absolute" />
                        <StarHalf className="w-6 h-6 text-amber-400 fill-amber-400 absolute" />
                      </div>
                    ) : (
                      <Star
                        className={cn(
                          "w-6 h-6 transition-colors",
                          isFull
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/30 hover:text-amber-400/50"
                        )}
                      />
                    )}
                  </div>

                  {/* Metade Esquerda (ex: 0.5, 1.5, ...) */}
                  <div
                    className="absolute left-0 top-0 w-1/2 h-full z-10"
                    onMouseEnter={() => setHoverRating(halfValue)}
                    onClick={(e) => handleRate(halfValue, e)}
                    title={`${halfValue} estrelas`}
                  />
                  {/* Metade Direita (ex: 1.0, 2.0, ...) */}
                  <div
                    className="absolute right-0 top-0 w-1/2 h-full z-10"
                    onMouseEnter={() => setHoverRating(fullValue)}
                    onClick={(e) => handleRate(fullValue, e)}
                    title={`${fullValue} estrelas`}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-1 text-center">
            {ratingInfo ? (
              <p className={cn("text-xs font-bold", ratingInfo.color)}>
                {activeDisplayRating?.toFixed(1)} ★ — {ratingInfo.label}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">Clique para escolher uma nota</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
