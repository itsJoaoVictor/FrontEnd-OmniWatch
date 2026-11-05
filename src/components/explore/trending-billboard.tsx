"use client";

import { memo, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Flame,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingItem } from "@/types/trending";
import { PosterImage } from "@/components/shared/PosterImage";
import { AddToListButton } from "@/components/shared/AddToListButton";

interface TrendingBillboardProps {
  items: TrendingItem[];
}

function extractYear(item: TrendingItem): string {
  const raw = item.release_date || item.first_air_date || "";
  return raw.length >= 4 ? raw.slice(0, 4) : "";
}

function getHypeLabel(rank: number, item: TrendingItem): string {
  if (rank === 1) return "🔥 #1 em Alta no Brasil";
  if (rank === 2) return "⚡ Fenômeno Viral";
  if (rank === 3) return "⭐ Aclamação Popular";
  if (item.popularity > 600) return "🔥 Alta Repercussão";
  if (item.vote_average >= 8.0) return "🌟 Mais Bem Avaliado";
  return "📈 Em Alta";
}

export const TrendingBillboard = memo(function TrendingBillboard({
  items,
}: TrendingBillboardProps) {
  const [mediaFilter, setMediaFilter] = useState<"all" | "movie" | "tv">("all");
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Filtra e limita ao Top 10 da categoria selecionada
  const top10Items = useMemo(() => {
    let list = items;
    if (mediaFilter === "movie") {
      list = items.filter((i) => i.media_type === "movie");
    } else if (mediaFilter === "tv") {
      list = items.filter((i) => i.media_type === "tv");
    }
    return list.slice(0, 10);
  }, [items, mediaFilter]);

  const movieCount = useMemo(
    () => items.filter((i) => i.media_type === "movie").length,
    [items]
  );
  const tvCount = useMemo(
    () => items.filter((i) => i.media_type === "tv").length,
    [items]
  );

  const scrollTrack = useCallback((direction: -1 | 1) => {
    if (!trackRef.current) return;
    const step = Math.max(260, Math.round(trackRef.current.clientWidth * 0.72));
    trackRef.current.scrollBy({ left: direction * step, behavior: "smooth" });
  }, []);

  return (
    <section className="mb-12 flex flex-col gap-5">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2.5 text-foreground">
            <span>🔥 Em Alta (Tendências do Momento)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 font-bold">
              Top 10 Brasil
            </span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            As obras mais assistidas, comentadas e aclamadas no cinema e no streaming esta semana.
          </p>
        </div>

        {/* Controles de Topo: Filtro por Categoria + Setas do Trilho */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/80 border border-border shadow-xs">
            <button
              type="button"
              onClick={() => setMediaFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                mediaFilter === "all"
                  ? "bg-background text-primary shadow-xs border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Top 10 Geral
            </button>
            <button
              type="button"
              onClick={() => setMediaFilter("movie")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                mediaFilter === "movie"
                  ? "bg-background text-primary shadow-xs border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              🎬 Filmes ({movieCount})
            </button>
            <button
              type="button"
              onClick={() => setMediaFilter("tv")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                mediaFilter === "tv"
                  ? "bg-background text-primary shadow-xs border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              📺 Séries ({tvCount})
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 ml-1">
            <button
              type="button"
              onClick={() => scrollTrack(-1)}
              className="w-8 h-8 rounded-lg bg-secondary/80 hover:bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer"
              title="Voltar no ranking"
              aria-label="Voltar no ranking"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollTrack(1)}
              className="w-8 h-8 rounded-lg bg-secondary/80 hover:bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer"
              title="Avançar no ranking"
              aria-label="Avançar no ranking"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Trilho Panorâmico Billboard Top 10 */}
      <div
        ref={trackRef}
        className="flex items-stretch overflow-x-auto scroll-smooth snap-x snap-mandatory gap-3.5 -mx-4 px-4 sm:mx-0 sm:px-0 py-2 hide-scrollbar cursor-grab active:cursor-grabbing"
      >
        {top10Items.map((item, idx) => {
          const rank = idx + 1;
          const displayTitle = item.title || item.name || "Sem título";
          const mediaType = (item.media_type === "tv" ? "tv" : "movie") as "movie" | "tv";
          const route = mediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
          const year = extractYear(item);
          const hypeLabel = getHypeLabel(rank, item);

          const isRank1 = rank === 1;
          const isRank2 = rank === 2;
          const isRank3 = rank === 3;

          return (
            <article
              key={`${mediaType}-${item.id}`}
              className="flex-[0_0_68%] sm:flex-[0_0_248px] snap-start rounded-2xl border border-border bg-card hover:border-primary/60 transition-all duration-200 flex flex-row overflow-hidden group shadow-md hover:shadow-xl hover:-translate-y-1"
            >
              {/* Coluna com o Número Gigante Tipográfico */}
              <div
                className={cn(
                  "w-16 sm:w-[72px] shrink-0 flex items-center justify-center border-r border-border select-none relative",
                  isRank1
                    ? "bg-gradient-to-b from-amber-500/15 via-transparent to-transparent"
                    : isRank2
                    ? "bg-gradient-to-b from-zinc-300/15 via-transparent to-transparent"
                    : isRank3
                    ? "bg-gradient-to-b from-amber-700/15 via-transparent to-transparent"
                    : "bg-gradient-to-b from-primary/10 via-transparent to-transparent"
                )}
              >
                <span
                  className={cn(
                    "font-mono font-black text-6xl sm:text-7xl leading-none tracking-tighter select-none",
                    isRank1
                      ? "text-transparent [-webkit-text-stroke:2.5px_#f59e0b] drop-shadow-[0_4px_16px_rgba(245,158,11,0.45)]"
                      : isRank2
                      ? "text-transparent [-webkit-text-stroke:2.5px_#cbd5e1] drop-shadow-[0_4px_12px_rgba(203,213,225,0.3)]"
                      : isRank3
                      ? "text-transparent [-webkit-text-stroke:2.5px_#d97706] drop-shadow-[0_4px_12px_rgba(217,119,6,0.3)]"
                      : "text-transparent [-webkit-text-stroke:2px_rgba(var(--primary-rgb),0.65)]"
                  )}
                >
                  {rank}
                </span>
              </div>

              {/* Corpo do Card: Pôster + Metadados + Botão */}
              <div className="flex-1 min-w-0 p-2.5 sm:p-3 flex flex-col justify-between gap-2">
                <Link href={route} prefetch={false} className="block group/link">
                  {/* Pôster 2:3 */}
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-950 mb-2 border border-border/50">
                    <PosterImage
                      src={item.poster_path}
                      fallbackSrc={item.backdrop_path}
                      alt={displayTitle}
                      title={displayTitle}
                      type={mediaType}
                      tmdbSize="w342"
                      className="transition-transform duration-500 ease-out group-hover:scale-105"
                    />

                    {/* Badge Tipo no topo */}
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider">
                      {mediaType === "movie" ? "Filme" : "Série"}
                    </span>

                    {/* Nota Estrelas na base */}
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/85 backdrop-blur-md text-amber-400 border border-amber-400/30 text-[10.5px] font-extrabold flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {(item.vote_average / 2).toFixed(1)}
                    </span>
                  </div>

                  {/* Título e Ano */}
                  <h4 className="text-xs sm:text-[13.5px] font-extrabold text-foreground truncate mb-0.5 group-hover/link:text-primary transition-colors">
                    {displayTitle}
                  </h4>
                  <div className="text-[10.5px] text-muted-foreground truncate mb-1">
                    {year && <span>{year}</span>}
                  </div>

                  {/* Selo de Hype Cultural */}
                  <span
                    className={cn(
                      "inline-block text-[9.5px] font-bold px-1.5 py-0.5 rounded-md truncate max-w-full border",
                      isRank1
                        ? "bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30"
                        : "bg-primary/10 text-primary border-primary/25"
                    )}
                  >
                    {hypeLabel}
                  </span>
                </Link>

                {/* Botão de Adicionar à Lista */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-1 mt-auto">
                  <span className="text-[10px] text-muted-foreground truncate">
                    #{rank} no Ranking
                  </span>
                  <AddToListButton
                    tmdb_id={item.id}
                    media_type={mediaType}
                    title={displayTitle}
                    poster_path={item.poster_path}
                    backdrop_path={item.backdrop_path}
                    release_date={item.release_date || item.first_air_date}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
});
