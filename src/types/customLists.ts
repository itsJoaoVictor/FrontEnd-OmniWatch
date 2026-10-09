export interface CustomListItem {
  id: string;
  list_id: string;
  media_id: string | null;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  runtime: number;
  position: number;
  note: string | null;
  created_at: string;
}

export interface CustomListSummary {
  id: string;
  user_id: string;
  user_name: string | null;
  title: string;
  description: string | null;
  is_ranked: boolean;
  cover_backdrop_path: string | null;
  cover_poster_path: string | null;
  items_count: number;
  preview_posters: string[];
  created_at: string;
  updated_at: string;
}

export interface CustomListDetail extends CustomListSummary {
  items: CustomListItem[];
  total_runtime_minutes: number;
  is_owner: boolean;
}

export interface CustomListCreateInput {
  title: string;
  description?: string;
  is_ranked?: boolean;
  cover_backdrop_path?: string | null;
  cover_poster_path?: string | null;
}

export interface CustomListUpdateInput {
  title?: string;
  description?: string;
  is_ranked?: boolean;
  cover_backdrop_path?: string | null;
  cover_poster_path?: string | null;
}

export interface CustomListItemCreateInput {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  runtime?: number;
  note?: string | null;
  position?: number;
}

export interface MediaListMembership {
  list_id: string;
  title: string;
  contains_media: boolean;
  item_id: string | null;
}
