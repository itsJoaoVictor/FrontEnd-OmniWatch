"use client";

import { memo, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Compass,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PersonaCarousel, RecommendationItem } from "@/types/recommendation";
import { PosterImage } from "@/components/shared/PosterImage";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { api } from "@/lib/axios";
import { toast } from "@/components/ui/toast";
import { useExploreStore } from "@/store/useExploreStore";
import { useDragScroll } from "@/hooks/useDragScroll";
import {
  MobilePosterRail,
  MobileSectionHeader,
  type MobileCardItem,
} from "./mobile/mobile-kit";

interface PersonasMoodSwitcherProps {
  personas: PersonaCarousel[];
}

function isHighlightedTag(tag: string): boolean {
  return (
    tag.startsWith("❤️") ||
    tag.startsWith("🎬") ||
    tag.startsWith("🌟") ||
    tag.startsWith("🍿") ||
    tag.startsWith("🔄")
  );
}

function extractYear(item: RecommendationItem): string {
  const raw = item.release_date || item.first_air_date || "";
  return raw.length >= 4 ? raw.slice(0, 4) : "";
}

function extractGenres(item: RecommendationItem): string[] {
  if (Array.isArray(item.genres) && item.genres.length > 0) {
    return item.genres
      .map((g) => (typeof g === "string" ? g : g?.name))
      .filter((n): n is string => Boolean(n))
      .slice(0, 3);
  }
  return [];
}

