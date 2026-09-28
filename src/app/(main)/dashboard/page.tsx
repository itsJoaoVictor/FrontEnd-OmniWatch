'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { HeroBanner } from "@/components/home/HeroBanner";
import { ContentCarousel } from "@/components/home/ContentCarousel";
import { useMyListStore } from '@/store/useMyListStore';
import { MediaItem } from "@/components/home/MediaCard";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import {
  getUpToDateShowsFromCache,
  saveUpToDateShowsToCache,
  getCorrectedEpisodesFromCache,
  saveCorrectedEpisodesToCache
} from '@/lib/seriesCache';

export default function HomePage() {
  const { items, isLoading, fetchMyList, episodeProgress, fetchProgress } = useMyListStore();
  const [isMounted, setIsMounted] = useState(false);
  const fetchedProgressRef = useRef(new Set<number>());

  useEffect(() => {
    setIsMounted(true);
    fetchMyList();
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
          const { api } = await import('@/lib/axios');
          // Fetch current season details to see if nextEpNum exists
          let res = await api.get(`/api/tv/${item.tmdb_id}/season/${nextSeason}`);
          let episodes = res.data.episodes || [];
          
          // If the episode number exceeds the season's episode count, roll over to next season
          if (episodes.length > 0 && nextEpNum > episodes.length) {
            nextSeason += 1;
            nextEpNum = 1;
            newCorrections[item.tmdb_id] = { season: nextSeason, episode: nextEpNum };
            
            // Re-fetch the new season to check for the 48h rule
            try {
              res = await api.get(`/api/tv/${item.tmdb_id}/season/${nextSeason}`);
              episodes = res.data.episodes || [];
            } catch (e) {
              // Next season might not exist yet
              episodes = [];
            }
          }

          newlyVerified.add(item.tmdb_id);

          const epData = episodes.find((e: any) => e.episode_number === nextEpNum);
          
          if (!epData) {
            newUpToDate.add(item.tmdb_id);
          } else if (epData.air_date) {
            const airDate = new Date(epData.air_date);
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
        const { api } = await import('@/lib/axios');
        const res = await api.get('/api/trending');
        const trendingItems = res.data.results || [];
        
        for (const trending of trendingItems) {
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
    const { heroFeature, continueWatching, moviesInQueue, tvInQueue, upcomingMedia } = useMemo(() => {
    const itemsArray = Object.values(items).filter(i => i && (i.tmdb_id || i.id));
    
    let watchingItems = itemsArray.filter(i => i.status === 'watching');
    watchingItems.sort((a, b) => {
      const dateA = a.last_watched_at ? new Date(a.last_watched_at).getTime() : 0;
      const dateB = b.last_watched_at ? new Date(b.last_watched_at).getTime() : 0;
      return dateB - dateA; // Most recent first
    });

    const activeWatchingItems = watchingItems.filter(i => {
      if (i.is_up_to_date === true || upToDateShows.has(i.tmdb_id)) return false;
      if (i.media_type === 'tv') {
        if (i.is_up_to_date === false) return true;
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
      description: description,
      currentEpisode: heroMapped.currentEpisode,
      nextEpisodeToWatch: heroMapped.nextEpisodeToWatch,
    } : null;

    return {
      heroFeature: heroMediaItem,
      continueWatching: activeWatchingItems.map(mapToMediaItem),
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
      {heroFeature ? (
        <HeroBanner data={heroFeature} />
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
      
      <div className="mt-4 md:mt-8 relative z-20 space-y-8 flex flex-col pb-8">
        {continueWatching.length > 0 && (
          <ContentCarousel 
            title="Continuar Assistindo" 
            items={continueWatching} 
            layout="tracking" 
          />
        )}
        
        {moviesInQueue.length > 0 && (
          <ContentCarousel 
            title="Filmes na Fila" 
            items={moviesInQueue} 
            layout="poster"
          />
        )}

        {tvInQueue.length > 0 && (
          <ContentCarousel 
            title="Séries na Fila" 
            items={tvInQueue} 
            layout="poster"
          />
        )}

        {upcomingMedia.length > 0 && (
          <ContentCarousel 
            title="Aguardando Estreia" 
            items={upcomingMedia} 
            layout="poster"
          />
        )}
      </div>
    </div>
  );
}
