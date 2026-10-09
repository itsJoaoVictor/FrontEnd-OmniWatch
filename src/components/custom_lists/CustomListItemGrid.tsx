'use client';

import Link from 'next/link';
import { CustomListItem } from '@/types/customLists';
import { PosterImage } from '@/components/shared/PosterImage';
import { useMyListStore } from '@/store/useMyListStore';
import { Check, MessageSquare, ArrowUp, ArrowDown, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CustomListItemGridProps {
  items: CustomListItem[];
  isRanked: boolean;
  isOwner: boolean;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onEditNote?: (item: CustomListItem) => void;
  onRemove?: (item: CustomListItem) => void;
}

export function CustomListItemGrid({
  items,
  isRanked,
  isOwner,
  onMoveUp,
  onMoveDown,
  onEditNote,
  onRemove,
}: CustomListItemGridProps) {
  const { items: myItems } = useMyListStore();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item, index) => {
        const myItem = myItems[item.tmdb_id];
        const isWatched = myItem?.status === 'completed';
        const mediaHref = item.media_type === 'tv' ? `/tv/${item.tmdb_id}` : `/movie/${item.tmdb_id}`;

        return (
          <div
            key={item.id}
            className="group relative flex flex-col rounded-xl overflow-hidden bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-200"
          >
            {/* Poster container */}
            <div className="relative aspect-[2/3] w-full bg-zinc-950 overflow-hidden">
              <Link href={mediaHref} className="block w-full h-full">
                <PosterImage
                  src={item.poster_path}
                  fallbackSrc={item.backdrop_path}
                  alt={item.title}
                  title={item.title}
                  type={item.media_type}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              </Link>

              {/* Rank Badge */}
              {isRanked && (
                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md font-extrabold text-xs bg-amber-500 text-black shadow-lg shadow-black/60">
                  #{index + 1}
                </div>
              )}

              {/* Watched Badge */}
              {isWatched && (
                <div
                  className="absolute top-2 right-2 z-10 p-1 rounded-full bg-emerald-500/90 text-white shadow-lg backdrop-blur-md"
                  title="Assistido por você"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {/* Owner quick action controls overlay */}
              {isOwner && (
                <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-1 z-20">
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => onMoveUp && onMoveUp(index)}
                      className="h-7 w-7 text-white hover:bg-white/20 disabled:opacity-30"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={index === items.length - 1}
                      onClick={() => onMoveDown && onMoveDown(index)}
                      className="h-7 w-7 text-white hover:bg-white/20 disabled:opacity-30"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditNote && onEditNote(item)}
                      className="h-7 w-7 text-zinc-300 hover:text-primary hover:bg-white/20"
                      title="Editar anotação"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove && onRemove(item)}
                      className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-950/50"
                      title="Remover da lista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Title & note */}
            <div className="p-2.5 flex flex-col gap-1 flex-1 justify-between">
              <div>
                <Link
                  href={mediaHref}
                  className="text-xs font-semibold text-white hover:text-primary transition-colors line-clamp-1"
                  title={item.title}
                >
                  {item.title}
                </Link>
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                  <span>{item.media_type === 'tv' ? 'Série' : 'Filme'}</span>
                  {item.release_date && (
                    <span>• {item.release_date.substring(0, 4)}</span>
                  )}
                  {item.runtime > 0 && <span>• {item.runtime}m</span>}
                </div>
              </div>

              {item.note && (
                <div
                  className="mt-1.5 p-1.5 rounded bg-zinc-950/70 border border-zinc-800/80 text-[11px] text-zinc-300 line-clamp-2 italic cursor-help"
                  title={item.note}
                >
                  <div className="flex items-start gap-1">
                    <MessageSquare className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item.note}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
