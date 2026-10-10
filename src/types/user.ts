export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  created_at?: string;
}

export interface PublicUserProfileStats {
  total_movies: number;
  total_episodes: number;
  total_time_minutes: number;
  total_time_hours: number;
  average_rating: number;
  completed_count: number;
}

export interface PublicUserProfileList {
  id: string;
  title: string;
  description: string | null;
  is_ranked: boolean;
  cover_poster_path: string | null;
  cover_backdrop_path: string | null;
  items_count: number;
  created_at: string;
}

export interface PublicUserProfileFavorite {
  media_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  rating: number | null;
}

export interface PublicUserTrackedItem {
  id: string;
  media_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  status: 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped';
  rating: number | null;
  is_favorite: boolean;
  last_watched_at: string | null;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  username: string | null;
  created_at: string;
  relationship_status: 'none' | 'friends' | 'pending_sent' | 'pending_received' | 'self';
  friendship_id: string | null;
  stats: PublicUserProfileStats;
  public_lists: PublicUserProfileList[];
  favorite_media: PublicUserProfileFavorite[];
  tracked_media: PublicUserTrackedItem[];
}

