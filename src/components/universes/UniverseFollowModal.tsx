'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  X,
  Search,
  CheckSquare,
  Square,
  Film,
  Tv,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Ban,
  Clock,
  Zap,
} from 'lucide-react';
import { UserFollowedUniverse, UniverseFollowedItem, UniverseFollowPayload } from '@/types/universes';
import { getUniverseDetails, followUniverse } from '@/services/universes';

function getTmdbImageUrl(path?: string | null, size = 'w185') {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

interface UniverseFollowModalProps {
  isOpen: boolean;
  universeKey: string;
  universeName: string;
  initialDetails?: UserFollowedUniverse | null;
  onClose: () => void;
  onSuccess: (result: { items_added: number; ignored_count: number }) => void;
}

export function UniverseFollowModal({
  isOpen,
  universeKey,
  universeName,
  initialDetails,
  onClose,
  onSuccess,
}: UniverseFollowModalProps) {
  const [details, setDetails] = useState<UserFollowedUniverse | null>(initialDetails || null);
  const [loading, setLoading] = useState<boolean>(!initialDetails);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [autoAdd, setAutoAdd] = useState<boolean>(true);
  // Conjunto de chaves "(tmdb_id,media_type)" dos itens selecionados para inclusão
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Carrega os detalhes do universo se ainda não foram fornecidos
  useEffect(() => {
    if (!isOpen) return;

    if (initialDetails && initialDetails.universe_key === universeKey) {
      setDetails(initialDetails);
      initSelected(initialDetails.items);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getUniverseDetails(universeKey)
      .then((data) => {
        if (!isMounted) return;
        setDetails(data);
        initSelected(data.items);
      })
      .catch((err) => {
        console.error('Erro ao carregar detalhes do universo para o modal:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, universeKey, initialDetails]);

  function initSelected(items: UniverseFollowedItem[]) {
    const initial = new Set<string>();
    items.forEach((item) => {
      const key = `${item.tmdb_id}-${item.media_type}`;
      if (isItemWatched(item)) {
        initial.add(key);
      } else if (!item.is_ignored && !item.is_recap) {
        initial.add(key);
      }
    });
    setSelectedKeys(initial);
  }

  function isItemWatched(item: UniverseFollowedItem): boolean {
    return (
      item.status === 'completed' ||
      item.status === 'watched' ||
      (typeof item.rating === 'number' && item.rating > 0)
    );
  }

  function toggleItem(item: UniverseFollowedItem) {
    if (isItemWatched(item)) return; // Itens já assistidos são fixos

    const key = `${item.tmdb_id}-${item.media_type}`;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  // Ações Rápidas
  function handleSelectAll() {
    if (!details) return;
    const all = new Set<string>();
    details.items.forEach((item) => all.add(`${item.tmdb_id}-${item.media_type}`));
    setSelectedKeys(all);
  }

  function handleDeselectPending() {
    if (!details) return;
    const onlyWatched = new Set<string>();
    details.items.forEach((item) => {
      if (isItemWatched(item)) {
        onlyWatched.add(`${item.tmdb_id}-${item.media_type}`);
      }
    });
    setSelectedKeys(onlyWatched);
  }

  function handleOnlyMovies() {
    if (!details) return;
    const next = new Set<string>();
    details.items.forEach((item) => {
      if (isItemWatched(item) || item.media_type === 'movie') {
        next.add(`${item.tmdb_id}-${item.media_type}`);
      }
    });
    setSelectedKeys(next);
  }

  function handleOnlyTv() {
    if (!details) return;
    const next = new Set<string>();
    details.items.forEach((item) => {
      if (isItemWatched(item) || item.media_type === 'tv') {
        next.add(`${item.tmdb_id}-${item.media_type}`);
      }
    });
    setSelectedKeys(next);
  }

  function handleDeselectMovies() {
    if (!details) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      details.items.forEach((item) => {
        if (item.media_type === 'movie' && !isItemWatched(item)) {
          next.delete(`${item.tmdb_id}-${item.media_type}`);
        }
      });
      return next;
    });
  }

  function handleDeselectRecaps() {
    if (!details) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      details.items.forEach((item) => {
        if (item.is_recap && !isItemWatched(item)) {
          next.delete(`${item.tmdb_id}-${item.media_type}`);
        }
      });
      return next;
    });
  }

  const filteredItems = useMemo(() => {
    if (!details) return [];
    let items = details.items;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      items = items.filter((item) => item.title.toLowerCase().includes(term));
    }
    return items;
  }, [details, searchTerm]);

  // Contadores
  const totalItems = details?.items.length || 0;
  const watchedCount = useMemo(() => {
    if (!details) return 0;
    return details.items.filter(isItemWatched).length;
  }, [details]);

  const toAddCount = useMemo(() => {
    if (!details) return 0;
    return details.items.filter(
      (item) => !isItemWatched(item) && selectedKeys.has(`${item.tmdb_id}-${item.media_type}`)
    ).length;
  }, [details, selectedKeys]);

  const ignoredCount = useMemo(() => {
    if (!details) return 0;
    return details.items.filter(
      (item) => !isItemWatched(item) && !selectedKeys.has(`${item.tmdb_id}-${item.media_type}`)
    ).length;
  }, [details, selectedKeys]);

  const hasRecaps = useMemo(() => {
    return details?.items.some((item) => item.is_recap && !isItemWatched(item)) ?? false;
  }, [details]);

  async function handleConfirmFollow() {
    if (!details || submitting) return;
    try {
      setSubmitting(true);
      // Monta a lista de itens ignorados (não selecionados)
      const ignoredItemsPayload: { tmdb_id: number; media_type: string }[] = [];
      details.items.forEach((item) => {
        const key = `${item.tmdb_id}-${item.media_type}`;
        if (!selectedKeys.has(key)) {
          ignoredItemsPayload.push({
            tmdb_id: item.tmdb_id,
            media_type: item.media_type,
          });
        }
      });

      const payload: UniverseFollowPayload = {
        auto_add: autoAdd,
        ignored_items: ignoredItemsPayload,
      };

      const res = await followUniverse(universeKey, payload);
      onSuccess({
        items_added: res.items_added,
        ignored_count: ignoredItemsPayload.length,
      });
      onClose();
    } catch (err) {
      console.error('Erro ao seguir universo com itens customizados:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-950 border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-950/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between p-5 border-b border-purple-900/40 bg-gradient-to-r from-purple-950/40 to-slate-950">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-md bg-purple-900/60 text-purple-300">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Configurar Acompanhamento do Universo
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{universeName}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Escolha quais obras deseja adicionar à sua lista e como gerenciar futuros lançamentos.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-purple-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Carregando catálogo canônico...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-5 gap-4">
            {/* Barra de Ações Rápidas */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
                >
                  Marcar Todos
                </button>
                <button
                  type="button"
                  onClick={handleDeselectPending}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
                >
                  Desmarcar Pendentes
                </button>
                <button
                  type="button"
                  onClick={handleDeselectMovies}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
                  title="Desmarcar todos os filmes pendentes (não assistidos)"
                >
                  <Ban className="w-3 h-3 text-red-400" /> Desmarcar Filmes
                </button>
                <button
                  type="button"
                  onClick={handleOnlyMovies}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
                >
                  <Film className="w-3 h-3 text-purple-400" /> Apenas Filmes
                </button>
                <button
                  type="button"
                  onClick={handleOnlyTv}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
                >
                  <Tv className="w-3 h-3 text-blue-400" /> Apenas Séries
                </button>

                {hasRecaps && (
                  <button
                    type="button"
                    onClick={handleDeselectRecaps}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-700/60 transition-colors ml-auto"
                    title="Desmarca filmes que são apenas compilações de episódios da TV"
                  >
                    <Ban className="w-3 h-3 text-amber-400" /> Desmarcar Recaps
                  </button>
                )}
              </div>

              {/* Campo de Busca & Resumo */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar obras por título..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
                  />
                </div>

                <div className="text-xs text-slate-400 whitespace-nowrap bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-purple-300 font-semibold">{toAddCount}</span> a adicionar •{' '}
                  <span className="text-emerald-400 font-semibold">{watchedCount}</span> já assistidos •{' '}
                  <span className="text-slate-500 font-semibold">{ignoredCount}</span> ignorados
                </div>
              </div>
            </div>

            {/* Lista Rolável de Obras */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5 border border-slate-800/80 rounded-xl p-2 bg-slate-900/30">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  Nenhuma obra encontrada para &quot;{searchTerm}&quot;.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const key = `${item.tmdb_id}-${item.media_type}`;
                  const isWatched = isItemWatched(item);
                  const isSelected = selectedKeys.has(key);

                  return (
                    <div
                      key={key}
                      onClick={() => !isWatched && toggleItem(item)}
                      className={`flex items-center gap-3 p-2 rounded-xl border transition-all select-none ${
                        isWatched
                          ? 'bg-emerald-950/20 border-emerald-800/30 cursor-default'
                          : isSelected
                          ? 'bg-purple-950/30 border-purple-800/50 hover:bg-purple-900/30 cursor-pointer'
                          : 'bg-slate-900/40 border-slate-800/40 opacity-60 hover:opacity-100 hover:bg-slate-800/40 cursor-pointer'
                      }`}
                    >
                      {/* Checkbox Visual */}
                      <div className="flex-shrink-0">
                        {isWatched ? (
                          <div className="w-5 h-5 rounded-md bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/50">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : isSelected ? (
                          <div className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center shadow-sm">
                            <CheckSquare className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md border border-slate-700 bg-slate-900/80 flex items-center justify-center text-transparent">
                            <Square className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Poster Miniatura */}
                      <div className="relative w-9 h-13 rounded-md overflow-hidden bg-slate-800 flex-shrink-0">
                        {item.poster_path ? (
                          <Image
                            src={getTmdbImageUrl(item.poster_path, 'w92')}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="36px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">
                            {item.media_type === 'tv' ? <Tv className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                          </div>
                        )}
                      </div>

                      {/* Informações da Obra */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                          {item.media_type === 'tv' ? (
                            <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-800/50">
                              Série
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-800/50">
                              Filme
                            </span>
                          )}
                          {item.is_recap && (
                            <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/50">
                              Recap
                            </span>
                          )}
                          {!isSelected && !isWatched && (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/60 flex items-center gap-1">
                              <Ban className="w-2.5 h-2.5 text-slate-400" /> Ignorado
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>{item.release_date?.slice(0, 4) || 'Em breve'}</span>
                          {item.collection_name && (
                            <>
                              <span>•</span>
                              <span className="truncate text-slate-500">{item.collection_name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status Atual na Lista */}
                      <div className="flex-shrink-0 text-right">
                        {isWatched ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                            <CheckCircle2 className="w-3 h-3" /> Já Assistido
                          </span>
                        ) : isSelected ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/40">
                            <Clock className="w-3 h-3" /> Adicionar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
                            <Ban className="w-3 h-3 text-slate-500" /> Ignorado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Configuração de Futuros Lançamentos */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-900/40">
              <div className="flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    Auto-adicionar novos lançamentos descobertos
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Novos filmes e séries anunciados para este universo serão incluídos automaticamente na sua lista.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={autoAdd}
                  onChange={(e) => setAutoAdd(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        )}

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-between p-4 border-t border-purple-900/40 bg-slate-950">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmFollow}
            disabled={loading || submitting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 shadow-lg shadow-purple-950/60 transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Seguindo Universo...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Confirmar e Seguir ({toAddCount} a adicionar)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
