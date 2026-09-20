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

interface AddToListButtonProps {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  className?: string;
}

const statusLabels: Record<ListStatus, string> = {
  plan_to_watch: 'Quero Ver',
  watching: 'Assistindo',
  completed: 'Assistido',
  dropped: 'Abandonei',
};

export function AddToListButton({ tmdb_id, media_type, className }: AddToListButtonProps) {
  const { items, addToList, updateStatus, updateRating, removeFromList } = useMyListStore();
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const savedItem = items[tmdb_id];
  const isInList = !!savedItem;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToList(tmdb_id, media_type);
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
          {(Object.keys(statusLabels) as ListStatus[]).map((status) => (
            <DropdownMenuItem
              key={status}
              className={cn(
                'cursor-pointer',
                savedItem.status === status && 'bg-accent text-accent-foreground font-medium'
              )}
              onClick={() => updateStatus(tmdb_id, status)}
            >
              {statusLabels[status]}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />

          {savedItem.status !== 'plan_to_watch' && (
            <>
              <div className="px-2 py-2 flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground flex justify-between">
                  Sua Nota {savedItem.rating ? <span className="text-yellow-400">{(savedItem.rating / 2).toFixed(1)}</span> : ''}
                </span>
                <div 
                  className="flex items-center justify-between w-full"
                  onMouseLeave={() => setHoverRating(null)}
                >
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    const starValue = starIndex * 2;
                    const currentRating = hoverRating !== null ? hoverRating : (savedItem.rating || 0);
                    const isFull = currentRating >= starValue;
                    const isHalf = currentRating === starValue - 1;

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
                          onMouseEnter={() => setHoverRating(starValue - 1)}
                          onClick={(e) => { e.preventDefault(); updateRating(tmdb_id, starValue - 1); }}
                        />
                        {/* Right half click area */}
                        <div 
                          className="absolute right-0 top-0 w-1/2 h-full z-10" 
                          onMouseEnter={() => setHoverRating(starValue)}
                          onClick={(e) => { e.preventDefault(); updateRating(tmdb_id, starValue); }}
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
            onClick={() => removeFromList(tmdb_id)}
          >
            Remover da lista
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
