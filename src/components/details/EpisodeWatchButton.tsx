"use client";

import { useMyListStore } from "@/store/useMyListStore";
import { CheckCircle2, Circle, Clock, RotateCcw, Plus, Minus } from "lucide-react";
import { hasMissingPreviousEpisodes } from "@/lib/utils";

interface EpisodeWatchButtonProps {
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
  airDate?: string | null;
}

export function EpisodeWatchButton({ seriesId, seasonNumber, episodeNumber, airDate }: EpisodeWatchButtonProps) {
  const episodeProgress = useMyListStore(state => state.episodeProgress[seriesId]);
  const toggleEpisode = useMyListStore(state => state.toggleEpisode);
  const updateEpisodeRewatch = useMyListStore(state => state.updateEpisodeRewatch);

  const epProg = (episodeProgress || []).find(
    p => p.season_number === seasonNumber && p.episode_number === episodeNumber
  );
  const isWatched = !!epProg;
  const rewatchCount = epProg?.rewatch_count || 0;

  const isReleased = airDate ? new Date(airDate) <= new Date() : true;

  if (!isReleased && !isWatched) {
    const formattedDate = airDate ? new Date(airDate).toLocaleDateString('pt-BR') : 'Indefinida';
    return (
      <div 
        className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-amber-400/90 bg-amber-500/10 border border-amber-500/20 cursor-not-allowed select-none"
        title={`Este episódio estreia em ${formattedDate}`}
      >
        <Clock size={18} />
        <span>Estreia em {formattedDate}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={async () => {
          await toggleEpisode(seriesId, seasonNumber, episodeNumber, !isWatched);
          if (!isWatched && (seasonNumber > 1 || episodeNumber > 1)) {
            let progress = useMyListStore.getState().episodeProgress[seriesId];
            if (!progress) {
              await useMyListStore.getState().fetchProgress(seriesId);
              progress = useMyListStore.getState().episodeProgress[seriesId];
            }
            if (hasMissingPreviousEpisodes(progress, seasonNumber, episodeNumber)) {
              if (window.confirm(`Você marcou o episódio ${episodeNumber}. Deseja marcar todos os anteriores da série como assistidos?`)) {
                useMyListStore.getState().bulkMarkEpisodes(seriesId, seasonNumber, episodeNumber);
              }
            }
          }
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors ${
          isWatched 
            ? "bg-primary/20 text-primary hover:bg-primary/30" 
            : "bg-muted hover:bg-muted/80 text-foreground"
        }`}
      >
        {isWatched ? (
          <>
            <CheckCircle2 size={20} />
            <span>Assistido</span>
          </>
        ) : (
          <>
            <Circle size={20} />
            <span>Marcar como Assistido</span>
          </>
        )}
      </button>

      {isWatched && (
        rewatchCount === 0 ? (
          <button
            type="button"
            onClick={() => updateEpisodeRewatch(seriesId, seasonNumber, episodeNumber, 1)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md font-semibold text-sm bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
            title="Marcar este episódio como reassistido"
          >
            <RotateCcw size={16} />
            <span>Marcar como Reassistido</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <RotateCcw size={15} className="mr-0.5" />
            <span className="text-xs font-semibold mr-1">
              Reassistido {rewatchCount}x
            </span>
            <button
              type="button"
              onClick={() => updateEpisodeRewatch(seriesId, seasonNumber, episodeNumber, rewatchCount - 1)}
              className="w-6 h-6 rounded flex items-center justify-center bg-black/40 hover:bg-black/70 text-emerald-300 transition-colors"
              title="Diminuir contagem de reassistido"
            >
              <Minus size={13} />
            </button>
            <button
              type="button"
              onClick={() => updateEpisodeRewatch(seriesId, seasonNumber, episodeNumber, rewatchCount + 1)}
              className="w-6 h-6 rounded flex items-center justify-center bg-black/40 hover:bg-black/70 text-emerald-300 transition-colors"
              title="Adicionar mais uma revisão"
            >
              <Plus size={13} />
            </button>
          </div>
        )
      )}
    </div>
  );
}
