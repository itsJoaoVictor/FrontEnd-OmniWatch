"use client";

/**
 * Mobile Kit da tela /explore (somente < lg).
 * Primitivas compartilhadas: Bottom Sheet de ações, Segmented Control (44px),
 * Carrossel de cards com "peek" + indicador de página, Poster Rail e cabeçalho de seção.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, EyeOff, MoreHorizontal, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { PosterImage } from "@/components/shared/PosterImage";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { useDragScroll } from "@/hooks/useDragScroll";

export interface MobileCardItem {
  id: number;
  title: string;
  mediaType: "movie" | "tv";
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  matchScore?: number;
  /** Linha de metadados curta (ex.: "2024 • 2h 10m • Ação") */
  meta?: string;
  tag?: string;
  tagHighlight?: boolean;
}

export function routeFor(item: Pick<MobileCardItem, "id" | "mediaType">): string {
  return item.mediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
}

/* ------------------------------------------------------------------ */
/* Bottom Sheet                                                        */
/* ------------------------------------------------------------------ */

interface ActionSheetProps {
  item: MobileCardItem | null;
  onClose: () => void;
  onDismiss?: (item: MobileCardItem) => void;
}

export function MobileActionSheet({ item, onClose, onDismiss }: ActionSheetProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!item) return;
    const raf = window.requestAnimationFrame(() => setShown(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(raf);
      setShown(false);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label={item.title}>
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200",
          shown ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-t-3xl bg-card border-t border-border shadow-2xl px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] transition-transform duration-250 ease-out",
          shown ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" />

        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-14 aspect-[2/3] rounded-xl overflow-hidden border border-border shrink-0 bg-zinc-900">
            <PosterImage
              src={item.poster_path}
              fallbackSrc={item.backdrop_path}
              alt={item.title}
              title={item.title}
              type={item.mediaType}
              tmdbSize="w185"
            />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-base leading-snug line-clamp-2">{item.title}</p>
            {item.meta && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.meta}</p>}
            {typeof item.matchScore === "number" && (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-primary/15 text-primary text-xs font-extrabold">
                <Zap className="w-3 h-3 fill-current" />
                {Math.round(item.matchScore)}% Match
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="min-h-12 [&>*]:w-full [&>*]:min-h-12 [&>*]:justify-center">
            <AddToListButton
              tmdb_id={item.id}
              media_type={item.mediaType}
              title={item.title}
              poster_path={item.poster_path}
              backdrop_path={item.backdrop_path}
              release_date={item.release_date}
              showLabel
              addLabel="Adicionar à minha lista"
            />
          </div>

          <Link
            href={routeFor(item)}
            prefetch={false}
            onClick={onClose}
            className="flex items-center justify-center gap-2 min-h-12 rounded-xl bg-secondary border border-border text-sm font-semibold active:scale-[0.98] transition"
          >
            Ver detalhes
            <ArrowUpRight className="w-4 h-4 opacity-70" />
          </Link>

          {onDismiss && (
            <button
              type="button"
              onClick={() => {
                onDismiss(item);
                onClose();
              }}
              className="flex items-center justify-center gap-2 min-h-12 rounded-xl text-sm font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/25 active:scale-[0.98] transition"
            >
              <EyeOff className="w-4 h-4" />
              Não tenho interesse
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cabeçalho + Segmented Control                                       */
/* ------------------------------------------------------------------ */

interface MobileSectionHeaderProps {
  emoji: string;
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
}

export function MobileSectionHeader({ emoji, title, subtitle, badge, action }: MobileSectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2 flex-wrap">
          <span aria-hidden>{emoji}</span>
          <span>{title}</span>
          {badge && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-bold">
              {badge}
            </span>
          )}
        </h2>
        {subtitle && <p className="text-[13px] text-muted-foreground mt-1 leading-snug">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function MobileIconAction({
  onClick,
  label,
  disabled,
  spinning,
  icon,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  spinning?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="shrink-0 w-11 h-11 rounded-2xl bg-primary/15 text-primary border border-primary/30 inline-flex items-center justify-center active:scale-95 transition disabled:opacity-50"
    >
      {icon ?? <Sparkles className={cn("w-5 h-5", spinning && "animate-spin")} />}
    </button>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}

export function MobileSegmented<T extends string>({ value, onChange, options, className }: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      className={cn("grid p-1 gap-1 rounded-2xl bg-secondary/80 border border-border", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-10 px-2 rounded-xl text-[13px] font-bold transition-all truncate",
              active
                ? "bg-background text-primary shadow-sm border border-primary/30"
                : "text-muted-foreground active:bg-accent/60"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Carrossel de cards (peek + dots)                                     */
/* ------------------------------------------------------------------ */

interface MobileRecoCarouselProps {
  items: MobileCardItem[];
  rankOffset?: number;
  /** Troca ao mudar de lote: volta o carrossel ao início */
  resetKey?: string | number;
  topLabel?: (index: number) => string;
  onActiveChange?: (index: number) => void;
  onDismiss?: (item: MobileCardItem) => void;
  hiddenIds?: Set<number>;
  accent?: "primary" | "emerald";
}

export function MobileRecoCarousel({
  items,
  rankOffset = 0,
  resetKey,
  topLabel,
  onActiveChange,
  onDismiss,
  hiddenIds,
}: MobileRecoCarouselProps) {
  const railRef = useDragScroll<HTMLDivElement>("x");
  const rafRef = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const [sheetItem, setSheetItem] = useState<MobileCardItem | null>(null);
  const closeSheet = useCallback(() => setSheetItem(null), []);

  useEffect(() => {
    activeRef.current = 0;
    onActiveChange?.(0);
    railRef.current?.scrollTo({ left: 0, behavior: "instant" as ScrollBehavior });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleScroll = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const rail = railRef.current;
      if (!rail) return;
      const center = rail.scrollLeft + rail.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < rail.children.length; i++) {
        const el = rail.children[i] as HTMLElement;
        const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      if (best !== activeRef.current) {
        activeRef.current = best;
        setActive(best);
        onActiveChange?.(best);
      }
    });
  }, [onActiveChange, railRef]);

  if (items.length === 0) return null;

  return (
    <div className="lg:hidden">
      <div
        ref={railRef}
        onScroll={handleScroll}
        className="relative flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 px-4 pb-1 scroll-px-4 overscroll-x-contain cursor-grab active:cursor-grabbing"
      >
        {items.map((item, idx) => {
          const rank = rankOffset + idx + 1;
          const hidden = hiddenIds?.has(item.id);
          return (
            <article
              key={`${item.mediaType}-${item.id}`}
              className={cn(
                "relative w-[82%] max-w-[380px] shrink-0 snap-center aspect-[4/5] rounded-3xl overflow-hidden isolate bg-zinc-950 border border-white/10 shadow-xl transition-all duration-300",
                hidden && "opacity-0 scale-95 pointer-events-none"
              )}
            >
              <div className="absolute inset-0 -z-20">
                <PosterImage
                  src={item.poster_path}
                  fallbackSrc={item.backdrop_path}
                  alt={item.title}
                  title={item.title}
                  type={item.mediaType}
                  tmdbSize="w780"
                  priority={idx === 0}
                />
              </div>
              <div
                className="absolute inset-0 -z-10 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(4,8,18,0.35) 0%, rgba(4,8,18,0) 22%, rgba(4,8,18,0.55) 55%, rgba(4,8,18,0.97) 100%)",
                }}
              />

              {/* Área tocável = abre detalhes */}
              <Link
                href={routeFor(item)}
                prefetch={false}
                aria-label={`Abrir ${item.title}`}
                className="absolute inset-0 z-10"
              />

              {/* Topo */}
              <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-[11px] font-extrabold text-amber-400">
                  #{rank}
                  {topLabel ? ` ${topLabel(idx)}` : ""}
                </span>
                {typeof item.matchScore === "number" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-extrabold shadow-md">
                    <Zap className="w-3 h-3 fill-current" />
                    {Math.round(item.matchScore)}%
                  </span>
                )}
              </div>

              {/* Base */}
              <div className="absolute bottom-0 inset-x-0 z-20 p-4 text-white pointer-events-none">
                {item.meta && (
                  <p className="text-[12px] text-zinc-300 font-medium mb-1 truncate">{item.meta}</p>
                )}
                <h3 className="text-2xl font-extrabold leading-tight tracking-tight line-clamp-2 drop-shadow-md">
                  {item.title}
                </h3>
                {item.tag && (
                  <span
                    className={cn(
                      "inline-block max-w-full truncate mt-2 px-2.5 py-1 rounded-lg text-[11.5px] font-semibold border backdrop-blur-md",
                      item.tagHighlight
                        ? "bg-amber-500/20 border-amber-400/40 text-amber-200"
                        : "bg-white/10 border-white/20 text-zinc-100"
                    )}
                  >
                    {item.tag}
                  </span>
                )}

                <div className="flex items-center gap-2 mt-3 pointer-events-auto">
                  <div className="flex-1 min-w-0 [&>*]:w-full [&>*]:min-h-12 [&>*]:justify-center [&>*]:rounded-2xl">
                    <AddToListButton
                      tmdb_id={item.id}
                      media_type={item.mediaType}
                      title={item.title}
                      poster_path={item.poster_path}
                      backdrop_path={item.backdrop_path}
                      release_date={item.release_date}
                      showLabel
                      addLabel="Quero Ver"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSheetItem(item)}
                    aria-label={`Mais opções para ${item.title}`}
                    className="shrink-0 w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 inline-flex items-center justify-center active:scale-95 transition"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Indicador de página / progresso contínuo */}
      {items.length <= 10 ? (
        <div className="flex items-center justify-center gap-1.5 mt-3 pointer-events-none" aria-hidden>
          {items.map((it, i) => (
            <span
              key={it.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === active ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/35"
              )}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2.5 mt-3 px-2 pointer-events-none" aria-hidden>
          <div className="w-28 h-1.5 rounded-full bg-muted-foreground/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(8, ((active + 1) / items.length) * 100))}%`,
              }}
            />
          </div>
          <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
            {Math.min(active + 1, items.length)} / {items.length}
          </span>
        </div>
      )}

      <MobileActionSheet item={sheetItem} onClose={closeSheet} onDismiss={onDismiss} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Poster Rail (trilho de pôsteres 2:3)                                 */
/* ------------------------------------------------------------------ */

interface MobilePosterRailProps {
  items: MobileCardItem[];
  onDismiss?: (item: MobileCardItem) => void;
  /** Destaca o primeiro card com largura maior */
  featureFirst?: boolean;
  hiddenIds?: Set<number>;
}

export function MobilePosterRail({ items, onDismiss, featureFirst, hiddenIds }: MobilePosterRailProps) {
  const railRef = useDragScroll<HTMLDivElement>("x");
  const [sheetItem, setSheetItem] = useState<MobileCardItem | null>(null);
  const closeSheet = useCallback(() => setSheetItem(null), []);

  if (items.length === 0) return null;

  return (
    <div className="lg:hidden">
      <div
        ref={railRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 px-4 scroll-px-4 pb-1 overscroll-x-contain cursor-grab active:cursor-grabbing"
      >
        {items.map((item, idx) => {
          const featured = featureFirst && idx === 0;
          return (
            <article
              key={`${item.mediaType}-${item.id}`}
              className={cn(
                "shrink-0 snap-start transition-all duration-300",
                featured ? "w-[58%] max-w-[260px]" : "w-[38%] max-w-[170px]",
                hiddenIds?.has(item.id) && "opacity-0 scale-95 pointer-events-none"
              )}
            >
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-border shadow-md">
                <PosterImage
                  src={item.poster_path}
                  fallbackSrc={item.backdrop_path}
                  alt={item.title}
                  title={item.title}
                  type={item.mediaType}
                  tmdbSize="w342"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
                <Link
                  href={routeFor(item)}
                  prefetch={false}
                  aria-label={`Abrir ${item.title}`}
                  className="absolute inset-0 z-10"
                />
                {typeof item.matchScore === "number" && (
                  <span className="absolute bottom-2 left-2 z-20 px-2 py-0.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-extrabold shadow pointer-events-none">
                    {Math.round(item.matchScore)}%
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setSheetItem(item)}
                  aria-label={`Mais opções para ${item.title}`}
                  className="absolute top-0 right-0 z-20 w-11 h-11 inline-flex items-center justify-center"
                >
                  <span className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white inline-flex items-center justify-center">
                    <MoreHorizontal className="w-4 h-4" />
                  </span>
                </button>
              </div>
              <div className="pt-2 px-0.5">
                <p className="text-[13px] font-bold leading-snug line-clamp-1">{item.title}</p>
                {item.meta && (
                  <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{item.meta}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <MobileActionSheet item={sheetItem} onClose={closeSheet} onDismiss={onDismiss} />
    </div>
  );
}
