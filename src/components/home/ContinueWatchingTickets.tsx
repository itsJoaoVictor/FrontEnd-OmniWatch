"use client";

import { memo, useState, useMemo, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Flame,
  Flag,
  Ticket,
  LayoutGrid,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PosterImage } from "@/components/shared/PosterImage";
import { useMyListStore } from "@/store/useMyListStore";
import { toast } from "@/components/ui/toast";
import {
  getCachedSeasonEpisodes,
  fetchAndCacheSeasonEpisodes,
  resolveAfterWatchingEpisodeSync,
  resolveAfterWatchingEpisodeAsync,
  addUpToDateShowToCache,
  saveCorrectedEpisodesToCache,
} from "@/lib/seriesCache";
import { isFutureDate, parseReleaseDate } from "@/lib/dateUtils";
import { MediaItem } from "./MediaCard";
import { ContentCarousel } from "./ContentCarousel";

interface ContinueWatchingTicketsProps {
  items: MediaItem[];
  title?: string;
  subtitle?: string;
  actionHref?: string;
  actionText?: string;
}

interface EnrichedTicketItem extends MediaItem {
  tmdbId: number;
  currentSeason: number;
  currentEp: number;
  epName: string;
  totalEpsInSeason: number;
  releasedEpsInSeason: number;
  availableRemaining: number;
  isFinishing: boolean;
  hasNew: boolean;
  lastWatchedTimestamp: number;
  isExitingUpToDate?: boolean;
}

