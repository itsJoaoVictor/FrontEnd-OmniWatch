export interface RecommendationItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  media_type: string;
  vote_average: number;
  overview?: string;
  match_score: number;
  match_tags: string[];
}

export interface PersonaCarousel {
  id: string;
  name: string;
  emoji: string;
  tagline?: string;
  item_count: number;
  top_genres: string[];
  sample_titles: string[];
  recommendations: RecommendationItem[];
}

