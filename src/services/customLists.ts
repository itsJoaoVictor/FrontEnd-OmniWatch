import { api } from '@/lib/axios';
import {
  CustomListSummary,
  CustomListDetail,
  CustomListCreateInput,
  CustomListUpdateInput,
  CustomListItemCreateInput,
  CustomListItem,
  MediaListMembership,
} from '@/types/customLists';

export const customListsService = {
  async getMyLists(): Promise<CustomListSummary[]> {
    const res = await api.get<CustomListSummary[]>('/api/custom-lists/my');
    return res.data;
  },

  async getListDetail(id: string): Promise<CustomListDetail> {
    const res = await api.get<CustomListDetail>(`/api/custom-lists/${id}`);
    return res.data;
  },

  async createList(data: CustomListCreateInput): Promise<CustomListSummary> {
    const res = await api.post<CustomListSummary>('/api/custom-lists', data);
    return res.data;
  },

  async updateList(id: string, data: CustomListUpdateInput): Promise<CustomListSummary> {
    const res = await api.put<CustomListSummary>(`/api/custom-lists/${id}`, data);
    return res.data;
  },

  async deleteList(id: string): Promise<void> {
    await api.delete(`/api/custom-lists/${id}`);
  },

  async addItemToList(listId: string, item: CustomListItemCreateInput): Promise<CustomListItem> {
    const res = await api.post<CustomListItem>(`/api/custom-lists/${listId}/items`, item);
    return res.data;
  },

  async removeItemFromList(listId: string, itemId: string): Promise<void> {
    await api.delete(`/api/custom-lists/${listId}/items/${itemId}`);
  },

  async reorderListItems(listId: string, itemIds: string[]): Promise<void> {
    await api.put(`/api/custom-lists/${listId}/items/reorder`, { item_ids: itemIds });
  },

  async updateListItem(
    listId: string,
    itemId: string,
    data: { note?: string; position?: number }
  ): Promise<CustomListItem> {
    const res = await api.patch<CustomListItem>(`/api/custom-lists/${listId}/items/${itemId}`, data);
    return res.data;
  },

  async getMediaMembership(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<MediaListMembership[]> {
    const res = await api.get<MediaListMembership[]>(
      `/api/custom-lists/membership/${tmdbId}?media_type=${mediaType}`
    );
    return res.data;
  },
};
