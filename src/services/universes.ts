import { api } from '@/lib/axios';
import {
  UniverseFollowResponse,
  UniverseStatusResponse,
  UserFollowedUniverse,
  UniverseSuggestion,
  UniverseFollowPayload,
} from '@/types/universes';

export async function getUniverseStatus(universeKey: string): Promise<UniverseStatusResponse> {
  const res = await api.get<UniverseStatusResponse>(`/api/universes/${encodeURIComponent(universeKey)}/status`);
  return res.data;
}

export async function followUniverse(
  universeKey: string,
  payload?: UniverseFollowPayload
): Promise<UniverseFollowResponse> {
  const res = await api.post<UniverseFollowResponse>(
    `/api/universes/${encodeURIComponent(universeKey)}/follow`,
    payload || { auto_add: true, ignored_items: [] }
  );
  return res.data;
}

export async function unfollowUniverse(universeKey: string): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(`/api/universes/${encodeURIComponent(universeKey)}/follow`);
  return res.data;
}

export async function toggleUniverseItemIgnore(
  universeKey: string,
  tmdbId: number,
  mediaType: string,
  isIgnored: boolean
): Promise<{ success: boolean; tmdb_id: number; is_ignored: boolean }> {
  const res = await api.post<{ success: boolean; tmdb_id: number; is_ignored: boolean }>(
    `/api/universes/${encodeURIComponent(universeKey)}/items/${tmdbId}/toggle-ignore`,
    {
      tmdb_id: tmdbId,
      media_type: mediaType,
      is_ignored: isIgnored,
    }
  );
  return res.data;
}

export async function updateUniverseSettings(
  universeKey: string,
  autoAdd: boolean
): Promise<{ success: boolean; auto_add: boolean }> {
  const res = await api.patch<{ success: boolean; auto_add: boolean }>(
    `/api/universes/${encodeURIComponent(universeKey)}/settings`,
    {
      auto_add: autoAdd,
    }
  );
  return res.data;
}

export async function getFollowedUniverses(): Promise<UserFollowedUniverse[]> {
  const res = await api.get<UserFollowedUniverse[]>('/api/universes/following');
  return res.data;
}

export async function syncUniverse(universeKey: string): Promise<any> {
  const res = await api.post(`/api/universes/${encodeURIComponent(universeKey)}/sync`);
  return res.data;
}

export async function getUniverseSuggestions(): Promise<UniverseSuggestion[]> {
  const res = await api.get<UniverseSuggestion[]>('/api/universes/suggestions');
  return res.data;
}

export async function dismissUniverseSuggestion(universeKey: string): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>(`/api/universes/suggestions/${encodeURIComponent(universeKey)}/dismiss`);
  return res.data;
}

export async function restoreUniverseSuggestion(universeKey: string): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>(`/api/universes/suggestions/${encodeURIComponent(universeKey)}/restore`);
  return res.data;
}

export async function getDismissedUniverseSuggestions(): Promise<UniverseSuggestion[]> {
  const res = await api.get<UniverseSuggestion[]>('/api/universes/suggestions/dismissed');
  return res.data;
}

export async function scanUniverseSuggestions(): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>('/api/universes/suggestions/scan');
  return res.data;
}

export async function getUniverseDetails(universeKey: string): Promise<UserFollowedUniverse> {
  const res = await api.get<UserFollowedUniverse>(`/api/universes/${encodeURIComponent(universeKey)}`);
  return res.data;
}
