const UP_TO_DATE_SHOWS_KEY = 'omniwatch_uptodate_shows';
const CORRECTED_EPISODES_KEY = 'omniwatch_corrected_episodes';

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
 * Salva as correções de temporada/episódio no cache local.
 */
export function saveCorrectedEpisodesToCache(corrections: Record<number, { season: number; episode: number }>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CORRECTED_EPISODES_KEY, JSON.stringify(corrections));
  } catch (e) {
    console.error('Failed to save correctedEpisodes to localStorage', e);
  }
}
