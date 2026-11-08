"use client";

import { memo, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Bell,
  Sparkles,
  ArrowRightLeft,
  EyeOff,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RecommendationItem } from "@/types/recommendation";
import { PosterImage } from "@/components/shared/PosterImage";
import { parseReleaseDate } from "@/lib/dateUtils";
import { useMyListStore } from "@/store/useMyListStore";
import { useExploreStore } from "@/store/useExploreStore";
import { useDragScroll } from "@/hooks/useDragScroll";
import { api } from "@/lib/axios";
import { toast } from "@/components/ui/toast";
import {
  MobileActionSheet,
  MobileSectionHeader,
  MobileSegmented,
  routeFor,
  type MobileCardItem,
} from "./mobile/mobile-kit";

interface UpcomingTimelineRadarProps {
  movies: RecommendationItem[];
  series: RecommendationItem[];
}

interface EnrichedRadarItem extends RecommendationItem {
  parsedDate: Date;
  releaseTimestamp: number;
  daysUntil: number;
  formattedDate: string;
  day: string;
  month: string;
  year: number;
  imminent: boolean;
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

function isHighlightedTag(tag: string): boolean {
  return (
    tag.startsWith("❤️") ||
    tag.startsWith("🎬") ||
    tag.startsWith("🌟") ||
    tag.startsWith("🍿") ||
    tag.startsWith("🔄")
  );
}

function enrichItems(
  items: RecommendationItem[],
  fallbackType: "movie" | "tv",
  todayNoon: Date
): EnrichedRadarItem[] {
  return items
    .map((item) => {
      const rawDate = (item.release_date || item.first_air_date || "").trim();
      const parsedDate = parseReleaseDate(rawDate);
      const releaseTimestamp = parsedDate.getTime();
      const diffMs = releaseTimestamp - todayNoon.getTime();
      const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

      const day = String(parsedDate.getDate()).padStart(2, "0");
      const month = PT_MONTHS_SHORT[parsedDate.getMonth()] || "";
      const year = parsedDate.getFullYear();
      const formattedDate = `${day} ${month} ${year}`;

      const imminent = daysUntil >= 0 && daysUntil <= 14;

      let urgencyLabel = formattedDate;
      if (daysUntil < 0) {
        urgencyLabel = "🎬 Já estreou!";
      } else if (daysUntil === 0) {
        urgencyLabel = "🔥 Estreia Hoje!";
      } else if (daysUntil === 1) {
        urgencyLabel = "🔥 Estreia Amanhã!";
      } else if (daysUntil <= 14) {
        urgencyLabel = `🔥 Faltam ${daysUntil} dias`;
      } else if (daysUntil <= 45) {
        urgencyLabel = `⚡ Faltam ${daysUntil} dias`;
      } else if (daysUntil <= 90) {
        urgencyLabel = `Faltam ${daysUntil} dias`;
      } else {
        const months = Math.round(daysUntil / 30);
        urgencyLabel = months > 1 ? `Em ~${months} meses` : formattedDate;
      }

      const media_type = (item.media_type || fallbackType) as "movie" | "tv";

      return {
        ...item,
        media_type,
        parsedDate,
        releaseTimestamp,
        daysUntil,
        formattedDate,
        day,
        month,
        year,
        imminent,
        urgencyLabel,
      };
    })
    .sort((a, b) => a.releaseTimestamp - b.releaseTimestamp);
}

const PT_MONTHS_LONG = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function groupLabel(item: EnrichedRadarItem): string {
  if (item.daysUntil < 0) return "Já estreou";
  if (item.daysUntil <= 7) return "Esta semana";
  if (item.daysUntil <= 30) return "Próximos 30 dias";
  return `${PT_MONTHS_LONG[item.parsedDate.getMonth()]} ${item.year}`;
}

interface MobileAgendaProps {
  all: EnrichedRadarItem[];
  movies: EnrichedRadarItem[];
  series: EnrichedRadarItem[];
  myListItems: Record<number, unknown>;
  onToggleRadar: (item: EnrichedRadarItem, e: React.MouseEvent) => void;
  onDismiss: (item: EnrichedRadarItem, e: React.MouseEvent) => void;
}

const fakeEvent = { preventDefault() {}, stopPropagation() {} } as React.MouseEvent;

/** Agenda mobile (< lg): lista vertical contínua agrupada por período, ações de 44px e bottom sheet. */
function MobileAgenda({ all, movies, series, myListItems, onToggleRadar, onDismiss }: MobileAgendaProps) {
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all");
  const [sheetItem, setSheetItem] = useState<MobileCardItem | null>(null);
  const closeSheet = useCallback(() => setSheetItem(null), []);

  const list = filter === "movie" ? movies : filter === "tv" ? series : all;

  const groups = useMemo(() => {
    const out: { label: string; items: EnrichedRadarItem[] }[] = [];
    for (const it of list) {
      const label = groupLabel(it);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(it);
      else out.push({ label, items: [it] });
    }
    return out;
  }, [list]);

  const toCard = (it: EnrichedRadarItem): MobileCardItem => ({
    id: it.id,
    title: it.title || it.name || "Sem título",
    mediaType: it.media_type === "movie" ? "movie" : "tv",
    poster_path: it.poster_path,
    backdrop_path: it.backdrop_path,
    release_date: it.release_date || it.first_air_date,
    matchScore: it.match_score,
    meta: `${it.media_type === "movie" ? "Filme" : "Série"} • ${it.formattedDate}`,
  });

  return (
    <section className="lg:hidden mb-10">
      <MobileSectionHeader
        emoji="🗓️"
        title="Próximas Estreias"
        badge={String(all.length)}
        subtitle="Filmes e séries que chegam em breve, na ordem de estreia."
      />

      <MobileSegmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: `Todos ${all.length}` },
          { value: "movie", label: `Filmes ${movies.length}` },
          { value: "tv", label: `Séries ${series.length}` },
        ]}
        className="mb-4"
      />

      {list.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border">
          Nenhum lançamento nesta categoria.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <div key={g.label}>
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2 px-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                {g.label}
              </h3>
              <ul className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/70">
                {g.items.map((it) => {
                  const card = toCard(it);
                  const saved = Boolean(myListItems[it.id]);
                  return (
                    <li key={`${it.media_type}-${it.id}`} className="flex items-stretch gap-3 p-3">
                      <Link
                        href={routeFor(card)}
                        prefetch={false}
                        className="relative w-16 aspect-[2/3] rounded-xl overflow-hidden border border-border bg-zinc-900 shrink-0"
                      >
                        <PosterImage
                          src={it.poster_path}
                          fallbackSrc={it.backdrop_path}
                          alt={card.title}
                          title={card.title}
                          type={card.mediaType}
                          tmdbSize="w185"
                        />
                        <span
                          className={cn(
                            "absolute inset-x-0 bottom-0 py-1 text-center leading-none backdrop-blur-sm",
                            it.imminent ? "bg-sky-500/90 text-white" : "bg-black/75 text-white"
                          )}
                        >
                          <span className="block text-[15px] font-black">{it.day}</span>
                          <span className="block text-[9px] font-bold tracking-wider">{it.month}</span>
                        </span>
                      </Link>

                      <Link href={routeFor(card)} prefetch={false} className="flex-1 min-w-0 py-0.5 flex flex-col justify-center">
                        <span className="text-[11px] font-semibold text-sky-400 mb-0.5 truncate">
                          {it.urgencyLabel}
                        </span>
                        <h4 className="text-[15px] font-extrabold leading-snug line-clamp-2">{card.title}</h4>
                        <span className="text-[11.5px] text-muted-foreground mt-1 truncate">
                          {card.mediaType === "movie" ? "Filme" : "Série"}
                          {typeof it.match_score === "number" && ` • ${Math.round(it.match_score)}% match`}
                        </span>
                      </Link>

                      <div className="flex flex-col justify-between shrink-0">
                        <button
                          type="button"
                          onClick={(e) => onToggleRadar(it, e)}
                          aria-label={saved ? "Remover do Radar" : "Aguardar estreia"}
                          aria-pressed={saved}
                          className={cn(
                            "w-11 h-11 rounded-xl inline-flex items-center justify-center border transition active:scale-95",
                            saved
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                              : "bg-primary/10 border-primary/35 text-primary"
                          )}
                        >
                          {saved ? <Check className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSheetItem(card)}
                          aria-label={`Mais opções para ${card.title}`}
                          className="w-11 h-11 rounded-xl inline-flex items-center justify-center text-muted-foreground active:bg-accent/60"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <MobileActionSheet
        item={sheetItem}
        onClose={closeSheet}
        onDismiss={(mi) => {
          const src = list.find((x) => x.id === mi.id);
          if (src) onDismiss(src, fakeEvent);
        }}
      />
    </section>
  );
}

function RadarHorizontalContainer({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const ref = useDragScroll<HTMLDivElement>("x");
  return (
    <div
      id={id}
      ref={ref}
      className="flex items-stretch overflow-x-auto scroll-smooth snap-x snap-mandatory pt-2 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  );
}

export const UpcomingTimelineRadar = memo(function UpcomingTimelineRadar({
  movies,
  series,
}: UpcomingTimelineRadarProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "movie" | "tv">("all");
  const [radarDualMode, setRadarDualMode] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  const { items: myListItems, addToList, removeFromList } = useMyListStore();

  const now = useMemo(() => new Date(), []);
  const todayNoon = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0),
    [now]
  );

  const enrichedMovies = useMemo(() => {
    return enrichItems(movies, "movie", todayNoon).filter(
      (i) => !dismissedIds.has(i.id)
    );
  }, [movies, todayNoon, dismissedIds]);

  const enrichedSeries = useMemo(() => {
    return enrichItems(series, "tv", todayNoon).filter(
      (i) => !dismissedIds.has(i.id)
    );
  }, [series, todayNoon, dismissedIds]);

  const enrichedAll = useMemo(() => {
    return [...enrichedMovies, ...enrichedSeries].sort(
      (a, b) => a.releaseTimestamp - b.releaseTimestamp
    );
  }, [enrichedMovies, enrichedSeries]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "movie") return enrichedMovies;
    if (activeFilter === "tv") return enrichedSeries;
    return enrichedAll;
  }, [activeFilter, enrichedMovies, enrichedSeries, enrichedAll]);

  const handleToggleRadar = useCallback(
    async (item: EnrichedRadarItem, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const numericId = Number(item.id);
      const saved = myListItems[numericId];
      const displayTitle = item.title || item.name || "Título";
      const mediaType = (item.media_type === "movie" ? "movie" : "tv") as "movie" | "tv";

      if (saved) {
        await removeFromList(numericId);
        toast.add({
          title: "Removido do Radar",
          description: `"${displayTitle}" foi retirado da sua lista de estreias.`,
          type: "info",
        });
      } else {
        await addToList(numericId, mediaType, {
          title: displayTitle,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: item.release_date || item.first_air_date,
          status: "upcoming",
        });
        toast.add({
          title: "Adicionado ao Radar!",
          description: `"${displayTitle}" está agora no seu "Aguardando Estreia" do Dashboard.`,
          type: "success",
        });
      }
    },
    [myListItems, addToList, removeFromList]
  );

  const handleDismiss = useCallback(
    async (item: EnrichedRadarItem, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const numericId = Number(item.id);
      const displayTitle = item.title || item.name || "Título";
      setDismissedIds((prev) => new Set(prev).add(numericId));

      try {
        await api.post("/api/recommendations/dismiss", {
          tmdb_id: numericId,
          media_type: item.media_type,
          title: displayTitle,
          poster_path: item.poster_path,
          days_snooze: 180,
        });

        toast.add({
          title: "Lançamento dispensado",
          description: `"${displayTitle}" foi ocultado das suas recomendações por 6 meses.`,
          type: "info",
        });
      } catch (err) {
        console.error("Erro ao dispensar lançamento:", err);
      }

      setTimeout(() => {
        useExploreStore.getState().dismissItem(numericId);
      }, 300);
    },
    []
  );

  const renderTrack = (
    itemsList: EnrichedRadarItem[],
    railId: string,
    subtitleLabel: string
  ) => {
    const scrollTrack = (direction: -1 | 1) => {
      const el = document.getElementById(railId);
      if (!el) return;
      const step = Math.max(260, Math.round(el.clientWidth * 0.75));
      el.scrollBy({ left: direction * step, behavior: "smooth" });
    };

    if (itemsList.length === 0) {
      return (
        <div className="py-6 text-center text-xs text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border">
          Nenhum lançamento futuro nesta categoria.
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            {subtitleLabel}
          </span>
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollTrack(-1)}
              className="w-8 h-8 rounded-lg bg-secondary/80 hover:bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer"
              title="Voltar na linha do tempo"
              aria-label="Voltar na linha do tempo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollTrack(1)}
              className="w-8 h-8 rounded-lg bg-secondary/80 hover:bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer"
              title="Avançar na linha do tempo"
              aria-label="Avançar na linha do tempo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Trilho Horizontal Conectado */}
        <RadarHorizontalContainer id={railId}>
          {itemsList.map((item, idx) => {
            const isLast = idx === itemsList.length - 1;
            const isSaved = Boolean(myListItems[item.id]);
            const isDismissing = dismissedIds.has(item.id);
            const itemTitle = item.title || item.name || "Sem título";
            const route = item.media_type === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
            const primaryTag = item.match_tags?.[0];

            return (
              <div
                key={`${item.media_type}-${item.id}`}
                className={cn(
                  "flex-[0_0_80%] sm:flex-[0_0_292px] snap-start pr-4 sm:pr-4 flex flex-col transition-all duration-300",
                  isDismissing && "opacity-0 scale-95 pointer-events-none"
                )}
              >
                {/* Linha Conectora da Linha do Tempo */}
                <div className="relative flex items-center h-9 mb-2.5">
                  {!isLast && (
                    <div
                      className={cn(
                        "absolute top-1/2 left-2 right-[-16px] h-[2px] -translate-y-1/2 z-0",
                        item.imminent
                          ? "bg-gradient-to-r from-sky-400 via-indigo-500/60 to-border"
                          : "bg-gradient-to-r from-primary/70 via-border to-border"
                      )}
                    />
                  )}

                  <div className="relative z-10 inline-flex items-center gap-2 bg-background pr-2.5 rounded-full">
                    <span
                      className={cn(
                        "w-3 h-3 rounded-full shrink-0 transition-transform duration-300",
                        item.imminent
                          ? "bg-sky-400 shadow-[0_0_0_4px_rgba(56,189,248,0.28)]"
                          : "bg-primary shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.20)]"
                      )}
                    />
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border whitespace-nowrap tracking-tight",
                        item.imminent
                          ? "bg-sky-500/15 border-sky-400/40 text-sky-400 dark:text-sky-300 shadow-sm"
                          : "bg-secondary border-border text-foreground"
                      )}
                    >
                      {item.urgencyLabel}
                    </span>
                  </div>
                </div>

                {/* Card de Descoberta do Radar */}
                <article className="flex-1 rounded-2xl p-3 bg-card border border-border hover:border-primary/60 transition-all duration-200 flex flex-col justify-between gap-3 shadow-md hover:shadow-xl hover:-translate-y-0.5 group">
                  <Link href={route} prefetch={false} className="block">
                    {/* Widescreen Art 16:9 */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 mb-2.5 border border-border/50">
                      <PosterImage
                        src={item.backdrop_path}
                        fallbackSrc={item.poster_path}
                        alt={itemTitle}
                        title={itemTitle}
                        type={item.media_type === "movie" ? "movie" : "tv"}
                        tmdbSize="w780"
                        className="transition-transform duration-500 ease-out group-hover:scale-105"
                      />

                      {/* Chip Tipo + Data */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                        {item.media_type === "movie" ? "🎬 FILME" : "📺 SÉRIE"} • {item.day} {item.month}
                      </span>

                      {/* Badge Match */}
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[11px] font-extrabold shadow-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {item.match_score}%
                      </span>
                    </div>

                    {/* Metadados & Título */}
                    <h3 className="text-[15px] font-extrabold leading-snug mb-1 truncate text-foreground group-hover:text-primary transition-colors">
                      {itemTitle}
                    </h3>

                    <div className="text-[11.5px] text-muted-foreground mb-1.5 flex items-center gap-1.5 truncate">
                      <span>Estreia: {item.formattedDate}</span>
                    </div>

                    {/* Sinopse curta */}
                    {item.overview && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                        {item.overview}
                      </p>
                    )}

                    {/* Motivo de afinidade */}
                    {primaryTag && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        <span
                          className={cn(
                            "text-[10.5px] px-2 py-0.5 rounded-md font-medium truncate max-w-full inline-block border",
                            isHighlightedTag(primaryTag)
                              ? "bg-amber-500/15 text-amber-500 dark:text-amber-300 border-amber-500/30"
                              : "bg-secondary text-foreground border-border"
                          )}
                        >
                          {primaryTag}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Botão de Ação: Conecta diretamente com o /dashboard + Botão Dispensar */}
                  <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleRadar(item, e)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer",
                        isSaved
                          ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/25"
                          : "bg-primary/10 border border-primary/35 text-primary hover:bg-primary hover:text-primary-foreground shadow-xs"
                      )}
                      title={
                        isSaved
                          ? "Já está salvo no seu Radar de Estreias do Dashboard (clique para remover)"
                          : "Salvar no seu Radar de Estreias do Dashboard"
                      }
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>✓ No Radar</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-3.5 h-3.5" />
                          <span>🔔 Aguardar Estreia</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDismiss(item, e)}
                      className="w-8 h-8 shrink-0 rounded-xl bg-secondary/80 hover:bg-rose-500/15 text-muted-foreground hover:text-rose-400 border border-border hover:border-rose-500/30 inline-flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                      title="Não tenho interesse neste lançamento (ocultar por 6 meses)"
                      aria-label="Não tenho interesse"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              </div>
            );
          })}
        </RadarHorizontalContainer>
      </div>
    );
  };

  const totalCount = enrichedAll.length;
  const movieCount = enrichedMovies.length;
  const seriesCount = enrichedSeries.length;

  return (
    <>
    <MobileAgenda
      all={enrichedAll}
      movies={enrichedMovies}
      series={enrichedSeries}
      myListItems={myListItems}
      onToggleRadar={handleToggleRadar}
      onDismiss={handleDismiss}
    />
    <section className="hidden lg:flex mb-12 flex-col gap-5">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2.5 text-foreground">
            <span>🗓️ Próximos Filmes &amp; Novas Séries para Você</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold">
              {totalCount}
            </span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Linha do tempo por ordem de chegada com contagem regressiva dinâmica para o seu perfil.
          </p>
        </div>

        {/* Controles de Topo: Filtro Unificado + Alternador de Modo */}
        <div className="flex items-center gap-2 flex-wrap">
          {!radarDualMode && (
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/80 border border-border shadow-xs">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeFilter === "all"
                    ? "bg-background text-primary shadow-xs border border-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Todos ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("movie")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeFilter === "movie"
                    ? "bg-background text-primary shadow-xs border border-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                🎬 Filmes ({movieCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("tv")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeFilter === "tv"
                    ? "bg-background text-primary shadow-xs border border-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                📺 Séries ({seriesCount})
              </button>
            </div>
          )}

          {/* Alternador: 1 Linha Unificada c/ Abas vs 2 Trilhas Separadas */}
          <button
            type="button"
            onClick={() => setRadarDualMode((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-accent text-foreground border border-border hover:border-primary/40 transition-all active:scale-[0.98] cursor-pointer"
            title="Alternar entre visualização unificada com abas ou 2 linhas do tempo separadas"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
            <span>{radarDualMode ? "⇄ Modo: 2 Trilhas Separadas" : "⇄ Modo: Unificado c/ Abas"}</span>
          </button>
        </div>
      </div>

      {/* Exibição do Radar */}
      {radarDualMode ? (
        <div className="flex flex-col gap-8">
          {enrichedMovies.length > 0 &&
            renderTrack(
              enrichedMovies,
              "railRadarMovies",
              "🎬 Linha do Tempo • Próximos Filmes para Você (ordem cronológica)"
            )}
          {enrichedSeries.length > 0 &&
            renderTrack(
              enrichedSeries,
              "railRadarSeries",
              "📺 Linha do Tempo • Novas Séries para Você (ordem cronológica)"
            )}
        </div>
      ) : (
        renderTrack(
          filteredItems,
          "railRadarUnified",
          activeFilter === "movie"
            ? "🎬 Próximos Filmes ordenados por data de lançamento"
            : activeFilter === "tv"
            ? "📺 Novas Séries ordenadas por data de estreia"
            : "🧭 Linha do tempo por ordem de chegada (Filmes & Séries em contagem regressiva)"
        )
      )}
    </section>
    </>
  );
});
