import { isFutureDate } from './dateUtils';

const UP_TO_DATE_SHOWS_KEY = 'omniwatch_uptodate_shows';
const CORRECTED_EPISODES_KEY = 'omniwatch_corrected_episodes';
const SEASON_META_SESSION_KEY = 'omniwatch_season_meta_v1';

export interface SeasonEpisodeMeta {
  episode_number: number;
  season_number?: number;
  name?: string | null;
  air_date?: string | null;
  runtime?: number | null;
}

export interface ResolvedTvNextState {
  isUpToDate: boolean;
  rolledOverSeason: boolean;
  nextEpisode: {
    season_number: number;
    episode_number: number;
    name: string;
    air_date: string | null;
    is_released: boolean;
  } | null;
}

// Cache em memória (sincronizado com sessionStorage) para metadados reais de temporadas do TMDB
// Valor `null` indica que a temporada retornou 404 (não existe no TMDB)
const memorySeasonCache = new Map<string, SeasonEpisodeMeta[] | null>();
const inFlightSeasonRequests = new Map<string, Promise<SeasonEpisodeMeta[] | null>>();
let sessionCacheHydrated = false;

function hydrateSeasonCacheFromSession() {
  if (sessionCacheHydrated || typeof window === 'undefined') return;
  sessionCacheHydrated = true;
  try {
    const raw = sessionStorage.getItem(SEASON_META_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([k, v]) => {
          if (v === null || Array.isArray(v)) {
            memorySeasonCache.set(k, v as SeasonEpisodeMeta[] | null);
          }
        });
      }
    }
  } catch {
    // Ignore storage quota or parse errors
  }
}

function persistSeasonCacheToSession() {
  if (typeof window === 'undefined') return;
  try {
    const obj: Record<string, SeasonEpisodeMeta[] | null> = {};
    // Limita às últimas 80 entradas para manter sessionStorage enxuto
    const entries = Array.from(memorySeasonCache.entries()).slice(-80);
    for (const [k, v] of entries) {
      obj[k] = v;
    }
    sessionStorage.setItem(SEASON_META_SESSION_KEY, JSON.stringify(obj));
  } catch {
    // Ignore quota errors
  }
}

export function getCachedSeasonEpisodes(tmdbId: number, season: number): SeasonEpisodeMeta[] | null | undefined {
  hydrateSeasonCacheFromSession();
  return memorySeasonCache.get(`${tmdbId}:${season}`);
}

export function setCachedSeasonEpisodes(tmdbId: number, season: number, episodes: SeasonEpisodeMeta[] | null): void {
  hydrateSeasonCacheFromSession();
  memorySeasonCache.set(`${tmdbId}:${season}`, episodes);
  persistSeasonCacheToSession();
}

export async function fetchAndCacheSeasonEpisodes(tmdbId: number, season: number): Promise<SeasonEpisodeMeta[] | null> {
  hydrateSeasonCacheFromSession();
  const key = `${tmdbId}:${season}`;
  if (memorySeasonCache.has(key)) {
    return memorySeasonCache.get(key) ?? null;
  }

  const existingPromise = inFlightSeasonRequests.get(key);
  if (existingPromise) {
    return existingPromise;
  }

  const reqPromise = (async () => {
    try {
      const { api } = await import('./axios');
      const res = await api.get(`/api/tv/${tmdbId}/season/${season}`);
      const rawEpisodes = Array.isArray(res.data?.episodes) ? res.data.episodes : [];
      const compact: SeasonEpisodeMeta[] = rawEpisodes.map((e: any) => ({
        episode_number: Number(e.episode_number),
        season_number: Number(e.season_number ?? season),
        name: e.name ?? null,
        air_date: e.air_date ?? null,
        runtime: e.runtime ?? null,
      }));
      setCachedSeasonEpisodes(tmdbId, season, compact);
      return compact;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setCachedSeasonEpisodes(tmdbId, season, null);
        return null;
      }
      return null;
    } finally {
      inFlightSeasonRequests.delete(key);
    }
  })();

  inFlightSeasonRequests.set(key, reqPromise);
  return reqPromise;
}

function evaluateCandidateEpisode(
  seasonNumber: number,
  candidateEpNum: number,
  seasonEpisodes: SeasonEpisodeMeta[],
  nextSeasonEpisodes: SeasonEpisodeMeta[] | null | undefined
): ResolvedTvNextState | undefined {
  const epObj = seasonEpisodes.find((e) => e.episode_number === candidateEpNum);
  const maxEpInSeason = seasonEpisodes.reduce(
    (max, e) => Math.max(max, e.episode_number || 0),
    seasonEpisodes.length
  );

  // Episódio existe dentro da temporada atual
  if (epObj) {
    const released = Boolean(epObj.air_date && !isFutureDate(epObj.air_date));
    return {
      isUpToDate: !released,
      rolledOverSeason: false,
      nextEpisode: {
        season_number: seasonNumber,
        episode_number: candidateEpNum,
        name: epObj.name || `Episódio ${candidateEpNum}`,
        air_date: epObj.air_date ?? null,
        is_released: released,
      },
    };
  }

  // Passou do último episódio da temporada atual -> verifica próxima temporada!
  if (seasonEpisodes.length > 0 && candidateEpNum > maxEpInSeason) {
    // Se nextSeasonEpisodes ainda é `undefined`, não está em memória para resolver de forma síncrona
    if (nextSeasonEpisodes === undefined) {
      return undefined;
    }

    // Se `null` (404 no TMDB) ou sem episódios -> série está 100% em dia!
    if (nextSeasonEpisodes === null || nextSeasonEpisodes.length === 0) {
      return {
        isUpToDate: true,
        rolledOverSeason: false,
        nextEpisode: null,
      };
    }

    const nextSeasonNumber = seasonNumber + 1;
    const firstEp =
      nextSeasonEpisodes.find((e) => e.episode_number === 1) || nextSeasonEpisodes[0];
    const released = Boolean(firstEp?.air_date && !isFutureDate(firstEp.air_date));

    return {
      isUpToDate: !released,
      rolledOverSeason: released,
      nextEpisode: {
        season_number: nextSeasonNumber,
        episode_number: firstEp.episode_number,
        name: firstEp.name || `Episódio ${firstEp.episode_number}`,
        air_date: firstEp.air_date ?? null,
        is_released: released,
      },
    };
  }

  // Temporada vazia ou episódio inexistente sem temporada seguinte
  return {
    isUpToDate: true,
    rolledOverSeason: false,
    nextEpisode: null,
  };
}

