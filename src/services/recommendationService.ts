import { api } from "@/lib/axios";
import { TogetherResponse } from "@/types/recommendation";

export interface TogetherParams {
  friend_id: string;
  unseen_mode?: "one" | "both";
  media_type?: "all" | "movie" | "tv";
  genre_id?: number | null;
  min_vote_average?: number | null;
  limit?: number;
}

export async function getTogetherRecommendations(params: TogetherParams): Promise<TogetherResponse> {
  const query = new URLSearchParams();
  query.append("friend_id", params.friend_id);
  if (params.unseen_mode) query.append("unseen_mode", params.unseen_mode);
  if (params.media_type) query.append("media_type", params.media_type);
  if (params.genre_id !== undefined && params.genre_id !== null) {
    query.append("genre_id", String(params.genre_id));
  }
  if (params.min_vote_average !== undefined && params.min_vote_average !== null) {
    query.append("min_vote_average", String(params.min_vote_average));
  }
  if (params.limit) {
    query.append("limit", String(params.limit));
  }

  const response = await api.get<TogetherResponse>(`/api/recommendations/together?${query.toString()}`);
  return response.data;
}
