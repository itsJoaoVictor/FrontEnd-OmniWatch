'use client';

import { useState } from 'react';
import { useMyListStore, ListStatus } from '@/store/useMyListStore';
import { Button } from '@/components/ui/button';
import { Plus, Check, MoreHorizontal, Star, StarHalf } from 'lucide-react';
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

const statusLabels: Record<ListStatus, string> = {
  plan_to_watch: 'Quero Ver',
  watching: 'Assistindo',
  completed: 'Assistido',
  dropped: 'Abandonei',
};

export function AddToListButton({ tmdb_id, media_type, className, title, poster_path, backdrop_path, release_date }: AddToListButtonProps) {
  const { items, addToList, updateStatus, updateRating, removeFromList } = useMyListStore();
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const numericTmdbId = Number(tmdb_id);
  const isValidId = !isNaN(numericTmdbId) && numericTmdbId > 0;
  const savedItem = isValidId ? items[numericTmdbId] : undefined;
  const isInList = !!savedItem;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isValidId) return;
    addToList(numericTmdbId, media_type, { title, poster_path, backdrop_path });
  };

  if (!isInList) {
    return (
      <Button
        onClick={handleAdd}
        size="icon"
        className={cn('h-10 w-10 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] bg-black/60 hover:bg-black/80 text-white border border-white/40 backdrop-blur-md', className)}
        title="Adicionar à Lista"
      >
        <Plus className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      <DropdownMenu>
        <DropdownMenuTrigger
            className={cn(
              'inline-flex items-center justify-center h-10 w-10 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] bg-black/60 hover:bg-black/80 text-white border border-white/40 backdrop-blur-md',
              className
            )}
            title="Opções da Lista"
          >
            <MoreHorizontal className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
            Alterar Status
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

            return (Object.keys(statusLabels) as ListStatus[]).map((status) => {
              const isCompletedDisabled = media_type === 'movie' && !isMovieReleased && status === 'completed';
              return (
                <DropdownMenuItem
                  key={status}
                  disabled={isCompletedDisabled}
                  className={cn(
                    'cursor-pointer',
                    savedItem.status === status && 'bg-accent text-accent-foreground font-medium',
                    isCompletedDisabled && 'opacity-50 cursor-not-allowed select-none text-muted-foreground'
                  )}
                  onClick={(e) => {
                    if (isCompletedDisabled) {
                      e.preventDefault();
                      toast.add({
                        title: "Ação não permitida",
                        description: "Filmes que ainda não estrearam não podem ser marcados como assistidos.",
                        type: "error"
                      });
                      return;
                    }
                    updateStatus(numericTmdbId, status);
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{statusLabels[status]}</span>
                    {isCompletedDisabled && (
                      <span className="text-[10px] text-amber-400 font-medium ml-2 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Não lançado</span>
                    )}
                  </div>
                </DropdownMenuItem>
              );
            });
          })()}
          <DropdownMenuSeparator />

          {savedItem.status !== 'plan_to_watch' && (
            <>
              <div className="px-2 py-2 flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground flex justify-between">
                  Sua Nota {savedItem.rating ? <span className="text-yellow-400">{savedItem.rating.toFixed(1)}</span> : ''}
                </span>
                <div 
                  className="flex items-center justify-between w-full"
                  onMouseLeave={() => setHoverRating(null)}
                >
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    const fullValue = starIndex;
                    const halfValue = starIndex - 0.5;
                    const currentRating = hoverRating !== null ? hoverRating : (savedItem.rating || 0);
                    const isFull = currentRating >= fullValue;
                    const isHalf = currentRating === halfValue;

                    return (
                      <div key={starIndex} className="relative w-6 h-6 text-muted-foreground cursor-pointer">
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
                          onClick={(e) => { e.preventDefault(); updateRating(numericTmdbId, halfValue); }}
                        />
                        {/* Right half click area */}
                        <div 
                          className="absolute right-0 top-0 w-1/2 h-full z-10" 
                          onMouseEnter={() => setHoverRating(fullValue)}
                          onClick={(e) => { e.preventDefault(); updateRating(numericTmdbId, fullValue); }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={() => removeFromList(numericTmdbId)}
          >
            Remover da lista
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
