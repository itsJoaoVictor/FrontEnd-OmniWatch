import { api } from '@/lib/axios';
import {
  FriendUser,
  FriendRequestsResponse,
  UserSearchResult,
  FriendFeedResponse,
  FriendEligibilityItem,
  SendRecommendationPayload,
  FriendRecommendationItem,
} from '@/types/friends';

export const friendsService = {
  async getFriends(): Promise<FriendUser[]> {
    const res = await api.get<FriendUser[]>('/api/friends');
    return res.data;
  },

  async getRequests(): Promise<FriendRequestsResponse> {
    const res = await api.get<FriendRequestsResponse>('/api/friends/requests');
    return res.data;
  },

  async getPendingCount(): Promise<number> {
    const res = await api.get<{ count: number }>('/api/friends/pending-count');
    return res.data.count;
  },

  async searchUsers(q: string, signal?: AbortSignal): Promise<UserSearchResult[]> {
    const res = await api.get<UserSearchResult[]>('/api/friends/search', {
      params: { q },
      signal,
    });
    return res.data;
  },

  async sendFriendRequest(params: { username?: string; addressee_id?: string }): Promise<any> {
    const res = await api.post('/api/friends/requests', params);
    return res.data;
  },

  async acceptFriendRequest(friendshipId: string): Promise<any> {
    const res = await api.post(`/api/friends/requests/${friendshipId}/accept`);
    return res.data;
  },

  async rejectFriendRequest(friendshipId: string): Promise<any> {
    const res = await api.post(`/api/friends/requests/${friendshipId}/reject`);
    return res.data;
  },

  async cancelFriendRequest(friendshipId: string): Promise<any> {
    const res = await api.delete(`/api/friends/requests/${friendshipId}`);
    return res.data;
  },

  async removeFriend(friendshipId: string): Promise<any> {
    const res = await api.delete(`/api/friends/${friendshipId}`);
    return res.data;
  },

  async getFeed(
    page: number = 1,
    limit: number = 20,
    mediaType?: 'all' | 'movie' | 'tv',
    cursor?: string | null,
    friend?: string | null
  ): Promise<FriendFeedResponse> {
    const params: Record<string, any> = { page, limit };
    if (mediaType && mediaType !== 'all') {
      params.media_type = mediaType;
    }
    if (cursor) {
      params.cursor = cursor;
    }
    if (friend) {
      params.friend = friend;
    }
    const res = await api.get<FriendFeedResponse>('/api/friends/feed', { params });
    return res.data;
  },

  async getRecommendationEligibility(
    tmdbId: number,
    mediaType: 'movie' | 'tv'
  ): Promise<FriendEligibilityItem[]> {
    const res = await api.get<FriendEligibilityItem[]>('/api/friends/recommendations/eligibility', {
      params: { tmdb_id: tmdbId, media_type: mediaType },
    });
    return res.data;
  },

  async sendRecommendation(
    payload: SendRecommendationPayload
  ): Promise<FriendRecommendationItem[]> {
    const res = await api.post<FriendRecommendationItem[]>('/api/friends/recommendations', payload);
    return res.data;
  },

  async getReceivedRecommendations(
    status: 'pending' | 'history' = 'pending',
    limit: number = 50,
    offset: number = 0
  ): Promise<FriendRecommendationItem[]> {
    const res = await api.get<FriendRecommendationItem[]>('/api/friends/recommendations/received', {
      params: { status, limit, offset },
    });
    return res.data;
  },

  async updateRecommendationStatus(
    recommendationId: string,
    status: 'accepted' | 'dismissed'
  ): Promise<FriendRecommendationItem> {
    const res = await api.patch<FriendRecommendationItem>(
      `/api/friends/recommendations/${recommendationId}/status`,
      { status }
    );
    return res.data;
  },
};
