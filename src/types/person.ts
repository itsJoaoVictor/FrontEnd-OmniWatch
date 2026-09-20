export interface PersonCastItem {
  id: number;
  title: string;
  character?: string;
  job?: string;
  department?: string;
  poster_path: string | null;
  media_type: string;
  release_date: string | null;
  vote_count: number;
  order: number | null;
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
