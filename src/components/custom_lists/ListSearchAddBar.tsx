'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, Loader2, Film, Tv, Check, Bookmark, Star } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/lib/axios';
import { SearchMultiResponse, SearchItem } from '@/types/search';
import { customListsService } from '@/services/customLists';
import { CustomListItem } from '@/types/customLists';
import { PosterImage } from '@/components/shared/PosterImage';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { useMyListStore, SavedItem } from '@/store/useMyListStore';
import { AddFromMyListModal } from './AddFromMyListModal';

interface ListSearchAddBarProps {
  listId: string;
  existingTmdbIds: Set<number>;
  onItemAdded: (item: CustomListItem) => void;
}

export function ListSearchAddBar({
  listId,
  existingTmdbIds,
  onItemAdded,
}: ListSearchAddBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [myListModalOpen, setMyListModalOpen] = useState(false);

  const { items: myItems } = useMyListStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 400);

  // Busca instantânea nos itens locais salvos do usuário
  const myMatches = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase().trim();
    return Object.values(myItems)
      .filter((item) => (item.title || '').toLowerCase().includes(q))
      .slice(0, 4);
  }, [debouncedQuery, myItems]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const fetchSearch = async () => {
      setIsLoading(true);
      try {
        const res = await api.get<SearchMultiResponse>(
          `/api/search/multi?query=${encodeURIComponent(debouncedQuery)}`
        );
        // Filtra apenas filmes e séries
        const filtered = (res.data?.results || []).filter(
          (it) => it.media_type === 'movie' || it.media_type === 'tv'
        );
        setResults(filtered);
        setIsOpen(true);
      } catch (err) {
        console.error('Erro ao buscar mídias:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearch();
  }, [debouncedQuery]);

  const handleAdd = async (media: {
    id: number;
    title: string;
    media_type: 'movie' | 'tv';
    poster_path?: string | null;
    backdrop_path?: string | null;
    release_date?: string | null;
  }) => {
    setAddingId(media.id);
    const title = media.title || 'Sem título';

    try {
      const added = await customListsService.addItemToList(listId, {
        tmdb_id: media.id,
        media_type: media.media_type,
        title,
        poster_path: media.poster_path,
        backdrop_path: media.backdrop_path,
        release_date: media.release_date,
      });

      toast.add({
        title: 'Adicionado!',
        description: `"${title}" foi adicionado à lista.`,
        type: 'success',
      });
      onItemAdded(added);
    } catch (error: any) {
      toast.add({
        title: 'Erro ao adicionar',
        description: error?.response?.data?.detail || 'Não foi possível adicionar o item.',
        type: 'error',
      });
    } finally {
      setAddingId(null);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        {/* Input e Dropdown de Busca */}
        <div ref={containerRef} className="relative flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim()) setIsOpen(true);
              }}
              onFocus={() => {
                if (results.length > 0 || myMatches.length > 0) setIsOpen(true);
              }}
              placeholder="Buscar título para adicionar a esta lista..."
              className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-inner"
            />
            {isLoading && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
            )}
          </div>

          {/* Dropdown de resultados */}
          {isOpen && (results.length > 0 || myMatches.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto divide-y divide-zinc-900">
              {/* Seção 1: Itens que já estão na "Minha Lista" do usuário */}
              {myMatches.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 bg-primary/10 border-b border-primary/20 flex items-center justify-between text-[11px] font-bold text-primary uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 fill-primary" />
                      Dos seus títulos salvos (Minha Lista)
                    </span>
                    <span className="text-[10px] lowercase font-normal opacity-80">
                      {myMatches.length} {myMatches.length === 1 ? 'encontrado' : 'encontrados'}
                    </span>
                  </div>
                  {myMatches.map((item) => {
                    const isAlreadyInList = existingTmdbIds.has(item.tmdb_id);
                    const title = item.title || 'Sem título';
                    const year = (item.release_date || '').substring(0, 4);
                    const isAdding = addingId === item.tmdb_id;

                    return (
                      <div
                        key={`my-${item.tmdb_id}`}
                        className="flex items-center justify-between p-2.5 hover:bg-zinc-900/90 transition-colors bg-zinc-900/40"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="relative w-9 h-13 rounded overflow-hidden bg-zinc-900 flex-shrink-0">
                            <PosterImage
                              src={item.poster_path}
                              fallbackSrc={item.backdrop_path}
                              alt={title}
                              fill
                              className="object-cover"
                              sizes="36px"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{title}</p>
                            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                              <span className="capitalize">{item.media_type === 'tv' ? 'Série' : 'Filme'}</span>
                              {year && <span>• {year}</span>}
                              {item.rating && (
                                <span className="text-yellow-400 font-bold flex items-center gap-0.5 text-[11px]">
                                  <Star className="w-3 h-3 fill-yellow-400" /> {item.rating}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          disabled={isAlreadyInList || isAdding}
                          onClick={() =>
                            handleAdd({
                              id: item.tmdb_id,
                              title,
                              media_type: item.media_type,
                              poster_path: item.poster_path,
                              backdrop_path: item.backdrop_path,
                              release_date: item.release_date,
                            })
                          }
                          className={`flex-shrink-0 h-8 px-3 text-xs ${
                            isAlreadyInList
                              ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                              : 'bg-primary hover:bg-primary/90 text-primary-foreground font-semibold'
                          }`}
                        >
                          {isAdding ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isAlreadyInList ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1" /> Na lista
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Seção 2: Catálogo Geral (TMDB) */}
              {results.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Catálogo Geral (TMDB)
                  </div>
                  {results.map((media) => {
                    const isAlreadyInList = existingTmdbIds.has(media.id);
                    const title = media.title || 'Sem título';
                    const year = (media.date || '').substring(0, 4);
                    const isAdding = addingId === media.id;

                    return (
                      <div
                        key={media.id}
                        className="flex items-center justify-between p-2.5 hover:bg-zinc-900 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="relative w-9 h-13 rounded overflow-hidden bg-zinc-900 flex-shrink-0">
                            <PosterImage
                              src={media.image_path}
                              alt={title}
                              fill
                              className="object-cover"
                              sizes="36px"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{title}</p>
                            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                              <span className="flex items-center gap-1">
                                {media.media_type === 'tv' ? (
                                  <Tv className="w-3 h-3 text-primary" />
                                ) : (
                                  <Film className="w-3 h-3 text-primary" />
                                )}
                                {media.media_type === 'tv' ? 'Série' : 'Filme'}
                              </span>
                              {year && <span>• {year}</span>}
                            </div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          disabled={isAlreadyInList || isAdding}
                          onClick={() =>
                            handleAdd({
                              id: media.id,
                              title,
                              media_type: media.media_type as 'movie' | 'tv',
                              poster_path: media.image_path,
                              backdrop_path: null,
                              release_date: media.date,
                            })
                          }
                          className={`flex-shrink-0 h-8 px-3 text-xs ${
                            isAlreadyInList
                              ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                              : 'bg-primary hover:bg-primary/90 text-primary-foreground font-semibold'
                          }`}
                        >
                          {isAdding ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isAlreadyInList ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1" /> Na lista
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botão de Destaque: Escolher da Minha Lista */}
        <Button
          type="button"
          onClick={() => setMyListModalOpen(true)}
          variant="outline"
          className="bg-zinc-900/90 border-zinc-700/80 hover:bg-zinc-800 hover:border-primary/50 text-white text-xs h-10 px-4 shadow-sm flex items-center justify-center gap-2 flex-shrink-0 transition-all font-semibold"
        >
          <Bookmark className="w-4 h-4 text-primary fill-primary/20" />
          <span>Escolher da Minha Lista</span>
        </Button>
      </div>

      {/* Modal Dedicado para Escolher e Importar em Lote da Minha Lista */}
      <AddFromMyListModal
        open={myListModalOpen}
        onOpenChange={setMyListModalOpen}
        listId={listId}
        existingTmdbIds={existingTmdbIds}
        onItemAdded={onItemAdded}
      />
    </>
  );
}
