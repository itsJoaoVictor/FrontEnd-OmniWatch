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
import { toast } from '@/components/ui/toast';
import { customListsService } from '@/services/customLists';
import { CustomListItem } from '@/types/customLists';
import { MessageSquare, Loader2 } from 'lucide-react';

interface EditItemNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  item: CustomListItem | null;
  onSuccess: (updatedItem: CustomListItem) => void;
}

export function EditItemNoteModal({
  open,
  onOpenChange,
  listId,
  item,
  onSuccess,
}: EditItemNoteModalProps) {
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setNote(item.note || '');
    }
  }, [item, open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setIsLoading(true);
    try {
      const updated = await customListsService.updateListItem(listId, item.id, {
        note: note.trim() || undefined,
      });
      toast.add({
        title: 'Anotação salva!',
        description: 'Nota atualizada com sucesso.',
        type: 'success',
      });
      onSuccess(updated);
      onOpenChange(false);
    } catch (error: any) {
      toast.add({
        title: 'Erro ao salvar',
        description: error?.response?.data?.detail || 'Não foi possível salvar a anotação.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <DialogTitle className="text-lg font-bold">Anotação para &quot;{item.title}&quot;</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: Indicado a 7 Oscars; minha cena favorita é a introdução..."
            rows={4}
            maxLength={500}
            disabled={isLoading}
            className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 resize-none"
          />

          <DialogFooter className="pt-2 flex gap-2 justify-end">
            <DialogClose render={<Button type="button" variant="ghost" disabled={isLoading} />}>
              Cancelar
            </DialogClose>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Anotação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
