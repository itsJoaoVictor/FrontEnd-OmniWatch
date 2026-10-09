export interface CollectionFollowedItem {
  id: string;
  tmdb_id: number;
  title: string;
  release_date?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  media_id?: string | null;
  status?: string | null;
  rating?: number | null;
}

export interface UserFollowedCollection {
  id: string;
  tmdb_id: number;
  name: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  total_movies: number;
  watched_movies: number;
  completion_percentage: number;
  user_average_rating?: number | null;
  rated_movies_count?: number;
  items: CollectionFollowedItem[];
  created_at: string;
}

export interface CollectionStatusResponse {
  is_following: boolean;
  auto_add: boolean;
  total_movies: number;
  watched_movies: number;
  collection_id?: string | null;
}

export interface CollectionFollowResponse {
  success: boolean;
  message: string;
  collection_id: string;
  tmdb_id: number;
  name: string;
  movies_added: number;
  movies_already_in_list: number;
}

export interface CollectionSuggestion {
  id: string;
  tmdb_id: number;
  name: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  total_movies: number;
  movies_in_list: number;
  matched_movie_titles: string[];
  created_at: string;
}

