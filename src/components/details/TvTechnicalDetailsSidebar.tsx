"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Tv, Share2, CheckCircle2 } from "lucide-react";
import { NetworkItem, EpisodeItem, SeasonItem } from "@/types/details";
import { formatReleaseDate } from "@/lib/dateUtils";
import { useMyListStore } from "@/store/useMyListStore";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TvTechnicalDetailsSidebarProps {
  seriesId?: number;
  status: string;
  networks: NetworkItem[];
  nextEpisodeToAir: EpisodeItem | null;
  lastEpisodeToAir: EpisodeItem | null;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  seasons?: SeasonItem[];
}

export function TvTechnicalDetailsSidebar({
  seriesId,
  status,
  networks,
  nextEpisodeToAir,
  lastEpisodeToAir,
  numberOfSeasons,
  numberOfEpisodes,
  seasons,
}: TvTechnicalDetailsSidebarProps) {
  const episodeProgress = useMyListStore((state) =>
    seriesId ? state.episodeProgress[seriesId] : undefined
  );

  // Usa a soma das temporadas regulares se for maior que o contador agregado do TMDB (que pode ter delay de atualização)
  const effectiveTotalEpisodes = useMemo(() => {
    if (seasons && seasons.length > 0) {
      const regularSeasonsTotal = seasons
        .filter((s) => s.season_number > 0)
        .reduce((acc, s) => acc + (s.episode_count || 0), 0);
      if (regularSeasonsTotal > 0) {
        return Math.max(regularSeasonsTotal, numberOfEpisodes);
      }
    }
    return numberOfEpisodes;
  }, [seasons, numberOfEpisodes]);

  // Calcula o total deduplicado de episódios assistidos na série toda
  const totalWatchedEpisodes = useMemo(() => {
    if (!episodeProgress || episodeProgress.length === 0) return 0;
    const set = new Set<string>();
    episodeProgress.forEach((p) => {
      set.add(`${p.season_number}_${p.episode_number}`);
    });
    return set.size;
  }, [episodeProgress]);

  const completionPct =
    effectiveTotalEpisodes > 0
      ? Math.min(100, Math.round((totalWatchedEpisodes / effectiveTotalEpisodes) * 100))
      : 0;

  const isSeriesEnded = status === "Ended" || status === "Canceled";
  const isAllCompleted = effectiveTotalEpisodes > 0 && totalWatchedEpisodes >= effectiveTotalEpisodes;

  // Tradução dos status de séries
  const statusTranslations: Record<string, string> = {
    "Returning Series": "Em Exibição (Renovada)",
    Ended: "Série Finalizada",
    Canceled: "Cancelada",
    "In Production": "Em Produção",
    Planned: "Planejada",
    Pilot: "Piloto",
  };
  const translatedStatus = statusTranslations[status] || status;

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href);
          toast.add({
            title: "Link copiado!",
            description: "O link desta série foi copiado para a área de transferência.",
            type: "success",
          });
        }
      } catch {
        toast.add({
          title: "Não foi possível copiar o link",
          type: "error",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Widget de Progresso Geral da Série */}
      {seriesId && effectiveTotalEpisodes > 0 && (
        <aside className="bg-card text-card-foreground p-5 rounded-2xl border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground">Seu Progresso na Série</h3>
            {isAllCompleted ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{isSeriesEnded ? "100% Concluída" : "Em dia"}</span>
              </span>
            ) : totalWatchedEpisodes > 0 ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                {completionPct}%
              </span>
            ) : (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                Não iniciada
              </span>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
              <span className="text-muted-foreground">Episódios assistidos</span>
              <span className="font-bold text-foreground">
                {totalWatchedEpisodes} de {effectiveTotalEpisodes}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border/40">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isAllCompleted ? "bg-emerald-500" : "bg-primary"
                )}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </aside>
      )}

      {/* Detalhes Técnicos & Emissoras */}
      <aside className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-xs space-y-5">
        <h3 className="font-bold text-base border-b border-border pb-3 flex items-center justify-between text-foreground">
          <span>Ficha Técnica</span>
          <span className="text-xs text-muted-foreground font-normal">Informações da Série</span>
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-semibold text-muted-foreground mb-1">Status</h4>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-xs border",
                status === "Ended"
                  ? "bg-muted text-foreground border-border"
                  : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              )}
            >
              {translatedStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <div>
              <h4 className="font-semibold text-muted-foreground mb-0.5">Temporadas</h4>
              <p className="font-bold text-foreground text-sm">{numberOfSeasons}</p>
            </div>
            <div>
              <h4 className="font-semibold text-muted-foreground mb-0.5">Total de Episódios</h4>
              <p className="font-bold text-foreground text-sm">{numberOfEpisodes}</p>
            </div>
          </div>

          {/* Redes / Emissoras sem duplicidade */}
          {networks && networks.length > 0 && (
            <div className="pt-3 border-t border-border">
              <h4 className="font-semibold text-muted-foreground mb-3">Redes / Emissoras</h4>
              <div className="space-y-2">
                {networks.map((network) => (
                  <div
                    key={network.id}
                    className="flex items-center gap-3 p-2 rounded-xl bg-muted/40 border border-border/60"
                  >
                    {network.logo_path ? (
                      <div className="bg-white p-1 rounded-lg flex-shrink-0 flex items-center justify-center w-9 h-9 overflow-hidden shadow-2xs">
                        <Image
                          src={`https://image.tmdb.org/t/p/w200${network.logo_path}`}
                          alt={network.name}
                          width={36}
                          height={36}
                          className="object-contain max-h-full max-w-full"
                          style={{ width: "auto", height: "auto" }}
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Tv className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-xs font-semibold text-foreground leading-tight">
                      {network.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Próximo Episódio a ir ao ar */}
          {nextEpisodeToAir && (
            <div className="pt-3 border-t border-border space-y-1">
              <h4 className="font-bold text-emerald-500">Próximo Episódio</h4>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="font-bold text-xs text-foreground">{nextEpisodeToAir.name}</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  T{nextEpisodeToAir.season_number} E{nextEpisodeToAir.episode_number}
                  {nextEpisodeToAir.air_date ? ` • ${formatReleaseDate(nextEpisodeToAir.air_date)}` : ""}
                </p>
              </div>
            </div>
          )}

          {/* Último Episódio Lançado */}
          {lastEpisodeToAir && (
            <div className="pt-3 border-t border-border space-y-1">
              <h4 className="font-semibold text-muted-foreground">Último Episódio Exibido</h4>
              <div className="p-3 bg-muted/40 border border-border/60 rounded-xl">
                <p className="font-bold text-xs text-foreground">{lastEpisodeToAir.name}</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  T{lastEpisodeToAir.season_number} E{lastEpisodeToAir.episode_number}
                  {lastEpisodeToAir.air_date ? ` • ${formatReleaseDate(lastEpisodeToAir.air_date)}` : ""}
                </p>
              </div>
            </div>
          )}

          {/* Botão de Compartilhar */}
          <div className="pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="w-full gap-2 rounded-xl text-xs font-semibold cursor-pointer border-border hover:bg-accent"
            >
              <Share2 className="w-3.5 h-3.5 text-primary" />
              <span>Compartilhar Série</span>
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
