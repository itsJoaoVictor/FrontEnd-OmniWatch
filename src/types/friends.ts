export interface FriendUser {
  id: string;
  name: string;
  username: string | null;
  email?: string | null;
  friendship_id: string;
  since: string;
}

export interface FriendRequest {
  friendship_id: string;
  user: {
    id: string;
    name: string;
    username: string | null;
    email?: string | null;
  };
  created_at: string;
}

export interface FriendRequestsResponse {
  received: FriendRequest[];
  sent: FriendRequest[];
}

export interface UserSearchResult {
  id: string;
  name: string;
  username: string | null;
  relationship_status: 'none' | 'pending_sent' | 'pending_received' | 'friends';
  friendship_id: string | null;
}

export interface FriendFeedItem {
  id: string;
  user_id: string;
  user_name: string;
  username: string | null;
  media_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  rating: number | null;
  season_number: number | null;
  episode_numbers: number[];
  episodes_label: string | null;
  watched_at: string;
  action_type: 'watched_movie' | 'watched_episode' | 'binge_watched';
}

export interface FriendFeedResponse {
  items: FriendFeedItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}
