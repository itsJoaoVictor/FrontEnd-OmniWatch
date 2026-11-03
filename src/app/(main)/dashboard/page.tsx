'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { HeroBanner } from "@/components/home/HeroBanner";
import { TvQueueAccordion } from "@/components/home/TvQueueAccordion";
import { ContinueWatchingTickets } from "@/components/home/ContinueWatchingTickets";
import { ReleaseRadarTimeline } from "@/components/home/ReleaseRadarTimeline";
import { MoviesQueueInspector } from "@/components/home/MoviesQueueInspector";
import { useMyListStore } from '@/store/useMyListStore';
import { MediaItem } from "@/components/home/MediaCard";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { UserPlus, ArrowRight } from 'lucide-react';
import { useFriendsStore } from '@/store/useFriendsStore';
import {
  getUpToDateShowsFromCache,
  saveUpToDateShowsToCache,
  getCorrectedEpisodesFromCache,
  saveCorrectedEpisodesToCache,
  fetchAndCacheSeasonEpisodes,
} from '@/lib/seriesCache';
import { parseReleaseDate, isFutureDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

// Cache em memória para trending no Dashboard para evitar refetch redundante
let cachedTrendingResults: any[] | null = null;
let inFlightTrendingPromise: Promise<any[]> | null = null;

export default function HomePage() {
  const { items, isLoading, fetchMyList, episodeProgress, fetchProgress } = useMyListStore();
  const pendingCount = useFriendsStore((state) => state.pendingCount);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'all' | 'watching' | 'movies' | 'tv' | 'upcoming'>('all');
  const fetchedProgressRef = useRef(new Set<number>());

  useEffect(() => {
    setIsMounted(true);
    fetchMyList('watching,plan_to_watch,upcoming');
  }, [fetchMyList]);

  useEffect(() => {
    const tvWatching = Object.values(items).filter(i => i && i.status === 'watching' && i.media_type === 'tv' && i.tmdb_id);
    tvWatching.forEach(item => {
      // Se o backend já calculou is_up_to_date ou next_episode, não precisamos disparar chamadas individuais
      if (item.is_up_to_date !== null && item.is_up_to_date !== undefined) return;
      if (!episodeProgress[item.tmdb_id] && !fetchedProgressRef.current.has(item.tmdb_id)) {
        fetchedProgressRef.current.add(item.tmdb_id);
        fetchProgress(item.tmdb_id);
      }
    });
  }, [items, episodeProgress, fetchProgress]);

  const [priorityHeroId, setPriorityHeroId] = useState<number | null>(null);
  const [trendingPlanToWatchId, setTrendingPlanToWatchId] = useState<number | null>(null);
  const [correctedNextEpisodes, setCorrectedNextEpisodes] = useState<Record<number, {season: number, episode: number}>>(() => getCorrectedEpisodesFromCache());
  const [upToDateShows, setUpToDateShows] = useState<Set<number>>(() => getUpToDateShowsFromCache());
  const [verifiedShows, setVerifiedShows] = useState<Set<number>>(() => getUpToDateShowsFromCache());

  useEffect(() => {
    const checkNewEpisodes = async () => {
      const tvWatching = Object.values(items).filter(i => i && i.status === 'watching' && i.media_type === 'tv' && i.tmdb_id);
      
      tvWatching.sort((a, b) => {
        const dateA = a.last_watched_at ? new Date(a.last_watched_at).getTime() : 0;
        const dateB = b.last_watched_at ? new Date(b.last_watched_at).getTime() : 0;
        return dateB - dateA;
      });
      
      let foundPriority = false;
      const newCorrections: Record<number, {season: number, episode: number}> = {};
      const newUpToDate = new Set<number>();
      const newlyVerified = new Set<number>(verifiedShows);
      
      for (const item of tvWatching) {
        // Se o backend já calculou e forneceu is_up_to_date, aproveitamos diretamente sem chamada extra
        if (item.is_up_to_date === true) {
          newUpToDate.add(item.tmdb_id);
          newlyVerified.add(item.tmdb_id);
          if (item.next_episode?.season_number && item.next_episode?.episode_number) {
            newCorrections[item.tmdb_id] = {
              season: item.next_episode.season_number,
              episode: item.next_episode.episode_number,
            };
          }
          continue;
        } else if (item.is_up_to_date === false) {
          newlyVerified.add(item.tmdb_id);
          if (item.next_episode?.season_number && item.next_episode?.episode_number) {
            newCorrections[item.tmdb_id] = {
              season: item.next_episode.season_number,
              episode: item.next_episode.episode_number,
            };
          }
          continue;
        }

        const prog = episodeProgress[item.tmdb_id];
        if (!prog) {
          // Se o progresso da série ainda está sendo carregado, mas ela já constava no cache como upToDate,
          // preserva para evitar que ela apareça temporariamente enquanto a API responde.
          if (upToDateShows.has(item.tmdb_id)) {
            newUpToDate.add(item.tmdb_id);
          }
          continue;
        }

        let maxSeason = 0;
        let maxEp = 0;
        for (const ep of prog) {
          if (ep.season_number > maxSeason) {
            maxSeason = ep.season_number;
            maxEp = ep.episode_number;
          } else if (ep.season_number === maxSeason && ep.episode_number > maxEp) {
            maxEp = ep.episode_number;
          }
        }
        
        let nextSeason = maxSeason || 1;
        let nextEpNum = maxSeason ? maxEp + 1 : 1;

        try {
          // Usa cache compartilhado de temporadas (evita chamadas duplicadas e alimenta ContinueWatchingTickets)
          let episodes = (await fetchAndCacheSeasonEpisodes(item.tmdb_id, nextSeason)) || [];
          const maxEpInSeason = episodes.reduce(
            (m, e) => Math.max(m, e.episode_number || 0),
            episodes.length
          );

          // Se ultrapassou o último episódio da temporada atual, faz rollover para a próxima temporada
          if (episodes.length > 0 && nextEpNum > maxEpInSeason) {
            nextSeason += 1;
            nextEpNum = 1;
            episodes = (await fetchAndCacheSeasonEpisodes(item.tmdb_id, nextSeason)) || [];
            if (episodes.length > 0) {
              newCorrections[item.tmdb_id] = { season: nextSeason, episode: nextEpNum };
            }
          }

          newlyVerified.add(item.tmdb_id);

          const epData = episodes.find((e: any) => e.episode_number === nextEpNum);
          
          if (!epData) {
            newUpToDate.add(item.tmdb_id);
          } else if (epData.air_date) {
            const airDate = parseReleaseDate(epData.air_date);
            const now = new Date();
            const diffHours = (now.getTime() - airDate.getTime()) / (1000 * 60 * 60);
            
            if (airDate > now) {
              newUpToDate.add(item.tmdb_id);
            }
            
            if (!foundPriority && diffHours >= -24 && diffHours <= 48) {
              setPriorityHeroId(item.tmdb_id);
              foundPriority = true;
            }
          } else {
            // Se o episódio existe mas não tem data, assumimos que ainda vai lançar (Up to date)
            newUpToDate.add(item.tmdb_id);
          }
        } catch (e) {
          newlyVerified.add(item.tmdb_id);
        }
      }
      
      if (Object.keys(newCorrections).length > 0) {
        setCorrectedNextEpisodes(prev => {
          const updated = { ...prev, ...newCorrections };
          saveCorrectedEpisodesToCache(updated);
          return updated;
        });
      }
      setUpToDateShows(newUpToDate);
      saveUpToDateShowsToCache(newUpToDate);
      setVerifiedShows(newlyVerified);
    };
    
    if (Object.keys(items).length > 0) {
      checkNewEpisodes();
    }
  }, [episodeProgress, items]);

  useEffect(() => {
    const checkTrendingPlanToWatch = async () => {
      const planToWatchItems = Object.values(items).filter(i => i && i.status === 'plan_to_watch' && i.tmdb_id);
      if (planToWatchItems.length === 0) return;

      try {
        let trendingItems = cachedTrendingResults;
        if (!trendingItems) {
          if (!inFlightTrendingPromise) {
            inFlightTrendingPromise = (async () => {
              const { api } = await import('@/lib/axios');
              const res = await api.get('/api/trending');
              const results = res.data.results || [];
              cachedTrendingResults = results;
              return results;
            })().finally(() => {
              inFlightTrendingPromise = null;
            });
          }
          trendingItems = await inFlightTrendingPromise;
        }

        for (const trending of (trendingItems || [])) {
          const match = planToWatchItems.find(i => i.tmdb_id === trending.id);
          if (match) {
            setTrendingPlanToWatchId(match.tmdb_id);
            break;
          }
        }
      } catch (e) {
        // Ignore
      }
    };
    
    if (Object.keys(items).length > 0) {
      checkTrendingPlanToWatch();
    }
  }, [items]);

  // Derived state from store
    const { heroFeature, spotlights, continueWatching, moviesInQueue, tvInQueue, upcomingMedia } = useMemo(() => {
    const itemsArray = Object.values(items).filter(i => i && (i.tmdb_id || i.id));
    
    let watchingItems = itemsArray.filter(i => i.status === 'watching');
    watchingItems.sort((a, b) => {
      const dateA = a.last_watched_at ? new Date(a.last_watched_at).getTime() : 0;
      const dateB = b.last_watched_at ? new Date(b.last_watched_at).getTime() : 0;
      return dateB - dateA; // Most recent first
    });

    const activeWatchingItems = watchingItems.filter(i => {
      // Regra 1: Nunca exibir séries que estão em dia
      if (i.is_up_to_date === true) return false;
      if (i.media_type === 'tv') {
        if (i.next_episode?.is_released === false) return false;
        if (i.next_episode?.air_date && isFutureDate(i.next_episode.air_date)) return false;
        if (i.is_up_to_date === false) return true;
        if (upToDateShows.has(i.tmdb_id)) return false;
        return verifiedShows.has(i.tmdb_id);
      }
      return true;
    });
    
    // Pick the hero
    let hero = null;
    let heroReason = '';
    
    if (priorityHeroId && items[priorityHeroId]) {
      hero = items[priorityHeroId];
      heroReason = 'new_episode';
    } else if (trendingPlanToWatchId && items[trendingPlanToWatchId]) {
      hero = items[trendingPlanToWatchId];
      heroReason = 'trending_plan_to_watch';
    } else if (activeWatchingItems.length > 0) {
      hero = activeWatchingItems[0];
      heroReason = 'continue_watching';
    } else {
      hero = itemsArray.find(i => i.status === 'plan_to_watch') || itemsArray.find(i => i.status === 'upcoming') || itemsArray[0];
      heroReason = hero?.status === 'upcoming' ? 'upcoming' : 'suggestion';
    }

    const mapToMediaItem = (i: any): MediaItem => {
      let currentEpisode = null;
      let nextEpisodeToWatch = undefined;
      const isUpToDate = i.is_up_to_date === true || upToDateShows.has(i.tmdb_id);

      if (i.media_type === 'tv' && i.status === 'watching') {
        if (isUpToDate) {
          currentEpisode = `Você está em dia!`;
          nextEpisodeToWatch = undefined;
        } else if (i.next_episode && i.next_episode.season_number && i.next_episode.episode_number) {
          currentEpisode = `S${i.next_episode.season_number} E${i.next_episode.episode_number}`;
          nextEpisodeToWatch = { season: i.next_episode.season_number, episode: i.next_episode.episode_number };
        } else if (correctedNextEpisodes[i.tmdb_id]) {
          const { season, episode } = correctedNextEpisodes[i.tmdb_id];
          currentEpisode = `S${season} E${episode}`;
          nextEpisodeToWatch = { season, episode };
        } else {
          const prog = episodeProgress[i.tmdb_id];
          if (prog && prog.length > 0) {
            let maxSeason = 0;
            let maxEp = 0;
            for (const ep of prog) {
              if (ep.season_number > maxSeason) {
                maxSeason = ep.season_number;
                maxEp = ep.episode_number;
              } else if (ep.season_number === maxSeason && ep.episode_number > maxEp) {
                maxEp = ep.episode_number;
              }
            }
            currentEpisode = `S${maxSeason} E${maxEp + 1}`;
            nextEpisodeToWatch = { season: maxSeason, episode: maxEp + 1 };
          } else {
            currentEpisode = `S1 E1`;
            nextEpisodeToWatch = { season: 1, episode: 1 };
          }
        }
      }

      return {
        id: (i.tmdb_id ?? i.id)?.toString() || '',
        title: i.title || 'Título Desconhecido',
        type: i.media_type,
        coverVertical: i.poster_path || '',
        coverHorizontal: i.backdrop_path ? `https://image.tmdb.org/t/p/w1280${i.backdrop_path}` : (i.poster_path ? `https://image.tmdb.org/t/p/w1280${i.poster_path}` : ''),
        currentEpisode: currentEpisode,
        nextEpisodeToWatch: nextEpisodeToWatch,
        isUpToDate: isUpToDate,
        release_date: i.release_date ?? null,
      };
    };

    const heroMapped = hero ? mapToMediaItem(hero) : null;
    
    let description = 'Continue acompanhando a partir de onde você parou.';
    if (heroReason === 'new_episode') {
      description = 'Episódio fresquinho! Acabou de sair nas últimas 48 horas.';
    } else if (heroReason === 'trending_plan_to_watch') {
      description = 'Em alta no momento! Chegou a hora de tirar esse título da sua lista de "Quero Ver".';
    } else if (heroReason === 'upcoming') {
      description = 'No seu radar! Aguardando a data de estreia nos cinemas e streaming.';
    } else if (heroReason === 'suggestion') {
      description = 'Na sua lista de desejos. Pronto para começar?';
    }

    const heroMediaItem = heroMapped ? {
      id: heroMapped.id,
      title: heroMapped.title,
      type: heroMapped.type,
      coverHorizontal: hero.backdrop_path ? `https://image.tmdb.org/t/p/w1280${hero.backdrop_path}` : (hero.poster_path ? `https://image.tmdb.org/t/p/w1280${hero.poster_path}` : ''),
      coverVertical: hero.poster_path ? `https://image.tmdb.org/t/p/w780${hero.poster_path}` : '',
      description: description,
      currentEpisode: heroMapped.currentEpisode,
      nextEpisodeToWatch: heroMapped.nextEpisodeToWatch,
      release_date: hero.release_date ?? null,
      heroReason: heroReason,
    } : null;

    const mappedWatching = activeWatchingItems.map(mapToMediaItem);
    const spotlights = [
      ...(heroMediaItem ? [heroMediaItem] : []),
      ...mappedWatching.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        coverHorizontal: item.coverHorizontal || '',
        coverVertical: item.coverVertical,
        description: 'Continue acompanhando a partir de onde você parou.',
        currentEpisode: item.currentEpisode,
        nextEpisodeToWatch: item.nextEpisodeToWatch,
        release_date: item.release_date,
        heroReason: 'continue_watching',
      }))
    ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i).slice(0, 4);

    return {
      heroFeature: heroMediaItem,
      spotlights: spotlights,
      continueWatching: mappedWatching,
      moviesInQueue: itemsArray.filter(i => i.status === 'plan_to_watch' && i.media_type === 'movie').map(mapToMediaItem),
      tvInQueue: itemsArray.filter(i => i.status === 'plan_to_watch' && i.media_type === 'tv').map(mapToMediaItem),
      upcomingMedia: itemsArray.filter(i => i.status === 'upcoming').map(mapToMediaItem),
    };
  }, [items, episodeProgress, priorityHeroId, trendingPlanToWatchId, correctedNextEpisodes, upToDateShows, verifiedShows]);

  if (!isMounted) return null;

  if (isLoading && Object.keys(items).length === 0) {
    return (
      <div className="pb-8 overflow-hidden min-h-screen animate-pulse">
        <div className="w-full h-[55vh] bg-secondary/30 rounded-b-3xl mb-8 flex items-end p-8">
          <div className="space-y-4 max-w-lg">
            <div className="h-8 w-64 bg-muted/60 rounded-lg" />
            <div className="h-4 w-96 bg-muted/40 rounded" />
            <div className="h-10 w-36 bg-primary/20 rounded-md" />
          </div>
        </div>
        <div className="px-4 md:px-8 space-y-8">
          <div className="space-y-4">
            <div className="h-6 w-48 bg-muted/50 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-secondary/40 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8 overflow-hidden min-h-screen">
      {pendingCount > 0 && (
        <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-primary/10 border border-primary/20 backdrop-blur-md rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Você tem {pendingCount} {pendingCount === 1 ? 'solicitação de amizade pendente' : 'solicitações de amizade pendentes'}!
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Alguém enviou uma solicitação para se conectar com você no OmniWatch.
                </p>
              </div>
            </div>
            <Link href="/friends">
              <Button size="sm" className="gap-1.5 shrink-0 text-xs font-semibold">
                Ver solicitações
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {heroFeature ? (
        <HeroBanner data={heroFeature} spotlights={spotlights} />
      ) : (
        <div className="w-full h-[55vh] flex flex-col items-center justify-center bg-muted gap-4">
          <h2 className="text-2xl font-bold">Sua lista está vazia</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Comece a explorar o catálogo e adicione filmes e séries à sua lista para vê-los aqui!
          </p>
          <Link href="/explore">
            <Button>Explorar Títulos</Button>
          </Link>
        </div>
      )}

      {/* Category Filter Pills Bar (Estilo Apple TV+ / Netflix 2026) */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 lg:px-8 mt-6 mb-2">
        <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-3.5">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setSelectedSection('all')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer",
                selectedSection === 'all'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              Tudo
            </button>
            {continueWatching.length > 0 && (
              <button
                onClick={() => setSelectedSection('watching')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                  selectedSection === 'watching'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Séries em Andamento</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/40 font-bold">
                  {continueWatching.length}
                </span>
              </button>
            )}
            {moviesInQueue.length > 0 && (
              <button
                onClick={() => setSelectedSection('movies')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                  selectedSection === 'movies'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Filmes na Fila</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/40 font-bold">
                  {moviesInQueue.length}
                </span>
              </button>
            )}
            {tvInQueue.length > 0 && (
              <button
                onClick={() => setSelectedSection('tv')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                  selectedSection === 'tv'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Séries na Fila</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/40 font-bold">
                  {tvInQueue.length}
                </span>
              </button>
            )}
            {upcomingMedia.length > 0 && (
              <button
                onClick={() => setSelectedSection('upcoming')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                  selectedSection === 'upcoming'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Aguardando Estreia</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/40 font-bold">
                  {upcomingMedia.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-2 md:mt-4 relative z-20 space-y-10 flex flex-col pb-12">
        {(selectedSection === 'all' || selectedSection === 'watching') && (
          <ContinueWatchingTickets 
            title="Continuar Assistindo" 
            subtitle="Episódios prontos para dar play com check-in em 1 clique"
            items={continueWatching} 
            actionHref="/my-list"
            actionText="Ver na biblioteca"
          />
        )}
        
        {(selectedSection === 'all' || selectedSection === 'movies') && (
          <MoviesQueueInspector 
            title="Filmes na Fila" 
            subtitle="Inspecione detalhes rápidos ou sorteie sua sessão de hoje em 1 clique"
            items={moviesInQueue} 
            actionHref="/my-list"
            actionText="Ver filmes"
          />
        )}

        {(selectedSection === 'all' || selectedSection === 'tv') && (
          <TvQueueAccordion 
            title="Séries na Fila" 
            subtitle="Passe o mouse ou toque para expandir em 16:9 e iniciar sua próxima maratona"
            items={tvInQueue} 
            actionHref="/my-list"
            actionText="Ver séries"
          />
        )}

        {upcomingMedia.length > 0 && (selectedSection === 'all' || selectedSection === 'upcoming') && (
          <ReleaseRadarTimeline 
            title="Aguardando Estreia" 
            subtitle="Linha do tempo por ordem de chegada • Contagem regressiva dinâmica"
            items={upcomingMedia} 
            actionHref="/calendar"
            actionText="Ver calendário"
          />
        )}
      </div>
    </div>
  );
}
