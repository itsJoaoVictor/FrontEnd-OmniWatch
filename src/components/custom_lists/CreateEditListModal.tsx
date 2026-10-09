'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { customListsService } from '@/services/customLists';
import { CustomListSummary, CustomListDetail } from '@/types/customLists';
import { Loader2 } from 'lucide-react';

interface CreateEditListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listToEdit?: CustomListSummary | CustomListDetail | null;
  onSuccess?: (list: CustomListSummary) => void;
}

export function CreateEditListModal({
  open,
  onOpenChange,
  listToEdit,
  onSuccess,
}: CreateEditListModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isRanked, setIsRanked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (listToEdit) {
      setTitle(listToEdit.title || '');
      setDescription(listToEdit.description || '');
      setIsRanked(listToEdit.is_ranked ?? false);
    } else {
      setTitle('');
      setDescription('');
      setIsRanked(false);
    }
  }, [listToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.add({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o título da lista.',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (listToEdit) {
        const updated = await customListsService.updateList(listToEdit.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          is_ranked: isRanked,
        });
        toast.add({
          title: 'Lista atualizada!',
          description: `A lista "${updated.title}" foi salva.`,
          type: 'success',
        });
        onOpenChange(false);
        if (onSuccess) onSuccess(updated);
      } else {
        const created = await customListsService.createList({
          title: title.trim(),
          description: description.trim() || undefined,
          is_ranked: isRanked,
        });
        toast.add({
          title: 'Lista criada com sucesso!',
          description: `A lista "${created.title}" está pronta.`,
          type: 'success',
        });
        onOpenChange(false);
        if (onSuccess) onSuccess(created);
      }
    } catch (error: any) {
      toast.add({
        title: 'Erro ao salvar lista',
        description: error?.response?.data?.detail || 'Ocorreu um erro ao salvar a lista.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {listToEdit ? 'Editar Lista' : 'Criar Nova Lista'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">
              Nome da Lista <span className="text-primary">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Indicados ao Oscar 2025, Melhores de Sci-Fi..."
              maxLength={255}
              disabled={isLoading}
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione uma breve descrição sobre o tema da lista..."
              rows={3}
              maxLength={1000}
              disabled={isLoading}
              className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 resize-none"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isRanked}
                onChange={(e) => setIsRanked(e.target.checked)}
                disabled={isLoading}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-primary accent-primary focus:ring-primary cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                  Lista Ranqueada (Top / Ordenada)
                </span>
                <span className="text-xs text-zinc-400 leading-snug">
                  Exibe posição numérica (1º, 2º, 3º...) em cada filme ou série.
                </span>
              </div>
            </label>
          </div>

          <DialogFooter className="pt-4 flex gap-2 justify-end border-t border-zinc-800/80">
            <DialogClose render={<Button type="button" variant="ghost" disabled={isLoading} />}>
              Cancelar
            </DialogClose>
            <Button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {listToEdit ? 'Salvar Alterações' : 'Criar Lista'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
