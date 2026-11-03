"use client";

import { memo, useMemo, useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  Flame,
  LayoutGrid,
  Radar,
  Sparkles,
  Tv,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PosterImage } from "@/components/shared/PosterImage";
import { parseReleaseDate } from "@/lib/dateUtils";
import { useMyListStore } from "@/store/useMyListStore";
import { MediaItem } from "./MediaCard";
import { ContentCarousel } from "./ContentCarousel";

interface ReleaseRadarTimelineProps {
  items: MediaItem[];
  title?: string;
  subtitle?: string;
  actionHref?: string;
  actionText?: string;
}

type UrgencyTier = "released" | "today" | "imminent" | "soon" | "scheduled" | "tba";

interface EnrichedUpcomingItem extends MediaItem {
  tmdbId: number;
  hasDate: boolean;
  releaseTimestamp: number;
  daysUntil: number | null;
  formattedDate: string; // ex: "21 NOV 2026"
  urgencyTier: UrgencyTier;
  urgencyLabel: string;
}

const PT_MONTHS_SHORT = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

function formatRadarDatePtBr(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = PT_MONTHS_SHORT[date.getMonth()] || "";
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export const ReleaseRadarTimeline = memo(function ReleaseRadarTimeline({
  items,
  title = "Aguardando Estreia",
  subtitle = "Linha do tempo por ordem de chegada • Contagem regressiva dinâmica",
  actionHref = "/calendar",
  actionText = "Ver calendário",
}: ReleaseRadarTimelineProps) {
  const updateStatus = useMyListStore((state) => state.updateStatus);
  const storeItems = useMyListStore((state) => state.items);

  const [viewMode, setViewMode] = useState<"radar" | "carousel">("radar");
  const [activeFilter, setActiveFilter] = useState<"all" | "soon" | "tba">("all");
  const [movingIds, setMovingIds] = useState<Record<number, boolean>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);

  const { datedItems, tbaItems, soonCount, allSortedForCarousel } = useMemo(() => {
    const now = new Date();
    const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

    const dated: EnrichedUpcomingItem[] = [];
    const tba: EnrichedUpcomingItem[] = [];

    for (const item of items) {
      const tmdbId = parseInt(item.id, 10);
      const saved = !isNaN(tmdbId) ? storeItems[tmdbId] : undefined;
      // Caso o usuário tenha acabado de mover o status para 'plan_to_watch', oculta imediatamente
      if (saved && saved.status !== "upcoming") {
        continue;
      }

      const rawDate = (saved?.release_date ?? item.release_date)?.trim() || "";
      const hasValidDate = rawDate.length >= 8 && !isNaN(parseReleaseDate(rawDate).getTime());

      if (!hasValidDate) {
        tba.push({
          ...item,
          tmdbId,
          hasDate: false,
          releaseTimestamp: Number.MAX_SAFE_INTEGER,
          daysUntil: null,
          formattedDate: "Sem Data / TBA",
          urgencyTier: "tba",
          urgencyLabel: "Sem Data / TBA",
        });
        continue;
      }

      const parsedDate = parseReleaseDate(rawDate);
      const diffMs = parsedDate.getTime() - todayNoon.getTime();
      const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const formattedDate = formatRadarDatePtBr(parsedDate);

      let urgencyTier: UrgencyTier = "scheduled";
      let urgencyLabel = formattedDate;

      if (daysUntil < 0) {
        urgencyTier = "released";
        urgencyLabel = "🎬 Já estreou!";
      } else if (daysUntil === 0) {
        urgencyTier = "today";
        urgencyLabel = "🔥 Estreia Hoje!";
      } else if (daysUntil === 1) {
        urgencyTier = "imminent";
        urgencyLabel = "🔥 Estreia Amanhã!";
      } else if (daysUntil <= 14) {
        urgencyTier = "imminent";
        urgencyLabel = `🔥 Faltam ${daysUntil} dias`;
      } else if (daysUntil <= 45) {
        urgencyTier = "soon";
        urgencyLabel = `🔥 Faltam ${daysUntil} dias`;
      } else {
        urgencyTier = "scheduled";
        urgencyLabel = `Faltam ${daysUntil} dias`;
      }

      dated.push({
        ...item,
        tmdbId,
        hasDate: true,
        releaseTimestamp: parsedDate.getTime(),
        daysUntil,
        formattedDate,
        urgencyTier,
        urgencyLabel,
      });
    }

    // Ordem estritamente cronológica de chegada
    dated.sort((a, b) => a.releaseTimestamp - b.releaseTimestamp);

    // Títulos TBA ordenados alfabeticamente para estabilidade visual
    tba.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

    const soon = dated.filter(
      (i) => i.daysUntil !== null && i.daysUntil <= 30
    ).length;

    return {
      datedItems: dated,
      tbaItems: tba,
      soonCount: soon,
      allSortedForCarousel: [...dated, ...tba],
    };
  }, [items, storeItems]);

  const totalCount = datedItems.length + tbaItems.length;

  // Se o filtro ativo ficar vazio após uma ação, volta para "all"
  useEffect(() => {
    if (activeFilter === "soon" && soonCount === 0) {
      setActiveFilter("all");
    } else if (activeFilter === "tba" && tbaItems.length === 0) {
      setActiveFilter("all");
    }
  }, [activeFilter, soonCount, tbaItems.length]);

  const updateScrollButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 12);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 12);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = trackRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons, datedItems.length, tbaItems.length, activeFilter, viewMode]);

  const scrollTrack = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.78, 320);
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  const handleMoveToQueue = async (e: React.MouseEvent, item: EnrichedUpcomingItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (isNaN(item.tmdbId) || movingIds[item.tmdbId]) return;

    setMovingIds((prev) => ({ ...prev, [item.tmdbId]: true }));
    try {
      await updateStatus(item.tmdbId, "plan_to_watch");
    } finally {
      setMovingIds((prev) => ({ ...prev, [item.tmdbId]: false }));
    }
  };

  if (totalCount === 0) {
    return null;
  }

  const visibleDated =
    activeFilter === "tba"
      ? []
      : activeFilter === "soon"
        ? datedItems.filter((i) => i.daysUntil !== null && i.daysUntil <= 30)
        : datedItems;

  const showTbaGroupInTrack = activeFilter === "all" && tbaItems.length > 0;
  const showExpandedTbaCards = activeFilter === "tba" || (datedItems.length === 0 && tbaItems.length > 0);

  return (
    <section className="w-full relative py-2 space-y-4 group/radar">
      {/* Cabeçalho da Seção */}
      <div className="px-4 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <span>{title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold">
                {totalCount}
              </span>
            </h2>

            {/* Alternador Radar vs Carrossel */}
            <div className="hidden sm:flex items-center bg-secondary/50 p-0.5 rounded-lg border border-border/80 text-[11px] font-semibold ml-1">
              <button
                type="button"
                onClick={() => setViewMode("radar")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                  viewMode === "radar"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Modo Release Radar Cronológico"
              >
                <Radar className="w-3 h-3 text-sky-400" />
                <span>Radar</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("carousel")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                  viewMode === "carousel"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Modo Carrossel de Pôsteres"
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Carrossel</span>
              </button>
            </div>
          </div>

          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        {/* Filtros Rápidos + Link para o Calendário */}
        <div className="flex items-center gap-3">
          {viewMode === "radar" && (soonCount > 0 || (datedItems.length > 0 && tbaItems.length > 0)) && (
            <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-xl border border-border/70 text-xs font-semibold overflow-x-auto hide-scrollbar">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap",
                  activeFilter === "all"
                    ? "bg-sky-500 text-zinc-950 shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Todas ({totalCount})
              </button>

              {soonCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter("soon")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                    activeFilter === "soon"
                      ? "bg-amber-500 text-zinc-950 shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Próximos 30d ({soonCount})</span>
                </button>
              )}

              {datedItems.length > 0 && tbaItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter("tba")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                    activeFilter === "tba"
                      ? "bg-zinc-700 text-white shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Sem Data / TBA ({tbaItems.length})</span>
                </button>
              )}
            </div>
          )}

          {actionHref && (
            <Link
              href={actionHref}
              prefetch={false}
              className="hidden md:flex text-xs font-semibold text-primary hover:text-primary/80 items-center gap-1 transition-colors shrink-0"
            >
              <span>{actionText}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Corpo: Modo Carrossel Alternativo vs Release Radar Cronológico */}
      {viewMode === "carousel" ? (
        <ContentCarousel title="" items={allSortedForCarousel} layout="poster" />
      ) : (
        <div className="relative px-4 lg:px-8">
          {/* Botões de Navegação Horizontal da Trilha (Desktop) */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollTrack("left")}
              aria-label="Rolar linha do tempo para a esquerda"
              className="hidden md:flex items-center justify-center absolute left-2 lg:left-4 top-[54%] -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-background/95 hover:bg-background text-foreground border border-border shadow-2xl backdrop-blur-md transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollTrack("right")}
              aria-label="Rolar linha do tempo para a direita"
              className="hidden md:flex items-center justify-center absolute right-2 lg:right-4 top-[54%] -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-background/95 hover:bg-background text-foreground border border-border shadow-2xl backdrop-blur-md transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Trilha Horizontal Conectada */}
          <div
            ref={trackRef}
            className="flex items-stretch overflow-x-auto hide-scrollbar scroll-smooth pb-2 pt-1"
          >
            {/* 1) NÓS CRONOLÓGICOS COM DATA CONFIRMADA */}
            {visibleDated.map((item, idx) => {
              const isFirst = idx === 0;
              const isLastOverall =
                idx === visibleDated.length - 1 && !showTbaGroupInTrack && !showExpandedTbaCards;

              const isUrgent =
                item.urgencyTier === "today" || item.urgencyTier === "imminent";
              const isReleased = item.urgencyTier === "released";
              const isSoon = item.urgencyTier === "soon";

              const detailHref = `/${item.type === "movie" ? "movie" : "tv"}/${item.id}`;

              return (
                <div
                  key={item.id}
                  className="shrink-0 w-[265px] sm:w-[285px] pr-4 last:pr-0 flex flex-col"
                >
                  {/* Segmento da Linha do Tempo Conectada + Badge de Urgência */}
                  <div className="relative flex items-center h-9 mb-2.5">
                    {/* Linha horizontal contínua conectando ao próximo card */}
                    {!isLastOverall && (
                      <div
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-[2px] z-0",
                          isFirst ? "left-2 -right-4" : "left-0 -right-4",
                          isReleased
                            ? "bg-gradient-to-r from-emerald-400/70 to-sky-400/60"
                            : isUrgent
                              ? "bg-gradient-to-r from-sky-400/80 to-indigo-500/60"
                              : isSoon
                                ? "bg-gradient-to-r from-indigo-500/50 to-border"
                                : "bg-border/90"
                        )}
                      />
                    )}
                    {isLastOverall && !isFirst && (
                      <div className="absolute left-0 w-3 top-1/2 -translate-y-1/2 h-[2px] bg-border/90 z-0" />
                    )}

                    {/* Nó Luminoso + Pill Dinâmico */}
                    <div className="relative z-10 flex items-center gap-2 bg-background pr-2.5 rounded-full">
                      <span
                        className={cn(
                          "w-3 h-3 rounded-full shrink-0 transition-all",
                          isReleased && "bg-emerald-400 ring-4 ring-emerald-400/20",
                          isUrgent && "bg-sky-400 ring-4 ring-sky-400/25 animate-pulse",
                          isSoon && "bg-indigo-400 ring-4 ring-indigo-400/15",
                          item.urgencyTier === "scheduled" && "bg-muted-foreground/70 ring-2 ring-border"
                        )}
                      />
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-tight border whitespace-nowrap",
                          isReleased &&
                            "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
                          isUrgent &&
                            "bg-sky-500/20 text-sky-300 border-sky-400/40 shadow-xs shadow-sky-500/10",
                          isSoon &&
                            "bg-indigo-500/15 text-indigo-300 border-indigo-500/35",
                          item.urgencyTier === "scheduled" &&
                            "bg-secondary/80 text-muted-foreground border-border"
                        )}
                      >
                        {item.urgencyLabel}
                      </span>
                    </div>
                  </div>

                  {/* Card Cinematográfico da Estreia */}
                  <Link
                    href={detailHref}
                    prefetch={false}
                    className={cn(
                      "group/card relative flex flex-col justify-between flex-1 rounded-2xl p-3 bg-card/85 hover:bg-card border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl",
                      isReleased
                        ? "border-emerald-500/40 hover:border-emerald-400/70 hover:shadow-emerald-500/10"
                        : isUrgent
                          ? "border-sky-500/45 hover:border-sky-400/80 hover:shadow-sky-500/10"
                          : "border-border/80 hover:border-primary/45"
                    )}
                  >
                    <div>
                      {/* Arte 16:9 com Data Formatada */}
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted mb-2.5">
                        <PosterImage
                          src={item.coverHorizontal || item.coverVertical}
                          fallbackSrc={item.coverVertical}
                          alt={item.title}
                          title={item.title}
                          type={item.type}
                          fill
                          priority={idx < 3}
                          sizes="(max-width: 640px) 265px, 285px"
                          className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                        {/* Selo Tipo de Mídia no Topo Direito */}
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-zinc-200 flex items-center gap-1">
                          {item.type === "movie" ? (
                            <>
                              <Film className="w-2.5 h-2.5 text-amber-400" />
                              <span>Filme</span>
                            </>
                          ) : (
                            <>
                              <Tv className="w-2.5 h-2.5 text-sky-400" />
                              <span>Série</span>
                            </>
                          )}
                        </span>

                        {/* Data Formatada (ex: 21 NOV 2026) no Canto Inferior da Arte */}
                        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-[11px] font-extrabold tracking-wide text-white shadow-sm">
                            <Calendar className="w-3 h-3 text-sky-400 shrink-0" />
                            <span>{item.formattedDate}</span>
                          </span>
                        </div>
                      </div>

                      {/* Título */}
                      <h3 className="text-sm font-bold text-foreground group-hover/card:text-primary transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                    </div>

                    {/* Rodapé Contextual ou Ação Rápida para itens que já estrearam */}
                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                      {isReleased || item.urgencyTier === "today" ? (
                        <button
                          type="button"
                          onClick={(e) => handleMoveToQueue(e, item)}
                          disabled={movingIds[item.tmdbId]}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {movingIds[item.tmdbId] ? "Movendo..." : "Mover para Minha Fila"}
                          </span>
                        </button>
                      ) : (
                        <>
                          <span className="text-[11px] text-muted-foreground font-medium truncate">
                            {isUrgent
                              ? "Estreia muito próxima"
                              : isSoon
                                ? "Confirmado para breve"
                                : "Lançamento agendado"}
                          </span>
                          <span className="text-[11px] font-semibold text-sky-400/90 group-hover/card:text-sky-300 flex items-center gap-0.5 shrink-0">
                            <span>Detalhes</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}

            {/* 2) AGRUPAMENTO LIMPO NO FINAL PARA TÍTULOS SEM DATA / TBA */}
            {showTbaGroupInTrack && (
              <div className="shrink-0 w-[310px] sm:w-[350px] flex flex-col">
                {/* Conector pontilhado indicando transição para Sem Data / TBA */}
                <div className="relative flex items-center h-9 mb-2.5">
                  <div className="absolute left-0 right-6 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-border z-0" />
                  <div className="relative z-10 flex items-center gap-2 bg-background pr-3 rounded-full">
                    <span className="w-3 h-3 rounded-full bg-zinc-600 ring-2 ring-border shrink-0" />
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary/90 text-muted-foreground border border-dashed border-border text-[11px] font-extrabold whitespace-nowrap">
                      Sem Data / TBA • {tbaItems.length}
                    </span>
                  </div>
                </div>

                {/* Bloco Agrupado Limpo com Lista Compacta Clicável */}
                <div className="flex-1 rounded-2xl p-3.5 bg-card/50 border border-dashed border-border/90 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Aguardando anúncio oficial</span>
                      </p>
                      {tbaItems.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setActiveFilter("tba")}
                          className="text-[11px] font-bold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                        >
                          Expandir ({tbaItems.length})
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {tbaItems.slice(0, 3).map((tbaItem) => {
                        const href = `/${tbaItem.type === "movie" ? "movie" : "tv"}/${tbaItem.id}`;
                        return (
                          <Link
                            key={tbaItem.id}
                            href={href}
                            prefetch={false}
                            className="group/tba flex items-center justify-between gap-2.5 p-1.5 rounded-xl bg-secondary/45 hover:bg-secondary/85 border border-border/50 hover:border-border transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative w-12 h-8 rounded-lg overflow-hidden bg-muted shrink-0">
                                <PosterImage
                                  src={tbaItem.coverHorizontal || tbaItem.coverVertical}
                                  fallbackSrc={tbaItem.coverVertical}
                                  alt={tbaItem.title}
                                  title={tbaItem.title}
                                  type={tbaItem.type}
                                  fill
                                  sizes="64px"
                                  showTitleInFallback={false}
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground group-hover/tba:text-primary truncate transition-colors">
                                  {tbaItem.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {tbaItem.type === "movie" ? "Filme" : "Série"} • TBA
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover/tba:text-foreground shrink-0 mr-1" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {tbaItems.length > 3 ? (
                    <button
                      type="button"
                      onClick={() => setActiveFilter("tba")}
                      className="w-full py-1.5 rounded-xl bg-secondary/60 hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      + {tbaItems.length - 3} {tbaItems.length - 3 === 1 ? "outro título" : "outros títulos"} sem data
                    </button>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/80 text-center">
                      Entrarão na linha do tempo assim que ganharem data
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 3) MODO EXPANDIDO DE TÍTULOS SEM DATA / TBA (Quando filtrado ou quando só há TBA) */}
            {showExpandedTbaCards &&
              tbaItems.map((item, idx) => {
                const isLast = idx === tbaItems.length - 1;
                const detailHref = `/${item.type === "movie" ? "movie" : "tv"}/${item.id}`;
                return (
                  <div
                    key={item.id}
                    className="shrink-0 w-[250px] sm:w-[270px] pr-4 last:pr-0 flex flex-col"
                  >
                    <div className="relative flex items-center h-9 mb-2.5">
                      {!isLast && (
                        <div className="absolute left-0 -right-4 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-border z-0" />
                      )}
                      <div className="relative z-10 flex items-center gap-2 bg-background pr-2.5 rounded-full">
                        <span className="w-3 h-3 rounded-full bg-zinc-600 ring-2 ring-border shrink-0" />
                        <span className="px-2.5 py-0.5 rounded-full bg-secondary/90 text-muted-foreground border border-dashed border-border text-[11px] font-bold">
                          Sem Data / TBA
                        </span>
                      </div>
                    </div>

                    <Link
                      href={detailHref}
                      prefetch={false}
                      className="group/card flex flex-col justify-between flex-1 rounded-2xl p-3 bg-card/65 hover:bg-card border border-dashed border-border/90 hover:border-primary/40 transition-all duration-300"
                    >
                      <div>
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted mb-2.5">
                          <PosterImage
                            src={item.coverHorizontal || item.coverVertical}
                            fallbackSrc={item.coverVertical}
                            alt={item.title}
                            title={item.title}
                            type={item.type}
                            fill
                            sizes="270px"
                            className="object-cover opacity-90 group-hover/card:opacity-100 transition-all duration-500 group-hover/card:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                          <span className="absolute bottom-2 left-2.5 px-2.5 py-0.5 rounded-md bg-black/75 border border-white/10 text-[10px] font-bold text-zinc-300">
                            SEM DATA OFICIAL (TBA)
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-foreground group-hover/card:text-primary transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                      </div>

                      <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{item.type === "movie" ? "Filme" : "Série"}</span>
                        <span className="font-semibold text-foreground/80 flex items-center gap-0.5">
                          <span>Ver página</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  </div>
                );
              })}
          </div>

          {/* Link Mobile para o Calendário */}
          {actionHref && (
            <div className="mt-2 flex md:hidden justify-end">
              <Link
                href={actionHref}
                prefetch={false}
                className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <span>{actionText}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
});
