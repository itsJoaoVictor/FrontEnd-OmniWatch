'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { customListsService } from '@/services/customLists';
import { MediaListMembership } from '@/types/customLists';
import { CreateEditListModal } from './CreateEditListModal';
import { Plus, Check, Loader2, ListPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveToCustomListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: {
    tmdb_id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    release_date?: string | null;
    runtime?: number;
  };
}

export function SaveToCustomListModal({
  open,
  onOpenChange,
  media,
}: SaveToCustomListModalProps) {
  const [lists, setLists] = useState<MediaListMembership[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingListId, setLoadingListId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchMembership = useCallback(async () => {
    if (!open || !media.tmdb_id) return;
    setIsLoading(true);
    try {
      const data = await customListsService.getMediaMembership(media.tmdb_id, media.media_type);
      setLists(data);
    } catch (error) {
      console.error('Erro ao carregar listas do usuário:', error);
    } finally {
      setIsLoading(false);
    }
  }, [open, media.tmdb_id, media.media_type]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  const handleToggle = async (membership: MediaListMembership) => {
    if (loadingListId) return;
    setLoadingListId(membership.list_id);

    try {
      if (membership.contains_media && membership.item_id) {
        // Remover da lista
        await customListsService.removeItemFromList(membership.list_id, membership.item_id);
        setLists((prev) =>
          prev.map((l) =>
            l.list_id === membership.list_id
              ? { ...l, contains_media: false, item_id: null }
              : l
          )
        );
        toast.add({
          title: 'Removido da lista',
          description: `Removido de "${membership.title}".`,
          type: 'info',
        });
      } else {
        // Adicionar à lista
        const newItem = await customListsService.addItemToList(membership.list_id, {
          tmdb_id: media.tmdb_id,
          media_type: media.media_type,
          title: media.title,
          poster_path: media.poster_path,
          backdrop_path: media.backdrop_path,
          release_date: media.release_date,
          runtime: media.runtime,
        });
        setLists((prev) =>
          prev.map((l) =>
            l.list_id === membership.list_id
              ? { ...l, contains_media: true, item_id: newItem.id }
              : l
          )
        );
        toast.add({
          title: 'Adicionado à lista!',
          description: `Salvo em "${membership.title}".`,
          type: 'success',
        });
      }
    } catch (error: any) {
      toast.add({
        title: 'Erro ao atualizar lista',
        description: error?.response?.data?.detail || 'Não foi possível salvar na lista.',
        type: 'error',
      });
    } finally {
      setLoadingListId(null);
    }
  };

  const handleListCreated = async (newList: any) => {
    // Adiciona imediatamente a mídia à nova lista
    try {
      await customListsService.addItemToList(newList.id, {
        tmdb_id: media.tmdb_id,
        media_type: media.media_type,
        title: media.title,
        poster_path: media.poster_path,
        backdrop_path: media.backdrop_path,
        release_date: media.release_date,
        runtime: media.runtime,
      });
      toast.add({
        title: 'Adicionado à nova lista!',
        description: `Adicionado à lista recém-criada "${newList.title}".`,
        type: 'success',
      });
    } catch (e) {
      console.error(e);
    }
    fetchMembership();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white p-6">
          <DialogHeader className="pb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <ListPlus className="w-5 h-5 text-primary" />
              <DialogTitle className="text-lg font-bold">
                Salvar em uma Lista
              </DialogTitle>
            </div>
            <p className="text-xs text-zinc-400 mt-1 truncate">
              {media.title}
            </p>
          </DialogHeader>

          <div className="py-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">Carregando suas listas...</span>
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                <p className="text-sm">Você ainda não possui nenhuma lista personalizada.</p>
                <p className="text-xs text-zinc-500 mt-1">Crie sua primeira lista para organizar seus títulos favoritos!</p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {lists.map((l) => {
                  const isOperating = loadingListId === l.list_id;
                  return (
                    <button
                      key={l.list_id}
                      onClick={() => handleToggle(l)}
                      disabled={isOperating}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all',
                        l.contains_media
                          ? 'bg-primary/10 border-primary/40 text-white'
                          : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={cn(
                            'w-5 h-5 rounded flex items-center justify-center border transition-colors flex-shrink-0',
                            l.contains_media
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-zinc-700 bg-zinc-950'
                          )}
                        >
                          {isOperating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : l.contains_media ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : null}
                        </div>
                        <span className="text-sm font-medium truncate">{l.title}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="border-dashed border-zinc-700 bg-transparent hover:bg-zinc-900 text-xs text-zinc-200"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-primary" />
              Criar Nova Lista
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-zinc-800 hover:bg-zinc-700 text-xs text-white"
            >
              Concluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateEditListModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleListCreated}
      />
    </>
  );
}
