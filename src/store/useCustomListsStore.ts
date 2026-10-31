import { create } from 'zustand';
import { customListsService } from '@/services/customLists';
import { CustomListSummary } from '@/types/customLists';

interface CustomListsState {
  myLists: CustomListSummary[];
  isLoading: boolean;
  hasLoaded: boolean;
  fetchMyLists: (force?: boolean) => Promise<CustomListSummary[]>;
  setMyLists: (lists: CustomListSummary[] | ((prev: CustomListSummary[]) => CustomListSummary[])) => void;
  removeList: (listId: string) => void;
  upsertList: (list: CustomListSummary) => void;
}

export const useCustomListsStore = create<CustomListsState>((set, get) => ({
  myLists: [],
  isLoading: false,
  hasLoaded: false,

  setMyLists: (updater) => {
    set((state) => ({
      myLists: typeof updater === 'function' ? updater(state.myLists) : updater,
    }));
  },

  removeList: (listId) => {
    set((state) => ({
      myLists: state.myLists.filter((l) => l.id !== listId),
    }));
  },

  upsertList: (savedList) => {
    set((state) => {
      const exists = state.myLists.some((l) => l.id === savedList.id);
      if (exists) {
        return {
          myLists: state.myLists.map((l) => (l.id === savedList.id ? savedList : l)),
        };
      }
      return {
        myLists: [savedList, ...state.myLists],
      };
    });
  },

  fetchMyLists: async (force = false) => {
    const { hasLoaded, isLoading } = get();
    // Se já carregou e não forçado, faz revalidação em background (padrão SWR)
    if (hasLoaded && !force) {
      customListsService
        .getMyLists()
        .then((data) => {
          set({ myLists: data });
        })
        .catch(() => {});
      return get().myLists;
    }

    if (isLoading) return get().myLists;

    set({ isLoading: !hasLoaded });
    try {
      const data = await customListsService.getMyLists();
      set({ myLists: data, hasLoaded: true, isLoading: false });
      return data;
    } catch (err) {
      console.error('Erro ao buscar listas do usuário:', err);
      set({ isLoading: false });
      return [];
    }
  },
}));
