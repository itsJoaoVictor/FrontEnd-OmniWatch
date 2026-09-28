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
