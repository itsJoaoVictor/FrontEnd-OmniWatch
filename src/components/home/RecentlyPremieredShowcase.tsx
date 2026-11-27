"use client";

import { memo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Film,
  Tv,
  Play,
  CheckCircle2,
  X,
  ArrowUpRight,
  CalendarCheck2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PosterImage } from "@/components/shared/PosterImage";
import { formatReleaseDate } from "@/lib/dateUtils";
import { useMyListStore } from "@/store/useMyListStore";
import { MediaItem } from "./MediaCard";

export interface RecentlyPremieredItem extends MediaItem {
  daysSinceRelease: number;
  dismissKey: string;
}

interface RecentlyPremieredShowcaseProps {
  items: RecentlyPremieredItem[];
  onDismiss: (dismissKey: string) => void;
  windowDays?: number;
}

function getPremiereBadgeLabel(daysSinceRelease: number): string {
  if (daysSinceRelease <= 0) return "Estreou hoje!";
  if (daysSinceRelease === 1) return "Estreou ontem";
  return `Estreou há ${daysSinceRelease} dias`;
}

export const RecentlyPremieredShowcase = memo(function RecentlyPremieredShowcase({
  items,
  onDismiss,
  windowDays = 4,
}: RecentlyPremieredShowcaseProps) {
  const updateStatus = useMyListStore((state) => state.updateStatus);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});

  if (!items || items.length === 0) return null;

  const handlePrimaryAction = async (
    e: React.MouseEvent,
    item: RecentlyPremieredItem
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const tmdbId = parseInt(item.id, 10);
    if (isNaN(tmdbId) || busyIds[item.id]) return;

    setBusyIds((prev) => ({ ...prev, [item.id]: true }));
    try {
      if (item.type === "tv") {
        await updateStatus(tmdbId, "watching");
      } else {
        await updateStatus(tmdbId, "completed");
      }
    } finally {
      setBusyIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  return (
    <section className="max-w-7xl mx-auto w-full px-4 lg:px-8">
      <div className="relative rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.08] via-card/85 to-background p-4 sm:p-6 shadow-lg overflow-hidden">
        {/* Glow decorativo sutil */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
        />

        {/* Header */}
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Acabaram de Estrear
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {items.length}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Títulos que estavam em Aguardando Estreia já estão disponíveis • Em destaque por {windowDays} dias
            </p>
          </div>

          <Link
            href="/calendar"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors self-start sm:self-auto"
          >
            Ver calendário
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Cards Grid / Horizontal scroll on mobile */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const href = `/${item.type === "movie" ? "movie" : "tv"}/${item.id}`;
            const isToday = item.daysSinceRelease <= 0;
            const isBusy = Boolean(busyIds[item.id]);
            const hasBackdrop = Boolean(item.coverHorizontal && item.coverHorizontal.trim() !== "");

            return (
              <div
                key={item.id}
                className={cn(
                  "group relative rounded-xl border bg-card/90 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl",
                  isToday
                    ? "border-emerald-400/45 shadow-emerald-500/10 shadow-md"
                    : "border-border/70 hover:border-emerald-500/35"
                )}
              >
                {/* Botão discreto para dispensar o destaque */}
                <button
                  type="button"
                  onClick={() => onDismiss(item.dismissKey)}
                  title="Dispensar destaque (continua na sua fila)"
                  aria-label={`Dispensar destaque de ${item.title}`}
                  className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Backdrop 16:9 */}
                <Link href={href} className="block relative aspect-[16/9] w-full overflow-hidden bg-secondary/40">
                  {hasBackdrop ? (
                    <Image
                      src={item.coverHorizontal!}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105 brightness-90"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-emerald-950/50 via-secondary to-background" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/45 to-transparent" />

                  {/* Badge de estreia */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border",
                        isToday
                          ? "bg-emerald-500/90 text-emerald-950 border-emerald-300/60 shadow-sm"
                          : "bg-black/65 text-emerald-300 border-emerald-400/35"
                      )}
                    >
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping" />
                      )}
                      {getPremiereBadgeLabel(item.daysSinceRelease)}
                    </span>
                  </div>
                </Link>

                {/* Conteúdo + Pôster sobreposto */}
                <div className="relative px-3.5 pb-3.5 -mt-10 z-10">
                  <div className="flex items-end gap-3">
                    <Link
                      href={href}
                      className="relative w-14 aspect-[2/3] rounded-lg overflow-hidden border border-border/80 shadow-md shrink-0 bg-secondary"
                    >
                      <PosterImage
                        src={item.coverVertical || ""}
                        alt={item.title}
                        title={item.title}
                        type={item.type}
                        fill
                        tmdbSize="w185"
                        sizes="56px"
                        className="object-cover"
                      />
                    </Link>

                    <div className="min-w-0 flex-1 pb-0.5">
                      <Link href={href} className="block">
                        <h3 className="text-sm sm:text-base font-bold text-foreground truncate group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 font-medium">
                          {item.type === "movie" ? (
                            <>
                              <Film className="w-3 h-3" /> Filme
                            </>
                          ) : (
                            <>
                              <Tv className="w-3 h-3" /> Série
                            </>
                          )}
                        </span>
                        {item.release_date && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarCheck2 className="w-3 h-3 text-emerald-400" />
                              {formatReleaseDate(item.release_date)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações rápidas */}
                  <div className="flex items-center gap-2 mt-3.5">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={(e) => handlePrimaryAction(e, item)}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        "bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-sm disabled:opacity-60"
                      )}
                    >
                      {item.type === "tv" ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          {isBusy ? "Movendo..." : "Começar a assistir"}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isBusy ? "Salvando..." : "Marcar como visto"}
                        </>
                      )}
                    </button>

                    <Link
                      href={href}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold bg-secondary/80 hover:bg-secondary text-foreground border border-border/60 transition-colors"
                    >
                      Detalhes
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});
