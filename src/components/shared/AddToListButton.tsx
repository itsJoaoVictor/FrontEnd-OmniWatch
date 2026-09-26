'use client';

import { useState } from 'react';
import { useMyListStore, ListStatus } from '@/store/useMyListStore';
import { Button } from '@/components/ui/button';
import { Plus, Check, Star, StarHalf, Bookmark, Play, XCircle, Clock, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

interface AddToListButtonProps {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  className?: string;
  title?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
}

const statusConfig: Record<ListStatus, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  borderClass: string;
  dotColor: string;
}> = {
  plan_to_watch: {
    label: 'Quero Ver',
    icon: Bookmark,
    colorClass: 'text-blue-400',
    borderClass: 'border-blue-500/50 hover:border-blue-400',
    dotColor: 'bg-blue-400',
  },
  watching: {
    label: 'Assistindo',
    icon: Play,
    colorClass: 'text-amber-400',
    borderClass: 'border-amber-500/50 hover:border-amber-400',
    dotColor: 'bg-amber-400',
  },
  completed: {
    label: 'Assistido',
    icon: Check,
    colorClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/50 hover:border-emerald-400',
    dotColor: 'bg-emerald-400',
  },
  dropped: {
    label: 'Abandonei',
    icon: XCircle,
    colorClass: 'text-rose-400',
    borderClass: 'border-rose-500/50 hover:border-rose-400',
    dotColor: 'bg-rose-400',
  },
  upcoming: {
    label: 'Aguardando Estreia',
    icon: Clock,
    colorClass: 'text-purple-400',
    borderClass: 'border-purple-500/50 hover:border-purple-400',
    dotColor: 'bg-purple-400',
  },
};

