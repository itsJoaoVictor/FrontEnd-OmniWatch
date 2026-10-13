export interface PersonCastItem {
  id: number;
  title: string;
  character?: string;
  job?: string;
  department?: string;
  poster_path: string | null;
  media_type: string;
  release_date: string | null;
  popularity?: number;
  vote_count: number;
  vote_average?: number;
  order: number | null;
  genre_ids?: number[];
  episode_count?: number | null;
  suggestion_score?: number | null;
  match_score?: number | null;
  role_label?: string | null;
}

export interface PersonDetailsResponse {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  combined_credits: PersonCastItem[];
}

export interface PersonDiscoverResponse {
  items: PersonCastItem[];
  is_personalized: boolean;
}

