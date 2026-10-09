'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { useMyListStore, SavedItem, ListStatus } from '@/store/useMyListStore';
import { customListsService } from '@/services/customLists';
import { CustomListItem } from '@/types/customLists';
import { PosterImage } from '@/components/shared/PosterImage';
import {
  Bookmark,
  Search,
  Plus,
  Check,
  Loader2,
  Film,
  Tv,
  Star,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddFromMyListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  existingTmdbIds: Set<number>;
  onItemAdded: (item: CustomListItem) => void;
}

type FilterCategory = 'all' | 'favorites' | 'completed' | 'watching' | 'plan_to_watch' | 'movie' | 'tv';

const statusLabels: Record<ListStatus, string> = {
  plan_to_watch: 'Quero Ver',
  watching: 'Assistindo',
  completed: 'Assistido',
  dropped: 'Abandonei',
  upcoming: 'Estreia',
};

export function AddFromMyListModal({
  open,
  onOpenChange,
  listId,
  existingTmdbIds,
  onItemAdded,
}: AddFromMyListModalProps) {
  const { items, fetchMyList, isLoading } = useMyListStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FilterCategory>('all');
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkAdding, setIsBulkAdding] = useState(false);

  useEffect(() => {
    if (open && Object.keys(items).length === 0) {
      fetchMyList();
    }
  }, [open, items, fetchMyList]);

  const allItemsList = useMemo(() => {
    return Object.values(items).sort((a, b) => {
      const titleA = a.title || '';
      const titleB = b.title || '';
      return titleA.localeCompare(titleB);
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    return allItemsList.filter((item) => {
      // Filtro de texto
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        if (!titleMatch) return false;
      }

      // Filtro de categoria
      if (category === 'favorites') {
        return !!item.is_favorite;
      }
      if (category === 'movie') {
        return item.media_type === 'movie';
      }
      if (category === 'tv') {
        return item.media_type === 'tv';
      }
      if (['completed', 'watching', 'plan_to_watch'].includes(category)) {
        return item.status === category;
      }

      return true;
    });
  }, [allItemsList, search, category]);

  const handleAddSingle = async (item: SavedItem) => {
    if (addingIds.has(item.tmdb_id) || existingTmdbIds.has(item.tmdb_id)) return;

    setAddingIds((prev) => new Set(prev).add(item.tmdb_id));
    try {
      const added = await customListsService.addItemToList(listId, {
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
        title: item.title || 'Sem título',
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        release_date: item.release_date,
      });

      toast.add({
        title: 'Adicionado à lista!',
        description: `"${item.title}" foi incluído.`,
        type: 'success',
      });
      onItemAdded(added);
    } catch (error: any) {
      toast.add({
        title: 'Erro ao adicionar',
        description: error?.response?.data?.detail || 'Não foi possível adicionar o título.',
        type: 'error',
      });
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.tmdb_id);
        return next;
      });
    }
  };

  const toggleSelect = (tmdbId: number) => {
    if (existingTmdbIds.has(tmdbId)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tmdbId)) next.delete(tmdbId);
      else next.add(tmdbId);
      return next;
    });
  };

  const handleBulkAdd = async () => {
    const toAdd = allItemsList.filter(
      (it) => selectedIds.has(it.tmdb_id) && !existingTmdbIds.has(it.tmdb_id)
    );
    if (toAdd.length === 0) return;

    setIsBulkAdding(true);
    let successCount = 0;

    for (const item of toAdd) {
      try {
        const added = await customListsService.addItemToList(listId, {
          tmdb_id: item.tmdb_id,
          media_type: item.media_type,
          title: item.title || 'Sem título',
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: item.release_date,
        });
        onItemAdded(added);
        successCount++;
      } catch (e) {
        console.error(e);
      }
    }

    setIsBulkAdding(false);
    setSelectedIds(new Set());
    toast.add({
      title: 'Títulos adicionados!',
      description: `${successCount} títulos foram adicionados com sucesso à sua lista.`,
      type: 'success',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-zinc-950 border-zinc-800 text-white max-h-[88vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            <DialogTitle className="text-xl font-bold">
              Escolher da Minha Lista
            </DialogTitle>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Selecione filmes e séries que você já acompanha ou salvou no OmniWatch para incluir nesta lista personalizada.
          </p>
        </DialogHeader>

        {/* Filters and Search */}
        <div className="py-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pelo título nos seus salvos..."
              className="bg-zinc-900 border-zinc-700/80 pl-9 text-sm text-white placeholder:text-zinc-500 focus-visible:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setCategory('all')}
              className={cn(
                'px-2.5 py-1 rounded-full font-medium transition-colors',
                category === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              Todos ({allItemsList.length})
            </button>
            <button
              onClick={() => setCategory('favorites')}
              className={cn(
                'px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1',
                category === 'favorites'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <Star className="w-3 h-3 fill-current" /> Favoritos
            </button>
            <button
              onClick={() => setCategory('completed')}
              className={cn(
                'px-2.5 py-1 rounded-full font-medium transition-colors',
                category === 'completed'
                  ? 'bg-emerald-500 text-black font-semibold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              Assistidos
            </button>
            <button
              onClick={() => setCategory('watching')}
              className={cn(
                'px-2.5 py-1 rounded-full font-medium transition-colors',
                category === 'watching'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              Assistindo
            </button>
            <button
              onClick={() => setCategory('plan_to_watch')}
              className={cn(
                'px-2.5 py-1 rounded-full font-medium transition-colors',
                category === 'plan_to_watch'
                  ? 'bg-blue-500 text-black font-semibold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              Quero Ver
            </button>
            <button
              onClick={() => setCategory('movie')}
              className={cn(
                'px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1',
                category === 'movie'
                  ? 'bg-zinc-200 text-black font-semibold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <Film className="w-3 h-3" /> Apenas Filmes
            </button>
            <button
              onClick={() => setCategory('tv')}
              className={cn(
                'px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1',
                category === 'tv'
                  ? 'bg-zinc-200 text-black font-semibold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <Tv className="w-3 h-3" /> Apenas Séries
            </button>
          </div>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[300px] max-h-[460px] space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Carregando seus títulos salvos...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-400">
              <p className="text-sm font-semibold">Nenhum título encontrado com esses filtros.</p>
              <p className="text-xs text-zinc-500 mt-1">Tente ajustar a busca ou a categoria.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isInList = existingTmdbIds.has(item.tmdb_id);
              const isSelected = selectedIds.has(item.tmdb_id);
              const isAdding = addingIds.has(item.tmdb_id);

              return (
                <div
                  key={item.tmdb_id}
                  onClick={() => !isInList && toggleSelect(item.tmdb_id)}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none',
                    isInList
                      ? 'bg-zinc-900/30 border-zinc-800/40 opacity-60 cursor-default'
                      : isSelected
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {/* Checkbox for bulk select */}
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                        isInList
                          ? 'border-zinc-700 bg-zinc-800/50'
                          : isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-zinc-700 bg-zinc-950'
                      )}
                    >
                      {isInList || isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                    </div>

                    {/* Poster */}
                    <div className="relative w-10 h-14 rounded overflow-hidden bg-zinc-950 flex-shrink-0">
                      <PosterImage
                        src={item.poster_path}
                        fallbackSrc={item.backdrop_path}
                        alt={item.title || ''}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>

                    {/* Details */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {item.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-0.5">
                        <span className="capitalize">{item.media_type === 'tv' ? 'Série' : 'Filme'}</span>
                        {item.release_date && (
                          <span>• {item.release_date.substring(0, 4)}</span>
                        )}
                        <span className="inline-block px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-300">
                          {statusLabels[item.status]}
                        </span>
                        {item.rating && (
                          <span className="text-yellow-400 font-bold flex items-center gap-0.5 text-[11px]">
                            <Star className="w-3 h-3 fill-yellow-400" /> {item.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Single Action Button */}
                  <div className="flex-shrink-0">
                    {isInList ? (
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-500 font-medium px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
                        <Check className="w-3.5 h-3.5" /> Na lista
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isAdding || isBulkAdding}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddSingle(item);
                        }}
                        className="h-8 px-2.5 text-xs bg-zinc-800 hover:bg-primary hover:text-primary-foreground text-zinc-200 transition-colors"
                      >
                        {isAdding ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Bulk Add Option */}
        <DialogFooter className="pt-3 border-t border-zinc-800/80 flex flex-row items-center justify-between">
          <div className="text-xs text-zinc-400">
            {selectedIds.size > 0 ? (
              <span>
                <strong>{selectedIds.size}</strong> título(s) selecionado(s)
              </span>
            ) : (
              <span>Clique em um título para selecionar em lote ou adicione diretamente.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                disabled={isBulkAdding}
                onClick={handleBulkAdd}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold"
              >
                {isBulkAdding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                )}
                Adicionar Selecionados ({selectedIds.size})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 bg-transparent hover:bg-zinc-900 text-xs text-zinc-200"
            >
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
