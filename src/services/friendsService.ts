import { api } from '@/lib/axios';
import {
  FriendUser,
  FriendRequestsResponse,
  UserSearchResult,
  FriendFeedResponse,
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

  async searchUsers(q: string): Promise<UserSearchResult[]> {
    const res = await api.get<UserSearchResult[]>('/api/friends/search', {
      params: { q },
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

  async getFeed(page: number = 1, limit: number = 20): Promise<FriendFeedResponse> {
    const res = await api.get<FriendFeedResponse>('/api/friends/feed', {
      params: { page, limit },
    });
    return res.data;
  },
};