export const ContinueWatchingTickets = memo(function ContinueWatchingTickets({
  items,
  title = "Continuar Assistindo",
  subtitle = "Episódios disponíveis agora • Séries em dia saem automaticamente",
  actionHref = "/my-list",
  actionText = "Ver na biblioteca",
}: ContinueWatchingTicketsProps) {
  const storeItems = useMyListStore((state) => state.items);
  const episodeProgress = useMyListStore((state) => state.episodeProgress);
  const toggleEpisode = useMyListStore((state) => state.toggleEpisode);

  const [activeFilter, setActiveFilter] = useState<"all" | "new" | "finishing">("all");
  const [viewMode, setViewMode] = useState<"tickets" | "carousel">("tickets");
  const [isExpanded, setIsExpanded] = useState(false);
  const [seasonCacheTick, setSeasonCacheTick] = useState(0);
  const [busyIds, setBusyIds] = useState<Record<number, boolean>>({});

  // Cards que acabaram de ficar "Em dia" permanecem ~650ms com feedback visual antes de sair
  const [exitingUpToDateMap, setExitingUpToDateMap] = useState<Record<number, EnrichedTicketItem>>({});

  // Último check-in normal (série continua ativa)
  const [lastCheckIn, setLastCheckIn] = useState<{
    tmdbId: number;
    season: number;
    episode: number;
    title: string;
    timestamp: number;
  } | null>(null);

  // Última série removida por ter ficado "Em dia" (permite desfazer pelo cabeçalho por 10s)
  const [lastCaughtUpUndo, setLastCaughtUpUndo] = useState<{
    tmdbId: number;
    season: number;
    episode: number;
    title: string;
  } | null>(null);

  const [, startTransition] = useTransition();

  // Limpa automaticamente o banner de desfazer de "Em dia" após 10 segundos
  useEffect(() => {
    if (!lastCaughtUpUndo) return;
    const timer = setTimeout(() => {
      setLastCaughtUpUndo(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [lastCaughtUpUndo]);

  // Limpa destaque de check-in recente após 12 segundos
  useEffect(() => {
    if (!lastCheckIn) return;
    const timer = setTimeout(() => {
      setLastCheckIn(null);
    }, 12000);
    return () => clearTimeout(timer);
  }, [lastCheckIn]);

  // Enriquecimento com dados reais das temporadas (incluindo rollover de temporada e filtro estrito de "em dia")
  const enrichedList = useMemo(() => {
    // Referencia seasonCacheTick para recalcular assim que novos metadados de temporada chegarem
    void seasonCacheTick;

    const result: EnrichedTicketItem[] = [];
    const seenIds = new Set<number>();

    for (const item of items) {
      const tmdbId = parseInt(item.id, 10);
      if (isNaN(tmdbId)) continue;
      if (seenIds.has(tmdbId)) continue;

      const saved = storeItems[tmdbId];

      // Regra 1: Nunca manter séries que já estão em dia (exceto durante os 650ms de saída)
      if (exitingUpToDateMap[tmdbId]) {
        seenIds.add(tmdbId);
        result.push({ ...exitingUpToDateMap[tmdbId], isExitingUpToDate: true });
        continue;
      }

      const nextAirDate = saved?.next_episode?.air_date;
      const isNextEpActuallyReleased = nextAirDate ? !isFutureDate(nextAirDate) : false;

      if (!isNextEpActuallyReleased) {
        if (item.isUpToDate === true || saved?.is_up_to_date === true) {
          continue;
        }
        if (saved?.next_episode?.is_released === false) {
          continue;
        }
        if (nextAirDate && isFutureDate(nextAirDate)) {
          continue;
        }
      }

      let currentSeason =
        saved?.next_episode?.season_number ?? item.nextEpisodeToWatch?.season ?? 1;
      let currentEp =
        saved?.next_episode?.episode_number ?? item.nextEpisodeToWatch?.episode ?? 1;
      let epName = saved?.next_episode?.name || `Episódio ${currentEp}`;

      let seasonEps = getCachedSeasonEpisodes(tmdbId, currentSeason);

      // Regra 3: Auto-correção imediata de troca de temporada se currentEp passou do fim da temporada atual
      if (Array.isArray(seasonEps) && seasonEps.length > 0) {
        const maxEpInSeason = seasonEps.reduce(
          (max, e) => Math.max(max, e.episode_number || 0),
          seasonEps.length
        );

        if (currentEp > maxEpInSeason) {
          const nextSeasonEps = getCachedSeasonEpisodes(tmdbId, currentSeason + 1);
          if (nextSeasonEps === null || (Array.isArray(nextSeasonEps) && nextSeasonEps.length === 0)) {
            // Não existe próxima temporada -> série está em dia!
            continue;
          }
          if (Array.isArray(nextSeasonEps) && nextSeasonEps.length > 0) {
            const firstEpNext =
              nextSeasonEps.find((e) => e.episode_number === 1) || nextSeasonEps[0];
            if (!firstEpNext?.air_date || isFutureDate(firstEpNext.air_date)) {
              // Próxima temporada ainda não estreou -> série está em dia!
              continue;
            }
            // Rollover limpo para S(N+1) E1!
            currentSeason = currentSeason + 1;
            currentEp = firstEpNext.episode_number;
            epName = firstEpNext.name || `Episódio ${currentEp}`;
            seasonEps = nextSeasonEps;
          }
        } else {
          const currentEpMeta = seasonEps.find((e) => e.episode_number === currentEp);
          if (!currentEpMeta) {
            continue;
          }
          // Se o episódio apontado ainda não lançou, a série está em dia!
          if (!currentEpMeta.air_date || isFutureDate(currentEpMeta.air_date)) {
            continue;
          }
          if (currentEpMeta.name) {
            epName = currentEpMeta.name;
          }
        }
      }

      const progressList = episodeProgress[tmdbId] || [];
      const maxWatchedInSeason = progressList
        .filter((p) => p.season_number === currentSeason)
        .reduce((max, p) => Math.max(max, p.episode_number), 0);

      // Cálculo preciso do total da temporada e de quantos episódios JÁ LANÇADOS faltam
      let totalEpsInSeason = Math.max(maxWatchedInSeason, currentEp, 8);
      let releasedEpsInSeason = totalEpsInSeason;
      let hasRecentAirDate = false;

      if (Array.isArray(seasonEps) && seasonEps.length > 0) {
        totalEpsInSeason = seasonEps.length;
        const releasedList = seasonEps.filter(
          (e) => e.air_date && !isFutureDate(e.air_date)
        );
        releasedEpsInSeason = Math.max(currentEp, releasedList.length);

        const curMeta = seasonEps.find((e) => e.episode_number === currentEp);
        if (curMeta?.air_date) {
          const diffHours =
            (Date.now() - parseReleaseDate(curMeta.air_date).getTime()) / (1000 * 60 * 60);
          if (diffHours >= -12 && diffHours <= 120) {
            hasRecentAirDate = true;
          }
        }
      } else if (saved?.next_episode?.air_date) {
        const diffHours =
          (Date.now() - parseReleaseDate(saved.next_episode.air_date).getTime()) /
          (1000 * 60 * 60);
        if (diffHours >= -12 && diffHours <= 120) {
          hasRecentAirDate = true;
        }
      }

      const availableRemaining = Math.max(1, releasedEpsInSeason - currentEp + 1);
      const isFinishing = availableRemaining <= 2;
      const hasNew = hasRecentAirDate;

      const lastWatchedTimestamp = saved?.last_watched_at
        ? new Date(saved.last_watched_at).getTime()
        : 0;

      seenIds.add(tmdbId);
      result.push({
        ...item,
        tmdbId,
        currentSeason,
        currentEp,
        epName,
        totalEpsInSeason,
        releasedEpsInSeason,
        availableRemaining,
        isFinishing,
        hasNew,
        lastWatchedTimestamp,
      });
    }

    // Inclui cards que já saíram de `items` na store mas ainda estão nos 650ms de transição de saída
    for (const [idStr, exitingCard] of Object.entries(exitingUpToDateMap)) {
      const numId = Number(idStr);
      if (!seenIds.has(numId)) {
        result.push({ ...exitingCard, isExitingUpToDate: true });
      }
    }

    return result;
  }, [items, storeItems, episodeProgress, seasonCacheTick, exitingUpToDateMap]);

  // Pré-aquece os metadados das temporadas visíveis + próxima temporada quando está nos últimos 2 episódios!
  useEffect(() => {
    let cancelled = false;

    const warmSeasons = async () => {
      let updatedAny = false;

      for (const item of enrichedList) {
        if (item.isExitingUpToDate || item.type !== "tv") continue;

        let seasonEps = getCachedSeasonEpisodes(item.tmdbId, item.currentSeason);
        if (seasonEps === undefined) {
          seasonEps = await fetchAndCacheSeasonEpisodes(item.tmdbId, item.currentSeason);
          updatedAny = true;
        }

        if (Array.isArray(seasonEps) && seasonEps.length > 0) {
          const maxEp = seasonEps.reduce(
            (m, e) => Math.max(m, e.episode_number || 0),
            seasonEps.length
          );
          // Se está nos 2 últimos episódios da temporada (ou já passou), pré-carrega a temporada seguinte!
          if (item.currentEp >= maxEp - 1) {
            const nextCached = getCachedSeasonEpisodes(item.tmdbId, item.currentSeason + 1);
            if (nextCached === undefined) {
              await fetchAndCacheSeasonEpisodes(item.tmdbId, item.currentSeason + 1);
              updatedAny = true;
            }
          }

          // Auto-saneamento persistente caso cache antigo apontasse para episódio além da temporada
          if (item.currentEp > maxEp) {
            const nextCached = getCachedSeasonEpisodes(item.tmdbId, item.currentSeason + 1);
            if (Array.isArray(nextCached) && nextCached.length > 0) {
              const ep1 = nextCached.find((e) => e.episode_number === 1) || nextCached[0];
              if (ep1?.air_date && !isFutureDate(ep1.air_date)) {
                saveCorrectedEpisodesToCache({
                  [item.tmdbId]: { season: item.currentSeason + 1, episode: ep1.episode_number },
                });
              } else {
                addUpToDateShowToCache(item.tmdbId);
              }
            } else if (nextCached === null) {
              addUpToDateShowToCache(item.tmdbId);
            }
          }
        }
      }

      if (!cancelled && updatedAny) {
        setSeasonCacheTick((t) => t + 1);
      }
    };

    if (enrichedList.length > 0) {
      warmSeasons();
    }

    return () => {
      cancelled = true;
    };
  }, [enrichedList]);

  // Ordenação inteligente:
  // 1º Episódio novo recente
  // 2º Reta final (<= 2 episódios disponíveis restantes)
  // 3º Visto mais recentemente
  const sortedList = useMemo(() => {
    const list = [...enrichedList];
    list.sort((a, b) => {
      if (a.hasNew && !b.hasNew) return -1;
      if (!a.hasNew && b.hasNew) return 1;
      if (a.isFinishing && !b.isFinishing) return -1;
      if (!a.isFinishing && b.isFinishing) return 1;
      return b.lastWatchedTimestamp - a.lastWatchedTimestamp;
    });
    return list;
  }, [enrichedList]);

  const newCount = useMemo(
    () => sortedList.filter((i) => i.hasNew && !i.isExitingUpToDate).length,
    [sortedList]
  );
  const finishingCount = useMemo(
    () => sortedList.filter((i) => i.isFinishing && !i.isExitingUpToDate).length,
    [sortedList]
  );

  // Se o filtro ativo esvaziar (ex: marcou o último "Novo Ep"), volta automaticamente para "all"
  useEffect(() => {
    if (activeFilter === "new" && newCount === 0) {
      setActiveFilter("all");
    } else if (activeFilter === "finishing" && finishingCount === 0) {
      setActiveFilter("all");
    }
  }, [activeFilter, newCount, finishingCount]);

  const filteredList = useMemo(() => {
    if (activeFilter === "new") return sortedList.filter((i) => i.hasNew || i.isExitingUpToDate);
    if (activeFilter === "finishing")
      return sortedList.filter((i) => i.isFinishing || i.isExitingUpToDate);
    return sortedList;
  }, [sortedList, activeFilter]);

  // 6 visíveis no desktop (no mobile usamos CSS hidden a partir do 5º item quando !isExpanded para exibir 4!)
  const visibleList = useMemo(() => {
    if (isExpanded) return filteredList;
    return filteredList.slice(0, 6);
  }, [filteredList, isExpanded]);

  // Check-in dinâmico (+1 Ep) lidando com "Ficou em dia" e "Troca de Temporada"
  const handleCheckIn = useCallback(
    async (item: EnrichedTicketItem) => {
      if (isNaN(item.tmdbId) || busyIds[item.tmdbId] || item.isExitingUpToDate) return;

      const watchedSeason = item.currentSeason;
      const watchedEp = item.currentEp;

      setBusyIds((prev) => ({ ...prev, [item.tmdbId]: true }));

      try {
        // Verifica instantaneamente (ou busca em <100ms) o que acontece após marcar este episódio
        let resolved = resolveAfterWatchingEpisodeSync(item.tmdbId, watchedSeason, watchedEp);
        if (resolved === undefined) {
          resolved = await resolveAfterWatchingEpisodeAsync(item.tmdbId, watchedSeason, watchedEp);
        }

        if (resolved?.isUpToDate) {
          // Regra 2: Vai deixar a série em dia -> mostra estado de conclusão curto (650ms) e já remove!
          setExitingUpToDateMap((prev) => ({
            ...prev,
            [item.tmdbId]: { ...item, isExitingUpToDate: true },
          }));

          setLastCaughtUpUndo({
            tmdbId: item.tmdbId,
            season: watchedSeason,
            episode: watchedEp,
            title: item.title,
          });
          setLastCheckIn(null);

          setTimeout(() => {
            setExitingUpToDateMap((prev) => {
              const next = { ...prev };
              delete next[item.tmdbId];
              return next;
            });
          }, 650);

          startTransition(() => {
            void toggleEpisode(item.tmdbId, watchedSeason, watchedEp, true);
          });

          toast.add({
            title: "🎉 Série em dia!",
            description: `${item.title} (S${watchedSeason} E${watchedEp}) concluído e removido de Continuar Assistindo.`,
            type: "success",
          });
        } else {
          // Série continua com episódios disponíveis (mesma temporada OU próxima temporada via rollover!)
          startTransition(() => {
            void toggleEpisode(item.tmdbId, watchedSeason, watchedEp, true);
          });

          setLastCheckIn({
            tmdbId: item.tmdbId,
            season: watchedSeason,
            episode: watchedEp,
            title: item.title,
            timestamp: Date.now(),
          });

          if (resolved?.rolledOverSeason && resolved.nextEpisode) {
            // Pré-aquece a temporada seguinte à nova caso necessário
            void fetchAndCacheSeasonEpisodes(
              item.tmdbId,
              resolved.nextEpisode.season_number
            ).then(() => setSeasonCacheTick((t) => t + 1));

            toast.add({
              title: `🎬 Temporada ${watchedSeason} concluída!`,
              description: `${item.title} avançou direto para S${resolved.nextEpisode.season_number} E${resolved.nextEpisode.episode_number}.`,
              type: "success",
            });
          } else {
            toast.add({
              title: "Episódio marcado como visto!",
              description: `${item.title} — S${watchedSeason} E${watchedEp}`,
              type: "success",
            });
          }
        }
      } catch (err) {
        console.error("Erro ao marcar episódio:", err);
      } finally {
        setTimeout(() => {
          setBusyIds((prev) => {
            const next = { ...prev };
            delete next[item.tmdbId];
            return next;
          });
        }, 250);
      }
    },
    [busyIds, toggleEpisode]
  );

  // Desfazer check-in (tanto de card ativo quanto de série recém-removida por ficar em dia)
  const handleUndo = useCallback(
    async (tmdbId: number, season: number, episode: number, seriesTitle: string) => {
      if (busyIds[tmdbId]) return;
      setBusyIds((prev) => ({ ...prev, [tmdbId]: true }));

      setExitingUpToDateMap((prev) => {
        if (!(tmdbId in prev)) return prev;
        const next = { ...prev };
        delete next[tmdbId];
        return next;
      });

      if (lastCheckIn?.tmdbId === tmdbId) setLastCheckIn(null);
      if (lastCaughtUpUndo?.tmdbId === tmdbId) setLastCaughtUpUndo(null);

      try {
        await toggleEpisode(tmdbId, season, episode, false);
        toast.add({
          title: "Check-in desfeito",
          description: `${seriesTitle} voltou para S${season} E${episode}.`,
          type: "info",
        });
      } catch (err) {
        console.error("Erro ao desfazer episódio:", err);
      } finally {
        setBusyIds((prev) => {
          const next = { ...prev };
          delete next[tmdbId];
          return next;
        });
      }
    },
    [busyIds, lastCaughtUpUndo, lastCheckIn, toggleEpisode]
  );

  // Se não há séries pendentes nem card saindo nem opção recente de desfazer, oculta a seção inteira
  const activeCount = sortedList.filter((i) => !i.isExitingUpToDate).length;
  if (sortedList.length === 0 && !lastCaughtUpUndo) {
    return null;
  }

  return (
    <section className="w-full relative py-2 space-y-4">
      {/* Cabeçalho da Seção */}
      <div className="px-4 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <span>{title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                {activeCount}
              </span>
            </h2>

            {/* Alternador de Modo de Exibição */}
            {sortedList.length > 0 && (
              <div className="hidden sm:flex items-center bg-secondary/50 p-0.5 rounded-lg border border-border/80 text-[11px] font-semibold ml-1">
                <button
                  type="button"
                  onClick={() => setViewMode("tickets")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                    viewMode === "tickets"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Modo Tickets Rápidos"
                >
                  <Ticket className="w-3 h-3 text-emerald-400" />
                  <span>Tickets</span>
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
                  title="Modo Carrossel Widescreen"
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>Carrossel</span>
                </button>
              </div>
            )}

            {/* Pill Dinâmico de Desfazer quando uma série acabou de ficar em dia e saiu da lista */}
            {lastCaughtUpUndo && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-xs animate-in fade-in slide-in-from-left-2 duration-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-medium truncate max-w-[200px] sm:max-w-xs">
                  <strong>{lastCaughtUpUndo.title}</strong> ficou em dia!
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleUndo(
                      lastCaughtUpUndo.tmdbId,
                      lastCaughtUpUndo.season,
                      lastCaughtUpUndo.episode,
                      lastCaughtUpUndo.title
                    )
                  }
                  className="text-amber-300 hover:text-amber-200 font-extrabold flex items-center gap-1 cursor-pointer shrink-0 underline underline-offset-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Desfazer</span>
                </button>
              </div>
            )}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        {/* Filtros Rápidos (Pills) e Link de Ação */}
        {sortedList.length > 0 && (
          <div className="flex items-center gap-3">
            {viewMode === "tickets" && (newCount > 0 || finishingCount > 0) && (
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar bg-secondary/40 p-1 rounded-xl border border-border/70 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap",
                    activeFilter === "all"
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Todas ({activeCount})
                </button>

                {newCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter("new")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                      activeFilter === "new"
                        ? "bg-emerald-600 text-white shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Flame className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Novo Ep ({newCount})</span>
                  </button>
                )}

                {finishingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter("finishing")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                      activeFilter === "finishing"
                        ? "bg-amber-600 text-white shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Flag className="w-3.5 h-3.5 text-amber-200" />
                    <span>Reta Final ({finishingCount})</span>
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
                <span>{actionText || "Ver todos"}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Renderização Condicional: Modo Carrossel vs Modo Tickets */}
      {sortedList.length > 0 &&
        (viewMode === "carousel" ? (
          <ContentCarousel
            title=""
            items={sortedList.filter((i) => !i.isExitingUpToDate)}
            layout="tracking"
          />
        ) : (
          <div className="px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {visibleList.map((item, idx) => {
                const isExiting = Boolean(item.isExitingUpToDate);
                const hasRecentCheckIn =
                  !isExiting &&
                  lastCheckIn?.tmdbId === item.tmdbId &&
                  Date.now() - (lastCheckIn?.timestamp || 0) < 12000;
                const isBusy = Boolean(busyIds[item.tmdbId]);

                // Limita visualmente o número máximo de blocos renderizados para temporadas muito longas (ex: animes de 50+ eps)
                const maxSegments = Math.min(item.totalEpsInSeason, 26);
                const segmentRatio = item.totalEpsInSeason / maxSegments;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative rounded-2xl bg-card/85 hover:bg-card border border-border/80 hover:border-primary/50 transition-all duration-500 flex items-stretch overflow-hidden shadow-xs hover:shadow-md hover:shadow-primary/5",
                      // No celular mostra 4 itens por padrão; no desktop (md+) mostra todos os 6
                      !isExpanded && idx >= 4 && "hidden md:flex",
                      hasRecentCheckIn && "ring-1 ring-emerald-500/50 bg-emerald-950/10",
                      isExiting &&
                        "ring-1 ring-emerald-500 bg-emerald-950/25 opacity-60 scale-[0.98] pointer-events-none"
                    )}
                  >
                    {/* 16:9 Thumbnail Link com Badge */}
                    <Link
                      href={`/${item.type === "movie" ? "movie" : "tv"}/${item.id}`}
                      prefetch={false}
                      className="w-24 min-[380px]:w-28 sm:w-36 relative shrink-0 bg-muted overflow-hidden block cursor-pointer"
                    >
                      <PosterImage
                        src={item.coverHorizontal || item.coverVertical}
                        fallbackSrc={item.coverVertical}
                        alt={item.title}
                        title={item.title}
                        type={item.type}
                        fill
                        sizes="(max-width: 640px) 112px, 144px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-black/20 to-card/90" />

                      {isExiting ? (
                        <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 px-2 py-0.5 rounded bg-emerald-500 text-zinc-950 text-[9px] font-extrabold uppercase shadow-xs">
                          Em dia!
                        </span>
                      ) : item.hasNew ? (
                        <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 px-1.5 py-0.5 rounded bg-emerald-500 text-zinc-950 text-[9px] font-extrabold uppercase shadow-xs">
                          Novo
                        </span>
                      ) : null}

                      <span className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-10 px-2 py-0.5 rounded bg-black/85 text-white text-[10px] font-extrabold border border-white/15 backdrop-blur-xs shadow-xs">
                        S{item.currentSeason} E{item.currentEp}
                      </span>
                    </Link>

                    {/* Centro: Dados e Barra Segmentada de Temporada */}
                    <div className="flex-1 p-2.5 min-[380px]:p-3 sm:p-3.5 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={`/${item.type === "movie" ? "movie" : "tv"}/${item.id}`}
                            prefetch={false}
                            className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors truncate"
                          >
                            {item.title}
                          </Link>
                          <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                            Temp. {item.currentSeason}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-normal">
                          {isExiting ? "Todos os episódios disponíveis concluídos!" : item.epName}
                        </p>
                      </div>

                      {/* Barra Segmentada Real da Temporada */}
                      <div className="pt-2 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <span className="text-muted-foreground truncate">
                            {item.currentEp - 1}/{item.releasedEpsInSeason} vistos
                          </span>
                          <span
                            className={cn(
                              "font-semibold shrink-0",
                              isExiting
                                ? "text-emerald-400 font-bold"
                                : item.availableRemaining === 1
                                ? "text-emerald-400 font-bold"
                                : item.isFinishing
                                ? "text-amber-400 font-bold"
                                : "text-muted-foreground"
                            )}
                          >
                            {isExiting
                              ? "✓ Série em dia"
                              : item.availableRemaining === 1
                              ? "Último ep disponível"
                              : `Faltam ${item.availableRemaining} eps`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 w-full">
                          {Array.from({ length: maxSegments }).map((_, idxSeg) => {
                            const representedEp = Math.round((idxSeg + 1) * segmentRatio);
                            const isWatched = isExiting || representedEp < item.currentEp;
                            const isCurrent = !isExiting && representedEp === item.currentEp;
                            const isUnreleased = representedEp > item.releasedEpsInSeason;

                            return (
                              <span
                                key={idxSeg}
                                className={cn(
                                  "h-1.5 flex-1 rounded-xs transition-all",
                                  isWatched && "bg-emerald-500",
                                  isCurrent && "bg-primary animate-pulse ring-1 ring-primary/60",
                                  !isWatched &&
                                    !isCurrent &&
                                    (isUnreleased ? "bg-muted/30" : "bg-muted/75")
                                )}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Canhoto Direito Tátil (+1 Ep + Desfazer) */}
                    <div className="border-l border-dashed border-border/80 px-2.5 sm:px-3 py-2 flex flex-col items-center justify-center gap-1 bg-muted/20 shrink-0 min-w-[76px]">
                      <button
                        type="button"
                        disabled={isBusy || isExiting}
                        onClick={() => handleCheckIn(item)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 disabled:opacity-70",
                          isExiting || hasRecentCheckIn
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
                        )}
                        title={`Marcar S${item.currentSeason} E${item.currentEp} como visto`}
                      >
                        {isExiting ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Em dia</span>
                          </>
                        ) : (
                          <span>+1 Ep</span>
                        )}
                      </button>

                      {/* Desfazer último clique (inclusive se houve troca de temporada S1->S2!) ou -1 episódio */}
                      {!isExiting && hasRecentCheckIn && lastCheckIn ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleUndo(
                              item.tmdbId,
                              lastCheckIn.season,
                              lastCheckIn.episode,
                              item.title
                            )
                          }
                          className="px-2 py-1 rounded-md text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors flex items-center gap-0.5 font-bold cursor-pointer"
                          title={`Desfazer S${lastCheckIn.season} E${lastCheckIn.episode}`}
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Desfazer</span>
                        </button>
                      ) : !isExiting && item.currentEp > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleUndo(
                              item.tmdbId,
                              item.currentSeason,
                              item.currentEp - 1,
                              item.title
                            )
                          }
                          className="px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors font-medium cursor-pointer"
                          title="Voltar 1 episódio"
                        >
                          ↶ -1
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botão "Ver todas (X)" — aparece se houver >4 no mobile ou >6 no desktop */}
            {filteredList.length > 4 && (
              <div
                className={cn(
                  "mt-4 flex items-center justify-center",
                  !isExpanded && filteredList.length <= 6 && "md:hidden"
                )}
              >
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-5 py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/80 text-xs font-bold text-foreground hover:text-primary transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isExpanded ? (
                    <>
                      <span>Mostrar menos</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Ver todas ({activeCount} em andamento)</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
    </section>
  );
});