/**
 * Tenta resolver de forma síncrona (0ms) qual é o próximo episódio real após assistir (watchedSeason, watchedEp).
 * Retorna `undefined` apenas se os metadados da temporada necessária ainda não estiverem em memória.
 */
export function resolveAfterWatchingEpisodeSync(
  tmdbId: number,
  watchedSeason: number,
  watchedEp: number
): ResolvedTvNextState | undefined {
  const seasonEps = getCachedSeasonEpisodes(tmdbId, watchedSeason);
  if (!seasonEps) return undefined;
  const nextSeasonEps = getCachedSeasonEpisodes(tmdbId, watchedSeason + 1);
  return evaluateCandidateEpisode(watchedSeason, watchedEp + 1, seasonEps, nextSeasonEps);
}

/**
 * Resolve de forma assíncrona e exata qual é o próximo episódio após assistir (watchedSeason, watchedEp),
 * consultando a temporada atual e, caso tenha acabado, a temporada seguinte (`watchedSeason + 1`).
 */
export async function resolveAfterWatchingEpisodeAsync(
  tmdbId: number,
  watchedSeason: number,
  watchedEp: number
): Promise<ResolvedTvNextState | undefined> {
  const seasonEps = await fetchAndCacheSeasonEpisodes(tmdbId, watchedSeason);
  if (!seasonEps) return undefined;

  const candidateEpNum = watchedEp + 1;
  const maxEpInSeason = seasonEps.reduce(
    (max, e) => Math.max(max, e.episode_number || 0),
    seasonEps.length
  );

  let nextSeasonEps: SeasonEpisodeMeta[] | null = null;
  if (seasonEps.length > 0 && candidateEpNum > maxEpInSeason) {
    nextSeasonEps = await fetchAndCacheSeasonEpisodes(tmdbId, watchedSeason + 1);
  }

  return evaluateCandidateEpisode(watchedSeason, candidateEpNum, seasonEps, nextSeasonEps);
}

/**
 * Retorna o conjunto de IDs TMDB de séries que estão em dia (salvas em cache local).
 */
export function getUpToDateShowsFromCache(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(UP_TO_DATE_SHOWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map(Number));
      }
    }
  } catch (e) {
    console.error('Failed to read upToDateShows from localStorage', e);
  }
  return new Set();
}

/**
 * Salva o conjunto de IDs TMDB de séries que estão em dia no cache local.
 */
export function saveUpToDateShowsToCache(shows: Set<number> | number[]): void {
  if (typeof window === 'undefined') return;
  try {
    const arr = Array.from(shows);
    localStorage.setItem(UP_TO_DATE_SHOWS_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error('Failed to save upToDateShows to localStorage', e);
  }
}

/**
 * Remove uma série do cache de em dia (ex: quando um episódio é desmarcado).
 */
export function removeUpToDateShowFromCache(tmdbId: number): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getUpToDateShowsFromCache();
    if (current.delete(tmdbId)) {
      saveUpToDateShowsToCache(current);
    }
  } catch (e) {
    console.error('Failed to remove show from upToDate cache', e);
  }
}

/**
 * Adiciona uma série ao cache de em dia.
 */
export function addUpToDateShowToCache(tmdbId: number): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getUpToDateShowsFromCache();
    current.add(tmdbId);
    saveUpToDateShowsToCache(current);
  } catch (e) {
    console.error('Failed to add show to upToDate cache', e);
  }
}

/**
 * Retorna as correções de temporada/episódio salvas em cache local.
 */
export function getCorrectedEpisodesFromCache(): Record<number, { season: number; episode: number }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CORRECTED_EPISODES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read correctedEpisodes from localStorage', e);
  }
  return {};
}

/**
 * Salva (mesclando com os registros existentes) as correções de temporada/episódio no cache local.
 */
export function saveCorrectedEpisodesToCache(corrections: Record<number, { season: number; episode: number }>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getCorrectedEpisodesFromCache();
    const merged = { ...current, ...corrections };
    localStorage.setItem(CORRECTED_EPISODES_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error('Failed to save correctedEpisodes to localStorage', e);
  }
}

/**
 * Remove uma correção específica quando a série fica em dia.
 */
export function removeCorrectedEpisodeFromCache(tmdbId: number): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getCorrectedEpisodesFromCache();
    if (tmdbId in current) {
      delete current[tmdbId];
      localStorage.setItem(CORRECTED_EPISODES_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.error('Failed to remove correctedEpisode from localStorage', e);
  }
}
