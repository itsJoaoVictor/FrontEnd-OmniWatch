export interface TrendingItem {
  id: number;
  title?: string | null;
  name?: string | null;
  overview: string;
  poster_path?: string | null;
  media_type: string;
  popularity: number;
  vote_average: number;
  release_date?: string | null;
  first_air_date?: string | null;
}

export interface TrendingResponse {
  page: number;
  results: TrendingItem[];
  total_pages: number;
  total_results: number;
}
