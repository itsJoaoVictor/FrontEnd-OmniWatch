export interface StatRankingItem {
  name: string;
  count: number;
  totalTime: number;
  avgRating: number | null;
  percentage: number;
}

export interface StatTimelineItem {
  month: string;
  hours: number;
  count: number;
}

export interface StatKpis {
  averageRating: number;
  totalRated: number;
  completionRate?: number;
  completedCount?: number;
  pendingCount?: number;
  planToWatchCount?: number;
  seriesCompleted: number;
  seriesWatching: number;
  seriesPlanToWatch: number;
  seriesCompletionRate: number;
  moviesCompleted?: number;
  moviesWatching?: number;
  moviesPlanToWatch?: number;
  moviesCompletionRate?: number;
  dailyAverageMinutes: number;
  weeklyAverageMinutes: number;
}

export interface StatisticsResponse {
  totalTime: number;
  totalTimeMovies: number;
  totalTimeTv: number;
  totalMovies: number;
  totalEpisodes: number;
  ratingDistribution: { rating: string; count: number }[];
  topGenres: StatRankingItem[];
  kpis: StatKpis;
  rankings: {
    genres: StatRankingItem[];
    cast: StatRankingItem[];
    directors: StatRankingItem[];
  };
  timeline: StatTimelineItem[];
}

export type PeriodFilter = 'all' | 'year' | '6months' | '30days';
export type MediaTypeFilter = 'all' | 'movie' | 'tv';

export interface MediaRankingItem {
  rank: number;
  id: string;
  media_id: string;
  tmdb_id: number;
  title: string;
  media_type: 'movie' | 'tv';
  poster_path?: string | null;
  release_date?: string | null;
  runtime?: number;
  genres: string[];
  rating?: number | null;
  rewatch_count: number;
  total_time_minutes: number;
  episodes_watched: number;
  status: string;
  last_watched_at?: string | null;
}

export interface MediaRankingResponse {
  items: MediaRankingItem[];
  total_items: number;
  page: number;
  page_size: number;
  total_pages: number;
  media_type: string;
  sort_by: string;
  period: string;
}

export type MediaSortField = 'time' | 'rating' | 'rewatch' | 'episodes' | 'recent' | 'title';
