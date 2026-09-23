'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { HeroBanner } from "@/components/home/HeroBanner";
import { ContentCarousel } from "@/components/home/ContentCarousel";
import { useMyListStore } from '@/store/useMyListStore';
import { MediaItem } from "@/components/home/MediaCard";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function HomePage() {
  const { items, isLoading, fetchMyList, episodeProgress, fetchProgress } = useMyListStore();
  const [isMounted, setIsMounted] = useState(false);
  const fetchedProgressRef = useRef(new Set<number>());

  useEffect(() => {
    setIsMounted(true);
    if (Object.keys(items).length === 0) {
      fetchMyList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMyList]);

  useEffect(() => {
    const tvWatching = Object.values(items).filter(i => i && i.status === 'watching' && i.media_type === 'tv' && i.tmdb_id);
    tvWatching.forEach(item => {
      if (!episodeProgress[item.tmdb_id] && !fetchedProgressRef.current.has(item.tmdb_id)) {
        fetchedProgressRef.current.add(item.tmdb_id);
        fetchProgress(item.tmdb_id);
      }
    });
  }, [items, episodeProgress, fetchProgress]);

  const [priorityHeroId, setPriorityHeroId] = useState<number | null>(null);
  const [trendingPlanToWatchId, setTrendingPlanToWatchId] = useState<number | null>(null);
  const [correctedNextEpisodes, setCorrectedNextEpisodes] = useState<Record<number, {season: number, episode: number}>>({});
  const [upToDateShows, setUpToDateShows] = useState<Set<number>>(new Set());

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
      
      for (const item of tvWatching) {
        const prog = episodeProgress[item.tmdb_id];
        if (!prog) continue;

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

          if (foundPriority) continue; // Skip 48h rule if we already found a priority

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
            
            if (diffHours >= -24 && diffHours <= 48) {
              setPriorityHeroId(item.tmdb_id);
              foundPriority = true;
            }
          } else {
            // Se o episódio existe mas não tem data, assumimos que ainda vai lançar (Up to date)
            newUpToDate.add(item.tmdb_id);
          }
        } catch (e) {
          // Ignore
        }
      }
      
      if (Object.keys(newCorrections).length > 0) {
        setCorrectedNextEpisodes(prev => ({ ...prev, ...newCorrections }));
      }
      setUpToDateShows(newUpToDate);
    };
    
    if (Object.keys(episodeProgress).length > 0) {
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
  const { heroFeature, continueWatching, moviesInQueue, tvInQueue } = useMemo(() => {
    const itemsArray = Object.values(items).filter(i => i && (i.tmdb_id || i.id));
    
    let watchingItems = itemsArray.filter(i => i.status === 'watching');
    watchingItems.sort((a, b) => {
      const dateA = a.last_watched_at ? new Date(a.last_watched_at).getTime() : 0;
      const dateB = b.last_watched_at ? new Date(b.last_watched_at).getTime() : 0;
      return dateB - dateA; // Most recent first
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
    } else if (watchingItems.length > 0) {
      hero = watchingItems[0];
      heroReason = 'continue_watching';
    } else {
      hero = itemsArray.find(i => i.status === 'plan_to_watch') || itemsArray[0];
      heroReason = 'suggestion';
    }

    const mapToMediaItem = (i: any): MediaItem => {
      let currentEpisode = null;
      let nextEpisodeToWatch = undefined;
      if (i.media_type === 'tv' && i.status === 'watching') {
        const prog = episodeProgress[i.tmdb_id];
        if (prog && prog.length > 0) {
          if (correctedNextEpisodes[i.tmdb_id]) {
            const { season, episode } = correctedNextEpisodes[i.tmdb_id];
            currentEpisode = `S${season} E${episode}`;
            nextEpisodeToWatch = { season, episode };
          } else {
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
          }
        } else {
          currentEpisode = `S1 E1`;
          nextEpisodeToWatch = { season: 1, episode: 1 };
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
      };
    };

    const heroMapped = hero ? mapToMediaItem(hero) : null;
    
    let description = 'Continue acompanhando a partir de onde você parou.';
    if (heroReason === 'new_episode') {
      description = 'Episódio fresquinho! Acabou de sair nas últimas 48 horas.';
    } else if (heroReason === 'trending_plan_to_watch') {
      description = 'Em alta no momento! Chegou a hora de tirar esse título da sua lista de "Quero Ver".';
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
      continueWatching: watchingItems.filter(i => !upToDateShows.has(i.tmdb_id)).map(mapToMediaItem),
      moviesInQueue: itemsArray.filter(i => i.status === 'plan_to_watch' && i.media_type === 'movie').map(mapToMediaItem),
      tvInQueue: itemsArray.filter(i => i.status === 'plan_to_watch' && i.media_type === 'tv').map(mapToMediaItem),
    };
  }, [items, episodeProgress, priorityHeroId, trendingPlanToWatchId, correctedNextEpisodes, upToDateShows]);

  if (!isMounted) return null;

  if (isLoading && Object.keys(items).length === 0) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
      </div>
    </div>
  );
}
