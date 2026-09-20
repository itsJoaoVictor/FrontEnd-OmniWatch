export interface ReleaseEvent {
  id: string;
  media_id: string;
  title: string;
  description?: string;
  release_date: string;
  season_number?: number;
  episode_number?: number;
  media: {
    id: string;
    tmdb_id: number;
    title: string;
    poster_path?: string;
    media_type: 'movie' | 'tv';
  };
}
