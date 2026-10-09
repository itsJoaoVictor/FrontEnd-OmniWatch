import { api } from '@/lib/axios';
import { UserProfile } from '@/types/user';

export interface UsernameCheckResponse {
  available: boolean;
  message: string;
}

export const userService = {
  async getMe(): Promise<UserProfile> {
    const res = await api.get<UserProfile>('/api/users/me');
    return res.data;
  },

  async checkUsername(username: string): Promise<UsernameCheckResponse> {
    const res = await api.get<UsernameCheckResponse>('/api/users/check-username', {
      params: { username },
    });
    return res.data;
  },

  async updateUsername(username: string): Promise<UserProfile> {
    const res = await api.patch<UserProfile>('/api/users/me/username', { username });
    return res.data;
  },
};
