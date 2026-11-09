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
  next_cursor?: string | null;
}

export type IneligibleReason = 'ALREADY_WATCHED' | 'ALREADY_IN_LIST' | 'PENDING_RECOMMENDATION';

export interface FriendEligibilityItem {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  is_eligible: boolean;
  ineligible_reason: IneligibleReason | null;
}

export interface SendRecommendationPayload {
  recipient_ids: string[];
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  media_title: string;
  media_poster_path?: string | null;
  media_release_date?: string | null;
  media_vote_average?: number | null;
  message?: string | null;
}

export interface FriendRecommendationItem {
  id: string;
  sender: {
    id: string;
    name: string;
    username: string | null;
    email?: string | null;
  };
  recipient: {
    id: string;
    name: string;
    username: string | null;
    email?: string | null;
  };
  media_type: 'movie' | 'tv';
  tmdb_id: number;
  media_title: string;
  media_poster_path: string | null;
  media_release_date: string | null;
  media_vote_average: number | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'dismissed';
  created_at: string;
  updated_at: string;
  in_user_list: boolean;
  user_list_status: string | null;
}