export function AddToListButton({ tmdb_id, media_type, className, title, poster_path, backdrop_path, release_date }: AddToListButtonProps) {
  const { items, addToList, updateStatus, updateRating, removeFromList } = useMyListStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const numericTmdbId = Number(tmdb_id);
  const isValidId = !isNaN(numericTmdbId) && numericTmdbId > 0;
  const savedItem = isValidId ? items[numericTmdbId] : undefined;
  const isInList = !!savedItem;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isValidId) return;
    addToList(numericTmdbId, media_type, { title, poster_path, backdrop_path, release_date });
  };

  const handleStatusChange = (newStatus: ListStatus, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isValidId) return;

    setIsOpen(true);

    const prevStatus = savedItem?.status;
    updateStatus(numericTmdbId, newStatus);

    if (newStatus === 'plan_to_watch') {
      toast.add({
        title: 'Status alterado',
        description: 'Movido para "Quero Ver".',
        type: 'info',
      });
    } else if (newStatus === 'completed' && prevStatus !== 'completed') {
      toast.add({
        title: 'Marcado como Assistido!',
        description: 'Você já pode dar sua nota abaixo.',
        type: 'success',
      });
    }
  };

  const handleRate = (value: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isValidId) return;

    updateRating(numericTmdbId, value);
    toast.add({
      title: 'Nota registrada!',
      description: `Avaliado com nota ${value.toFixed(1)}.`,
      type: 'success',
    });

    // Fecha suavemente após breve feedback
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isValidId) return;

    removeFromList(numericTmdbId);
    setIsOpen(false);
    toast.add({
      title: 'Removido da lista',
      description: 'O título foi removido da sua lista.',
      type: 'info',
    });
  };

  if (!isInList) {
    return (
      <Button
        onClick={handleAdd}
        size="icon"
        className={cn('h-10 w-10 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] bg-black/60 hover:bg-black/80 text-white border border-white/40 backdrop-blur-md transition-transform hover:scale-105', className)}
        title="Adicionar à Lista"
      >
        <Plus className="h-5 w-5" />
      </Button>
    );
  }

  const currentConfig = statusConfig[savedItem.status] || statusConfig.plan_to_watch;
  const StatusIcon = currentConfig.icon;

  return (
    <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          className={cn(
            'inline-flex items-center justify-center h-10 w-10 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.6)] bg-black/70 hover:bg-black/90 backdrop-blur-md transition-all duration-200 hover:scale-105 border',
            currentConfig.borderClass,
            currentConfig.colorClass,
            className
          )}
          title={`Status: ${currentConfig.label} (Clique para alterar)`}
        >
          <StatusIcon className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-2xl backdrop-blur-md">
          <div className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Status na Lista</span>
          </div>
          <DropdownMenuSeparator />
          {(() => {
            const effectiveReleaseDate = (release_date !== undefined && release_date !== null)
              ? release_date
              : savedItem?.release_date;

            const isMovieReleased = media_type === 'movie' 
              ? Boolean(
                  effectiveReleaseDate && 
                  typeof effectiveReleaseDate === 'string' && 
                  effectiveReleaseDate.trim() !== '' && 
                  new Date(effectiveReleaseDate.trim()) <= new Date()
                )
              : true;

            const isUpcoming = !isMovieReleased || savedItem.status === 'upcoming';

            if (isUpcoming) {
              return (
                <>
                  <div className="px-3 py-2 flex flex-col gap-1 bg-purple-500/10 rounded-md my-1 border border-purple-500/20">
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                      Aguardando Estreia
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-snug">
                      Entrará automaticamente em &ldquo;Quero Ver&rdquo; assim que for lançado.
                    </span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    closeOnClick={false}
                    className={cn(
                      'cursor-pointer flex items-center justify-between py-2 px-2.5 transition-colors',
                      savedItem.status === 'dropped' && 'bg-accent text-accent-foreground font-semibold'
                    )}
                    onClick={(e) => handleStatusChange('dropped', e)}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn('w-2 h-2 rounded-full', statusConfig.dropped.dotColor)} />
                      <span>{statusConfig.dropped.label}</span>
                    </div>
                    {savedItem.status === 'dropped' && (
                      <Check className={cn('w-4 h-4', statusConfig.dropped.colorClass)} />
                    )}
                  </DropdownMenuItem>
                </>
              );
            }

            // Para títulos lançados: apenas opções normais (sem 'upcoming')
            const releasedStatuses: ListStatus[] = ['plan_to_watch', 'watching', 'completed', 'dropped'];
            return releasedStatuses.map((status) => {
              const itemConfig = statusConfig[status];
              const isSelected = savedItem.status === status;
              return (
                <DropdownMenuItem
                  key={status}
                  closeOnClick={false}
                  className={cn(
                    'cursor-pointer flex items-center justify-between py-2 px-2.5 transition-colors',
                    isSelected && 'bg-accent text-accent-foreground font-semibold'
                  )}
                  onClick={(e) => handleStatusChange(status, e)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn('w-2 h-2 rounded-full', itemConfig.dotColor)} />
                    <span>{itemConfig.label}</span>
                  </div>
                  {isSelected && (
                    <Check className={cn('w-4 h-4', itemConfig.colorClass)} />
                  )}
                </DropdownMenuItem>
              );
            });
          })()}
          <DropdownMenuSeparator />

          {!['plan_to_watch', 'upcoming'].includes(savedItem.status) && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="px-2.5 py-2 flex flex-col gap-1.5 bg-muted/40 rounded-lg mx-1 my-1 border border-border/50">
                <div className="text-xs font-semibold text-muted-foreground flex justify-between items-center">
                  <span>Sua Nota</span>
                  {savedItem.rating ? (
                    <span className="text-yellow-400 font-bold">{savedItem.rating.toFixed(1)} / 5</span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground font-normal">Sem nota</span>
                  )}
                </div>
                <div 
                  className="flex items-center justify-between w-full py-0.5"
                  onMouseLeave={() => setHoverRating(null)}
                >
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    const fullValue = starIndex;
                    const halfValue = starIndex - 0.5;
                    const currentRating = hoverRating !== null ? hoverRating : (savedItem.rating || 0);
                    const isFull = currentRating >= fullValue;
                    const isHalf = currentRating === halfValue;

                    return (
                      <div key={starIndex} className="relative w-6 h-6 text-muted-foreground cursor-pointer transition-transform hover:scale-110">
                        {/* Render base star */}
                        {isHalf ? (
                          <div className="absolute inset-0 text-yellow-400 flex items-center justify-center">
                            <Star className="w-5 h-5 absolute opacity-30" />
                            <StarHalf className="w-5 h-5 absolute fill-yellow-400" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Star className={cn("w-5 h-5 transition-colors", isFull ? "text-yellow-400 fill-yellow-400" : "opacity-30")} />
                          </div>
                        )}

                        {/* Left half click area */}
                        <div 
                          className="absolute left-0 top-0 w-1/2 h-full z-10" 
                          onMouseEnter={() => setHoverRating(halfValue)}
                          onClick={(e) => handleRate(halfValue, e)}
                        />
                        {/* Right half click area */}
                        <div 
                          className="absolute right-0 top-0 w-1/2 h-full z-10" 
                          onMouseEnter={() => setHoverRating(fullValue)}
                          onClick={(e) => handleRate(fullValue, e)}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground text-center">Clique na estrela para salvar</p>
              </div>
              <DropdownMenuSeparator />
            </div>
          )}

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-2 py-2 px-2.5"
            onClick={handleRemove}
          >
            <Trash2 className="w-4 h-4" />
            <span>Remover da lista</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