export const PersonasMoodSwitcher = memo(function PersonasMoodSwitcher({
  personas,
}: PersonasMoodSwitcherProps) {
  const [activePersonaId, setActivePersonaId] = useState<string>(
    personas[0]?.id || ""
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const subRailRef = useDragScroll<HTMLDivElement>("x");

  const currentPersona = useMemo(() => {
    return personas.find((p) => p.id === activePersonaId) || personas[0];
  }, [personas, activePersonaId]);

  const handleSelectPersona = useCallback(
    (id: string) => {
      if (id === activePersonaId) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setActivePersonaId(id);
        setIsTransitioning(false);
        if (subRailRef.current) {
          subRailRef.current.scrollTo({ left: 0, behavior: "smooth" });
        }
      }, 140);
    },
    [activePersonaId]
  );

  const scrollSubRail = (direction: -1 | 1) => {
    if (!subRailRef.current) return;
    const step = Math.max(240, Math.round(subRailRef.current.clientWidth * 0.75));
    subRailRef.current.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const handleDismiss = useCallback(
    async (item: RecommendationItem, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const numericId = Number(item.id);
      const displayTitle = item.title || item.name || "Título";
      const mediaType = item.media_type === "tv" ? "tv" : "movie";

      setDismissedIds((prev) => new Set(prev).add(numericId));

      try {
        await api.post("/api/recommendations/dismiss", {
          tmdb_id: numericId,
          media_type: mediaType,
          title: displayTitle,
          poster_path: item.poster_path,
          days_snooze: 180,
        });

        toast.add({
          title: "Recomendação dispensada",
          description: `"${displayTitle}" foi ocultado das suas recomendações por 6 meses.`,
          type: "info",
        });
      } catch (err) {
        console.error("Erro ao dispensar recomendação da persona:", err);
      }

      setTimeout(() => {
        useExploreStore.getState().dismissItem(numericId);
      }, 300);
    },
    []
  );

  if (!currentPersona) return null;

  // Filtra itens já dispensados
  const recommendations = (currentPersona.recommendations || []).filter(
    (item) => !dismissedIds.has(item.id)
  );

  const leadItem = recommendations[0];
  const secondaryItems = recommendations.slice(1);

  const leadMediaType = (leadItem?.media_type === "tv" ? "tv" : "movie") as "movie" | "tv";
  const leadTitle = leadItem?.title || leadItem?.name || "Sem título";
  const leadRoute = leadMediaType === "movie" ? `/movie/${leadItem?.id}` : `/tv/${leadItem?.id}`;
  const leadYear = leadItem ? extractYear(leadItem) : "";
  const leadGenres = leadItem ? extractGenres(leadItem) : [];
  const isLeadDismissing = leadItem ? dismissedIds.has(leadItem.id) : false;

  return (
    <>
    {/* ===== MOBILE (< lg): chips de faceta + trilho de pôsteres ===== */}
    <section className="lg:hidden mb-10">
      <MobileSectionHeader
        emoji="🎭"
        title="Suas Facetas de Gosto"
        badge={`${personas.length}`}
        subtitle="Escolha um humor e veja sugestões afinadas com o seu histórico."
      />

      <div
        role="tablist"
        aria-label="Facetas de gosto"
        className="flex gap-2 overflow-x-auto scrollbar-none snap-x -mx-4 px-4 scroll-px-4 pb-1 mb-4"
      >
        {personas.map((p) => {
          const isActive = p.id === currentPersona.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectPersona(p.id)}
              className={cn(
                "snap-start shrink-0 min-h-11 pl-3 pr-4 rounded-full border inline-flex items-center gap-2 text-sm font-bold transition-all active:scale-95",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-card text-foreground border-border"
              )}
            >
              <span className="text-lg leading-none">{p.emoji}</span>
              <span className="whitespace-nowrap">{p.name}</span>
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "transition-all duration-200",
          isTransitioning ? "opacity-35 translate-y-1 pointer-events-none" : "opacity-100 translate-y-0"
        )}
      >
        <div className="mb-4 px-1">
          {currentPersona.tagline && (
            <p className="text-sm font-semibold text-primary italic leading-snug">&ldquo;{currentPersona.tagline}&rdquo;</p>
          )}
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {currentPersona.top_genres.slice(0, 3).join(" • ")} • baseada em{" "}
            <strong className="text-foreground">{currentPersona.item_count} obras</strong> que você assistiu
            {currentPersona.sample_titles && currentPersona.sample_titles.length > 0 && (
              <>
                {" "}
                (ex.: {currentPersona.sample_titles.slice(0, 2).join(", ")})
              </>
            )}
          </p>
        </div>

        {recommendations.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border">
            Você já explorou ou dispensou todas as sugestões desta faceta.
          </div>
        ) : (
          <MobilePosterRail
            featureFirst
            items={recommendations.slice(0, 10).map<MobileCardItem>((it) => {
              const mt = it.media_type === "tv" ? "tv" : "movie";
              const tag = it.match_tags?.[0];
              return {
                id: it.id,
                title: it.title || it.name || "Sem título",
                mediaType: mt,
                poster_path: it.poster_path,
                backdrop_path: it.backdrop_path,
                release_date: it.release_date || it.first_air_date,
                matchScore: it.match_score,
                meta: [mt === "movie" ? "Filme" : "Série", extractYear(it)].filter(Boolean).join(" • "),
                tag,
              };
            })}
            hiddenIds={dismissedIds}
            onDismiss={(mi) => {
              const src = recommendations.find((r) => r.id === mi.id);
              if (src) handleDismiss(src, { preventDefault() {}, stopPropagation() {} } as React.MouseEvent);
            }}
          />
        )}
      </div>
    </section>

    <section className="hidden lg:flex mb-12 flex-col gap-6">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2.5 text-foreground">
            <span>🎭 Suas Facetas de Gosto</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-bold">
              {personas.length} Facetas Ativas
            </span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Escolha um humor para transformar a vitrine editorial com base no seu histórico assistido.
          </p>
        </div>
      </div>

      {/* Dock de Facetas / Moods (Desktop Grid / Mobile Trilho Snap-x) */}
      <div
        className="flex lg:grid lg:grid-cols-4 gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 py-1"
        role="tablist"
        aria-label="Facetas de gosto do usuário"
      >
        {personas.map((p) => {
          const isActive = p.id === currentPersona.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectPersona(p.id)}
              className={cn(
                "relative flex-[0_0_72%] sm:flex-[0_0_46%] lg:flex-1 snap-start text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5",
                isActive
                  ? "bg-primary/[0.08] border-primary shadow-lg ring-1 ring-primary/40 -translate-y-0.5"
                  : "bg-card border-border hover:border-border-strong hover:bg-card-elevated"
              )}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="text-2xl leading-none select-none">{p.emoji}</span>
                <span
                  className="font-mono text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-md bg-secondary border border-border"
                  title="Quantidade de obras da sua biblioteca que formam esta faceta"
                >
                  {p.item_count} assistidos
                </span>
              </div>

              <div>
                <strong className="block text-sm sm:text-base font-extrabold text-foreground truncate mb-0.5">
                  {p.name}
                </strong>
                <span className="block text-xs text-muted-foreground truncate">
                  {p.top_genres.slice(0, 3).join(", ")}
                </span>
              </div>

              {/* Barra inferior indicadora de foco ativo */}
              {isActive && (
                <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Palco Ativo do Mood Selecionado */}
      <div
        className={cn(
          "rounded-3xl border border-border bg-card p-4 sm:p-6 md:p-8 flex flex-col gap-6 shadow-xl transition-all duration-200",
          isTransitioning ? "opacity-35 translate-y-1 pointer-events-none" : "opacity-100 translate-y-0"
        )}
      >
        {/* Banner Editorial do Humor Ativo */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 pb-5 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <span className="text-2xl sm:text-3xl">{currentPersona.emoji}</span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {currentPersona.name}
              </h3>
            </div>
            {currentPersona.tagline && (
              <p className="text-xs sm:text-sm font-medium text-primary italic mb-1">
                "{currentPersona.tagline}"
              </p>
            )}
            <p className="text-xs sm:text-[13px] text-muted-foreground">
              Recomendações afinadas para a sua faceta de{" "}
              <span className="text-foreground font-semibold">
                {currentPersona.top_genres.join(", ")}
              </span>{" "}
              • calculadas a partir de{" "}
              <strong className="text-foreground font-medium">
                {currentPersona.item_count} obras assistidas da sua biblioteca
              </strong>
            </p>
          </div>

          {currentPersona.sample_titles && currentPersona.sample_titles.length > 0 && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap bg-secondary/60 px-3 py-1.5 rounded-xl border border-border/70">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Você curtiu:</span>
              <span className="font-semibold text-foreground">
                {currentPersona.sample_titles.slice(0, 3).join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Spotlight Lead 16:9 (#1 Escolha para este Humor) */}
        {leadItem ? (
          <article
            className={cn(
              "relative min-h-[260px] sm:min-h-[340px] md:min-h-[380px] rounded-2xl overflow-hidden border border-border-strong bg-zinc-950 flex flex-col justify-end p-4 sm:p-6 md:p-8 isolate group shadow-xl transition-all duration-300",
              isLeadDismissing && "opacity-0 scale-95 pointer-events-none"
            )}
          >
            {/* Widescreen Backdrop */}
            <div className="absolute inset-0 -z-20">
              <PosterImage
                src={leadItem.backdrop_path}
                fallbackSrc={leadItem.poster_path}
                alt={leadTitle}
                title={leadTitle}
                type={leadMediaType}
                tmdbSize="w1280"
                priority
                className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            </div>

            {/* Scrim cinematográfico */}
            <div
              className="absolute inset-0 -z-10 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(6,10,20,0.18) 0%, rgba(6,10,20,0.68) 48%, rgba(6,10,20,0.96) 100%)",
              }}
            />

            {/* Topo do Spotlight */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 border border-white/20 backdrop-blur-md text-[11px] font-bold text-zinc-100">
                <span className="text-amber-400 font-extrabold">#1 ESCOLHA PARA ESTE HUMOR</span>
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-extrabold shadow-md">
                <Sparkles className="w-3 h-3" />
                {leadItem.match_score}% Match
              </span>
            </div>

            {/* Conteúdo Principal do Spotlight */}
            <div className="relative z-10 max-w-2xl text-white">
              <div className="flex items-center flex-wrap gap-2 text-xs text-zinc-300 font-medium mb-1.5">
                <span className="px-2 py-0.5 rounded-md bg-white/15 text-white text-[10px] font-bold uppercase tracking-wider">
                  {leadMediaType === "movie" ? "Filme" : "Série"}
                </span>
                {leadYear && <span>{leadYear}</span>}
                {leadGenres.length > 0 && (
                  <>
                    <span className="opacity-50">•</span>
                    <span className="truncate">{leadGenres.join(", ")}</span>
                  </>
                )}
              </div>

              <Link href={leadRoute} prefetch={false} className="block group/title">
                <h4 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight mb-2 group-hover/title:text-primary transition-colors line-clamp-2">
                  {leadTitle}
                </h4>
              </Link>

              {leadItem.overview && (
                <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 mb-3 leading-relaxed">
                  {leadItem.overview}
                </p>
              )}

              {leadItem.match_tags && leadItem.match_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {leadItem.match_tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-md font-medium border backdrop-blur-md",
                        isHighlightedTag(tag)
                          ? "bg-amber-500/20 text-amber-200 border-amber-500/35"
                          : "bg-white/10 text-zinc-100 border-white/15"
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <AddToListButton
                  tmdb_id={leadItem.id}
                  media_type={leadMediaType}
                  title={leadTitle}
                  poster_path={leadItem.poster_path}
                  backdrop_path={leadItem.backdrop_path}
                  showLabel
                  addLabel="+ Quero Assistir"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg"
                />

                <Link
                  href={leadRoute}
                  prefetch={false}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all"
                >
                  <span>Ver Detalhes</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={(e) => handleDismiss(leadItem, e)}
                  className="w-10 h-10 rounded-xl bg-black/60 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 border border-white/20 hover:border-rose-400/40 backdrop-blur-md inline-flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title="Não tenho interesse nesta sugestão (ocultar por 6 meses)"
                  aria-label="Não tenho interesse"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border">
            Você já explorou ou dispensou todas as sugestões ativas para esta faceta.
          </div>
        )}

        {/* Trilho Panorâmico das Demais Recomendações */}
        {secondaryItems.length > 0 && (
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" />
                Mais sugestões afinadas com {currentPersona.name}
              </span>

              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollSubRail(-1)}
                  className="w-8 h-8 rounded-lg bg-secondary/80 hover:bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer"
                  title="Voltar sugestões"
                  aria-label="Voltar sugestões"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollSubRail(1)}
                  className="w-8 h-8 rounded-lg bg-secondary/80 hover:bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer"
                  title="Avançar sugestões"
                  aria-label="Avançar sugestões"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Trilho Responsivo (Grid no Desktop / Snap-x no Mobile) */}
            <div
              ref={subRailRef}
              className="flex gap-3.5 overflow-x-auto hide-scrollbar snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 py-1"
            >
              {secondaryItems.map((item) => {
                const itemMediaType = (item.media_type === "tv" ? "tv" : "movie") as "movie" | "tv";
                const itemTitle = item.title || item.name || "Sem título";
                const itemRoute = itemMediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
                const itemYear = extractYear(item);
                const primaryTag = item.match_tags?.[0];
                const isItemDismissing = dismissedIds.has(item.id);

                return (
                  <article
                    key={`${itemMediaType}-${item.id}`}
                    className={cn(
                      "flex-[0_0_68%] sm:flex-[0_0_45%] lg:flex-[0_0_calc((100%-2.625rem)/4)] snap-start rounded-xl overflow-hidden border border-border bg-card-elevated hover:border-primary/60 transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-md",
                      isItemDismissing && "opacity-0 scale-95 pointer-events-none"
                    )}
                  >
                    <Link href={itemRoute} prefetch={false} className="block">
                      <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                        <PosterImage
                          src={item.backdrop_path}
                          fallbackSrc={item.poster_path}
                          alt={itemTitle}
                          title={itemTitle}
                          type={itemMediaType}
                          tmdbSize="w780"
                          className="transition-transform duration-400 ease-out group-hover:scale-105"
                        />
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[9.5px] font-bold uppercase tracking-wider">
                          {itemMediaType === "movie" ? "Filme" : "Série"}
                        </span>
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10.5px] font-extrabold shadow-sm">
                          {item.match_score}%
                        </span>
                      </div>

                      <div className="p-3 pb-1">
                        <h5 className="text-[13.5px] font-extrabold text-foreground truncate group-hover:text-primary transition-colors">
                          {itemTitle}
                        </h5>
                        <div className="text-[11px] text-muted-foreground truncate mb-1.5">
                          {itemYear && <span>{itemYear}</span>}
                        </div>

                        {primaryTag && (
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded font-medium truncate inline-block max-w-full border",
                              isHighlightedTag(primaryTag)
                                ? "bg-amber-500/15 text-amber-500 dark:text-amber-300 border-amber-500/30"
                                : "bg-secondary text-foreground border-border"
                            )}
                          >
                            {primaryTag}
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="p-3 pt-2 border-t border-border/50 flex items-center justify-between gap-2 mt-auto">
                      <span className="text-[11px] text-muted-foreground truncate">
                        Sintonia afinada
                      </span>
                      <div className="flex items-center gap-1.5">
                        <AddToListButton
                          tmdb_id={item.id}
                          media_type={itemMediaType}
                          title={itemTitle}
                          poster_path={item.poster_path}
                          backdrop_path={item.backdrop_path}
                        />
                        <button
                          type="button"
                          onClick={(e) => handleDismiss(item, e)}
                          className="w-8 h-8 rounded-lg bg-secondary/80 hover:bg-rose-500/15 text-muted-foreground hover:text-rose-400 border border-border hover:border-rose-500/30 inline-flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                          title="Não tenho interesse (ocultar por 6 meses)"
                          aria-label="Não tenho interesse"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
    </>
  );
});
