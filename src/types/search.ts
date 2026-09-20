export interface SearchItem {
  id: number;
  title: string;
  overview?: string;
  image_path?: string;
  media_type: "movie" | "tv" | "person";
  date?: string;
  popularity?: number;
}

export interface SearchMultiResponse {
  page: number;
  results: SearchItem[];
  total_pages: number;
  total_results: number;
}
