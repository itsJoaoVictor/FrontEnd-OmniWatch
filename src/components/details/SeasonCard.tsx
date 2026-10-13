"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronUp, PlayCircle, CheckCircle2, Circle, Star, Clock } from "lucide-react";
import { SeasonItem, EpisodeItem, SeasonDetailsResponse } from "@/types/details";
import { api } from "@/lib/axios";
import { useMyListStore } from "@/store/useMyListStore";

import { hasMissingPreviousEpisodes } from "@/lib/utils";
import { toast } from '@/components/ui/toast';
import { formatReleaseDate, isFutureDate, parseReleaseDate } from "@/lib/dateUtils";

interface SeasonCardProps {
  season: SeasonItem;
  seriesId: number;
  fallbackPosterPath?: string | null;
}

export function SeasonCard({ season, seriesId, fallbackPosterPath }: SeasonCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingSeason, setMarkingSeason] = useState(false);
  
  const episodeProgress = useMyListStore(state => state.episodeProgress[seriesId]);
  const toggleEpisode = useMyListStore(state => state.toggleEpisode);
  const toggleSeason = useMyListStore(state => state.toggleSeason);

  const posterUrl = "https://image.tmdb.org/t/p/w185";
  const stillUrl = "https://image.tmdb.org/t/p/w300";

  const imagePath = season.poster_path ?? fallbackPosterPath ?? null;
  const isUpcoming = !season.air_date || isFutureDate(season.air_date);

  const watchedInSeason = (episodeProgress || []).filter(
    p => p.season_number === season.season_number
  ).length;

  const releasedEpisodesCount = episodes.length > 0
    ? episodes.filter(ep => ep.air_date && !isFutureDate(ep.air_date)).length
    : season.episode_count;

  const isSeasonWatched = releasedEpisodesCount > 0 && watchedInSeason >= releasedEpisodesCount;
  const progressPercent = season.episode_count > 0
    ? Math.min(100, Math.round((watchedInSeason / season.episode_count) * 100))
    : 0;

  const handleToggleSeason = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (markingSeason || isUpcoming || season.episode_count === 0) return;

    const targetWatched = !isSeasonWatched;
    setMarkingSeason(true);
    try {
      await toggleSeason(seriesId, season.season_number, releasedEpisodesCount || season.episode_count, targetWatched);
      if (targetWatched && season.season_number > 1) {
        let progress = useMyListStore.getState().episodeProgress[seriesId];
        if (!progress) {
          await useMyListStore.getState().fetchProgress(seriesId);
          progress = useMyListStore.getState().episodeProgress[seriesId];
        }
        if (hasMissingPreviousEpisodes(progress, season.season_number, 1)) {
          if (window.confirm(`Você marcou a ${season.name}. Deseja marcar também todas as temporadas anteriores como assistidas?`)) {
            await useMyListStore.getState().bulkMarkEpisodes(seriesId, season.season_number, season.episode_count);
          }
        }
      }
    } finally {
      setMarkingSeason(false);
    }
  };

  const toggleExpand = async () => {
    if (!expanded && episodes.length === 0) {
      setLoading(true);
      try {
        const response = await api.get<SeasonDetailsResponse>(`/api/tv/${seriesId}/season/${season.season_number}`);
        setEpisodes(response.data.episodes || []);
      } catch (error) {
        console.error("Error fetching episodes", error);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  return (
    <div className="bg-muted/30 rounded-lg overflow-hidden flex flex-col">
      {/* Header / Season Info */}
      <div 
        className="flex flex-col md:flex-row gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={toggleExpand}
      >
        <div className="flex-shrink-0 w-[120px] aspect-[2/3] relative rounded-md overflow-hidden bg-muted">
          {imagePath ? (
            <Image
              src={`${posterUrl}${imagePath}`}
              alt={season.name}
              fill
              className="object-cover"
              sizes="120px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center px-2">
              Sem Foto
            </div>
          )}
          {isUpcoming && !season.poster_path && (
            <div className="absolute inset-0 flex items-end justify-center pb-2">
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                Em Breve
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h4 className="text-xl font-bold mb-1">{season.name}</h4>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-2">
                {season.air_date ? (
                  <>
                    <span>{parseReleaseDate(season.air_date).getFullYear()}</span>
                    <span>•</span>
                  </>
                ) : (
                  <span className="text-primary font-medium">Data a confirmar</span>
                )}
                <span>{season.episode_count} episódios</span>
                {watchedInSeason > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-primary font-medium">
                      {watchedInSeason}/{season.episode_count} assistidos
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {!isUpcoming && season.episode_count > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSeason}
                  disabled={markingSeason}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    isSeasonWatched
                      ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
                      : "bg-background/60 text-muted-foreground border-muted hover:text-foreground hover:bg-background"
                  } disabled:opacity-50`}
                  title={isSeasonWatched ? "Desmarcar temporada como assistida" : "Marcar temporada toda como assistida"}
                >
                  {markingSeason ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isSeasonWatched ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isSeasonWatched ? "Temporada assistida" : "Marcar temporada"}
                  </span>
                </button>
              )}
              {expanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
            </div>
          </div>

          {watchedInSeason > 0 && season.episode_count > 0 && (
            <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Episodes List */}
      {expanded && (
        <div className="p-4 pt-0 border-t border-muted">
          {loading ? (
            <div className="py-8 flex justify-center items-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 mt-4">

              {episodes.map((episode) => {
                const epProg = (episodeProgress || []).find(
                  p => p.season_number === season.season_number && p.episode_number === episode.episode_number
                );
                const isWatched = !!epProg;
                const rating = epProg?.rating;
                
                return (
                  <div key={episode.id} className="flex gap-2 items-stretch bg-background/40 rounded-md hover:bg-background/60 transition-colors group">
                    <Link
                      href={`/tv/${seriesId}/season/${season.season_number}/episode/${episode.episode_number}`}
                      className="flex-1 flex flex-col md:flex-row gap-4 p-3 cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-full md:w-[200px] aspect-video relative rounded-md overflow-hidden bg-muted">
                        {episode.still_path ? (
                          <Image
                            src={`${stillUrl}${episode.still_path}`}
                            alt={episode.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, 200px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground group-hover:bg-muted/80 transition-colors">
                            <PlayCircle size={32} opacity={0.5} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {episode.episode_number}. {episode.name}
                          </h5>
                          <div className="flex items-center gap-2">
                            {rating !== undefined && rating !== null && (
                              <span className="flex items-center gap-1 text-xs text-yellow-400 font-semibold bg-yellow-400/10 px-1.5 py-0.5 rounded" title="Sua nota neste episódio">
                                <Star className="w-3 h-3 fill-yellow-400" />
                                {rating.toFixed(1)}
                              </span>
                            )}
                            {episode.runtime && (
                              <span className="text-xs text-gray-400 whitespace-nowrap">{episode.runtime} min</span>
                            )}
                          </div>
                        </div>
                        {episode.air_date && (
                          <span className="text-xs text-gray-500 mb-2">
                            {formatReleaseDate(episode.air_date)}
                          </span>
                        )}
                        <p className="text-sm text-gray-400 line-clamp-3">
                          {episode.overview || "Nenhuma sinopse disponível para este episódio."}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center justify-center pr-4">
                      {(!episode.air_date || isFutureDate(episode.air_date)) && !isWatched ? (
                        <div 
                          className="flex items-center gap-1.5 text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full whitespace-nowrap select-none"
                          title={`Estreia em ${episode.air_date ? formatReleaseDate(episode.air_date) : 'Data a definir'}`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Não lançado</span>
                        </div>
                      ) : (
                        <button 
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await toggleEpisode(seriesId, season.season_number, episode.episode_number, !isWatched);
                            if (!isWatched && (season.season_number > 1 || episode.episode_number > 1)) {
                              let progress = useMyListStore.getState().episodeProgress[seriesId];
                              if (!progress) {
                                await useMyListStore.getState().fetchProgress(seriesId);
                                progress = useMyListStore.getState().episodeProgress[seriesId];
                              }
                              if (hasMissingPreviousEpisodes(progress, season.season_number, episode.episode_number)) {
                                if (window.confirm(`Você marcou o episódio ${episode.episode_number}. Deseja marcar todos os anteriores da série como assistidos?`)) {
                                  useMyListStore.getState().bulkMarkEpisodes(seriesId, season.season_number, episode.episode_number);
                                }
                              }
                            }
                          }}
                          className="p-2 rounded-full hover:bg-muted/50 transition-colors"
                          title={isWatched ? "Desmarcar como assistido" : "Marcar como assistido"}
                        >
                          {isWatched ? (
                            <CheckCircle2 className="text-primary w-6 h-6" />
                          ) : (
                            <Circle className="text-muted-foreground w-6 h-6" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {episodes.length === 0 && !loading && (
                <p className="text-gray-400 text-center py-4">Nenhum episódio encontrado.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
