'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Film, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { customListsService } from '@/services/customLists';
import { CustomListSummary } from '@/types/customLists';
import { CustomListCard } from '@/components/custom_lists/CustomListCard';
import { CreateEditListModal } from '@/components/custom_lists/CreateEditListModal';
import { toast } from '@/components/ui/toast';

export default function ListsPage() {
  const [myLists, setMyLists] = useState<CustomListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<CustomListSummary | null>(null);

  const fetchMyLists = useCallback(async () => {
    try {
      const data = await customListsService.getMyLists();
      setMyLists(data);
    } catch (err) {
      console.error('Erro ao buscar listas do usuário:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyLists();
  }, [fetchMyLists]);

  const filteredLists = useMemo(() => {
    if (!searchQuery.trim()) return myLists;
    const q = searchQuery.toLowerCase().trim();
    return myLists.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q))
    );
  }, [myLists, searchQuery]);

  const handleCreateOpen = () => {
    setEditingList(null);
    setModalOpen(true);
  };

  const handleEditOpen = (list: CustomListSummary) => {
    setEditingList(list);
    setModalOpen(true);
  };

  const handleDelete = async (listId: string) => {
    if (!confirm('Tem certeza de que deseja excluir esta lista? Esta ação não pode ser desfeita.')) {
      return;
    }
    try {
      await customListsService.deleteList(listId);
      toast.add({
        title: 'Lista excluída',
        description: 'A lista foi removida com sucesso.',
        type: 'info',
      });
      setMyLists((prev) => prev.filter((l) => l.id !== listId));
    } catch (err) {
      toast.add({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a lista.',
        type: 'error',
      });
    }
  };

  const handleSuccess = (savedList: CustomListSummary) => {
    if (editingList) {
      setMyLists((prev) => prev.map((l) => (l.id === savedList.id ? savedList : l)));
    } else {
      setMyLists((prev) => [savedList, ...prev]);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Coleções & Maratonas</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Minhas Listas
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Crie seleções temáticas como indicados a premiações, sagas e favoritos, e organize seus filmes e séries em listas personalizadas.
          </p>
        </div>

        <Button
          onClick={handleCreateOpen}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Nova Lista
        </Button>
      </div>

      {/* Search and Counts Toolbar */}
      {myLists.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 mb-8">
          <div className="text-sm text-zinc-400 font-medium">
            Você possui <strong className="text-white">{myLists.length}</strong>{' '}
            {myLists.length === 1 ? 'lista criada' : 'listas criadas'}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nas suas listas..."
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">Carregando listas...</span>
        </div>
      ) : myLists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 mt-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Você ainda não criou nenhuma lista</h3>
          <p className="text-zinc-400 text-sm max-w-md mt-1 mb-6">
            Comece agora criando listas como &ldquo;Indicados ao Oscar 2025&rdquo;, &ldquo;Top 10 Terror&rdquo; ou maratonas para assistir no fim de semana.
          </p>
          <Button onClick={handleCreateOpen} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Criar Minha Primeira Lista
          </Button>
        </div>
      ) : filteredLists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8">
          <Search className="w-10 h-10 text-zinc-600 mb-2" />
          <h4 className="text-base font-semibold text-white">Nenhuma lista encontrada</h4>
          <p className="text-xs text-zinc-400 mt-1">Nenhuma lista corresponde ao termo pesquisado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {filteredLists.map((list) => (
            <CustomListCard
              key={list.id}
              list={list}
              isOwner={true}
              onEdit={handleEditOpen}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <CreateEditListModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        listToEdit={editingList}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
