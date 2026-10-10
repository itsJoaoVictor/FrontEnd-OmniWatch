'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Trophy,
  Clock,
  Film,
  Tv,
  CheckCircle2,
  Edit,
  Trash2,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { customListsService } from '@/services/customLists';
import { CustomListDetail, CustomListItem } from '@/types/customLists';
import { useMyListStore } from '@/store/useMyListStore';
import { CustomListItemGrid } from '@/components/custom_lists/CustomListItemGrid';
import { CustomListItemRow } from '@/components/custom_lists/CustomListItemRow';
import { ListSearchAddBar } from '@/components/custom_lists/ListSearchAddBar';
import { CreateEditListModal } from '@/components/custom_lists/CreateEditListModal';
import { EditItemNoteModal } from '@/components/custom_lists/EditItemNoteModal';

export default function CustomListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params?.id as string;

  const [list, setList] = useState<CustomListDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'row'>('grid');

  // Modais
  const [editListOpen, setEditListOpen] = useState(false);
  const [editingNoteItem, setEditingNoteItem] = useState<CustomListItem | null>(null);

  // Store para progresso de assistidos
  const { items: myTrackingItems } = useMyListStore();

  const fetchList = useCallback(async () => {
    if (!listId) return;
    try {
      const data = await customListsService.getListDetail(listId);
      setList(data);
    } catch (error: any) {
      toast.add({
        title: 'Erro ao carregar lista',
        description: error?.response?.data?.detail || 'Lista não encontrada ou acesso negado.',
        type: 'error',
      });
      router.push('/lists');
    } finally {
      setIsLoading(false);
    }
  }, [listId, router]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Cálculos de métricas
  const { movieCount, tvCount, watchedCount, progressPercent, formattedRuntime } = useMemo(() => {
    if (!list) {
      return { movieCount: 0, tvCount: 0, watchedCount: 0, progressPercent: 0, formattedRuntime: '0m' };
    }

    let movies = 0;
    let tvs = 0;
    let watched = 0;

    for (const it of list.items) {
      if (it.media_type === 'tv') tvs++;
      else movies++;

      const tracking = myTrackingItems[it.tmdb_id];
      if (tracking?.status === 'completed') {
        watched++;
      }
    }

    const total = list.items.length;
    const percent = total > 0 ? Math.round((watched / total) * 100) : 0;

    const totalMinutes = list.total_runtime_minutes || 0;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const runtimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return {
      movieCount: movies,
      tvCount: tvs,
      watchedCount: watched,
      progressPercent: percent,
      formattedRuntime: runtimeStr,
    };
  }, [list, myTrackingItems]);

  const existingTmdbIds = useMemo(() => {
    return new Set(list?.items.map((it) => it.tmdb_id) || []);
  }, [list]);

  const handleDeleteList = async () => {
    if (!list) return;
    if (!confirm(`Deseja realmente excluir a lista "${list.title}"?`)) return;

    try {
      await customListsService.deleteList(list.id);
      toast.add({
        title: 'Lista excluída',
        description: 'A lista foi removida com sucesso.',
        type: 'info',
      });
      router.push('/lists');
    } catch (err: any) {
      toast.add({
        title: 'Erro ao excluir',
        description: err?.response?.data?.detail || 'Não foi possível excluir a lista.',
        type: 'error',
      });
    }
  };

  const handleItemAdded = (newItem: CustomListItem) => {
    if (!list) return;
    setList({
      ...list,
      items: [...list.items, newItem],
      items_count: list.items.length + 1,
      total_runtime_minutes: (list.total_runtime_minutes || 0) + (newItem.runtime || 0),
    });
  };

  const handleRemoveItem = async (item: CustomListItem) => {
    if (!list) return;
    try {
      await customListsService.removeItemFromList(list.id, item.id);
      setList({
        ...list,
        items: list.items.filter((it) => it.id !== item.id),
        items_count: Math.max(0, list.items.length - 1),
        total_runtime_minutes: Math.max(0, (list.total_runtime_minutes || 0) - (item.runtime || 0)),
      });
      toast.add({
        title: 'Item removido',
        description: `"${item.title}" foi removido da lista.`,
        type: 'info',
      });
    } catch (err: any) {
      toast.add({
        title: 'Erro ao remover',
        description: err?.response?.data?.detail || 'Não foi possível remover o item.',
        type: 'error',
      });
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!list) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.items.length) return;

    const newItems = [...list.items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    // Atualiza posições localmente
    const updated = newItems.map((it, idx) => ({ ...it, position: idx }));
    setList({ ...list, items: updated });

    try {
      await customListsService.reorderListItems(
        list.id,
        updated.map((it) => it.id)
      );
    } catch (err) {
      console.error('Erro ao reordenar:', err);
    }
  };

  const handleNoteUpdated = (updatedItem: CustomListItem) => {
    if (!list) return;
    setList({
      ...list,
      items: list.items.map((it) => (it.id === updatedItem.id ? updatedItem : it)),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!list) return null;

  const coverUrl = list.cover_backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${list.cover_backdrop_path}`
    : null;

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header with Backdrop */}
      <div className="relative w-full bg-zinc-950 pt-20 pb-10 border-b border-zinc-800/80 overflow-hidden">
        {coverUrl && (
          <div className="absolute inset-0 z-0">
            <Image
              src={coverUrl}
              alt={list.title}
              fill
              className="object-cover opacity-20 filter blur-sm scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
          </div>
        )}

        <div className="container relative z-10 mx-auto px-4 lg:px-8 max-w-7xl">
          <Link
            href="/lists"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para todas as listas
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                {list.is_ranked && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-black shadow-md">
                    <Trophy className="w-3.5 h-3.5 fill-black" />
                    Lista Ranqueada
                  </span>
                )}
                {list.user_name && (
                  <Link
                    href={`/profile/${list.user_id}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
                    Por {list.user_name}
                  </Link>
                )}
                <span className="text-xs text-zinc-400">
                  {list.user_name ? '• ' : ''}Criada em {new Date(list.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {list.title}
              </h1>

              {list.description && (
                <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                  {list.description}
                </p>
              )}
            </div>

            {/* Actions for list */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {list.is_owner && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditListOpen(true)}
                    className="bg-zinc-900/80 border-zinc-700 hover:bg-zinc-800 text-white text-xs"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1.5 text-primary" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteList}
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/40"
                    title="Excluir Lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats Bar and User Checklist Progress */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Total de Títulos</p>
                <p className="text-base font-bold text-white">
                  {list.items.length} {list.items.length === 1 ? 'item' : 'itens'}
                  <span className="text-xs text-zinc-500 font-normal ml-1">
                    ({movieCount} filmes, {tvCount} séries)
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Tempo de Maratona</p>
                <p className="text-base font-bold text-white">{formattedRuntime}</p>
              </div>
            </div>

            {/* User Personal Progress Checklist */}
            <div className="sm:col-span-2 flex flex-col justify-center p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Seu Progresso nesta Lista</span>
                </div>
                <span className="text-zinc-400 font-semibold">
                  {watchedCount} de {list.items.length} assistidos ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl mt-8">
        {/* Toolbar: Search Add Bar (if owner) and View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          {list.is_owner ? (
            <ListSearchAddBar
              listId={list.id}
              existingTmdbIds={existingTmdbIds}
              onItemAdded={handleItemAdded}
            />
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs text-zinc-400 mr-1 hidden sm:inline">Visualização:</span>
            <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Grade de Pôsteres"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('row')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'row'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Lista Detalhada"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Items Display */}
        <div className="mt-6">
          {list.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-zinc-800 p-8">
              <Film className="w-12 h-12 text-zinc-600 mb-3" />
              <h3 className="text-base font-bold text-white">Esta lista ainda está vazia</h3>
              {list.is_owner ? (
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Use o campo de busca acima ou clique em &ldquo;Salvar em Lista&rdquo; na página de qualquer filme ou série para preencher esta lista.
                </p>
              ) : (
                <p className="text-xs text-zinc-400 mt-1">O autor ainda não adicionou nenhum título.</p>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <CustomListItemGrid
              items={list.items}
              isRanked={list.is_ranked}
              isOwner={list.is_owner}
              onMoveUp={(idx) => handleMove(idx, 'up')}
              onMoveDown={(idx) => handleMove(idx, 'down')}
              onEditNote={(it) => setEditingNoteItem(it)}
              onRemove={handleRemoveItem}
            />
          ) : (
            <div className="space-y-2">
              {list.items.map((it, idx) => (
                <CustomListItemRow
                  key={it.id}
                  item={it}
                  index={idx}
                  totalItems={list.items.length}
                  isRanked={list.is_ranked}
                  isOwner={list.is_owner}
                  onMoveUp={(i) => handleMove(i, 'up')}
                  onMoveDown={(i) => handleMove(i, 'down')}
                  onEditNote={(item) => setEditingNoteItem(item)}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit List Modal */}
      <CreateEditListModal
        open={editListOpen}
        onOpenChange={setEditListOpen}
        listToEdit={list}
        onSuccess={(updated) => {
          setList({ ...list, ...updated });
        }}
      />

      {/* Edit Note Modal */}
      <EditItemNoteModal
        open={Boolean(editingNoteItem)}
        onOpenChange={(op) => !op && setEditingNoteItem(null)}
        listId={list.id}
        item={editingNoteItem}
        onSuccess={handleNoteUpdated}
      />
    </div>
  );
}
