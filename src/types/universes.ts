export interface UniverseFollowedItem {
  id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv' | string;
  title: string;
  release_date?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  collection_name?: string | null;
  media_id?: string | null;
  status?: string | null;
  rating?: number | null;
  is_ignored?: boolean;
  is_recap?: boolean;
}

export interface UserFollowedUniverse {
  id: string;
  universe_key: string;
  name: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  total_items: number;
  watched_items: number;
  active_items?: number;
  ignored_items_count?: number;
  movies_count: number;
  tv_count: number;
  collections_count: number;
  completion_percentage: number;
  personal_completion_percentage?: number;
  canonical_completion_percentage?: number;
  auto_add?: boolean;
  user_average_rating?: number | null;
  rated_items_count?: number;
  items: UniverseFollowedItem[];
  created_at: string;
}

export interface UniverseStatusResponse {
  is_following: boolean;
  auto_add: boolean;
  total_items: number;
  watched_items: number;
  movies_count: number;
  tv_count: number;
  active_items?: number;
  ignored_items_count?: number;
  universe_id?: string | null;
}

export interface UniverseFollowPayload {
  auto_add?: boolean;
  ignored_items?: { tmdb_id: number; media_type: string }[];
}

export interface UniverseFollowResponse {
  success: boolean;
  message: string;
  universe_id: string;
  universe_key: string;
  name: string;
  items_added: number;
  items_already_in_list: number;
  ignored_count?: number;
}

export interface UniverseSuggestion {
  id: string;
  universe_key: string;
  name: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  total_items: number;
  movies_count: number;
  tv_count: number;
  collections_count: number;
  items_in_list: number;
  matched_titles: string[];
  is_dismissed?: boolean;
  is_reactivated?: boolean;
  reactivation_reason?: string | null;
  created_at: string;
}
