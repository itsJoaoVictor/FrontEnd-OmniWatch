import { api } from '@/lib/axios';
import {
  CollectionFollowResponse,
  CollectionStatusResponse,
  UserFollowedCollection,
  CollectionSuggestion
} from '@/types/collections';

export async function getCollectionStatus(tmdbId: number): Promise<CollectionStatusResponse> {
  const res = await api.get<CollectionStatusResponse>(`/api/collections/${tmdbId}/status`);
  return res.data;
}

export async function followCollection(tmdbId: number): Promise<CollectionFollowResponse> {
  const res = await api.post<CollectionFollowResponse>(`/api/collections/${tmdbId}/follow`);
  return res.data;
}

export async function unfollowCollection(tmdbId: number): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(`/api/collections/${tmdbId}/follow`);
  return res.data;
}

export async function getFollowedCollections(): Promise<UserFollowedCollection[]> {
  const res = await api.get<UserFollowedCollection[]>('/api/collections/following');
  return res.data;
}

export async function syncCollection(tmdbId: number): Promise<any> {
  const res = await api.post(`/api/collections/${tmdbId}/sync`);
  return res.data;
}

export async function getCollectionSuggestions(): Promise<CollectionSuggestion[]> {
  const res = await api.get<CollectionSuggestion[]>('/api/collections/suggestions');
  return res.data;
}

export async function dismissCollectionSuggestion(tmdbId: number): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>(`/api/collections/suggestions/${tmdbId}/dismiss`);
  return res.data;
}

export async function scanCollectionSuggestions(): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>('/api/collections/suggestions/scan');
  return res.data;
}

export async function getCollectionDetails(tmdbId: number): Promise<any> {
  const res = await api.get(`/api/collections/${tmdbId}`);
  return res.data;
}

