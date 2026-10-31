'use client';

import Link from 'next/link';
import { CustomListItem } from '@/types/customLists';
import { PosterImage } from '@/components/shared/PosterImage';
import { AddToListButton } from '@/components/shared/AddToListButton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ArrowUp, ArrowDown, Trash2, Edit3, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomListItemRowProps {
  item: CustomListItem;
  index: number;
  totalItems: number;
  isRanked: boolean;
  isOwner: boolean;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onEditNote?: (item: CustomListItem) => void;
  onRemove?: (item: CustomListItem) => void;
}

export function CustomListItemRow({
  item,
  index,
  totalItems,
  isRanked,
  isOwner,
  onMoveUp,
  onMoveDown,
  onEditNote,
  onRemove,
}: CustomListItemRowProps) {
  const mediaHref = item.media_type === 'tv' ? `/tv/${item.tmdb_id}` : `/movie/${item.tmdb_id}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700/80 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        {/* Order / Rank indicator */}
        <div className="w-8 flex-shrink-0 text-center font-bold text-sm">
          {isRanked ? (
            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
              #{index + 1}
            </span>
          ) : (
            <span className="text-zinc-500 text-xs">{index + 1}</span>
          )}
        </div>

        {/* Poster Thumbnail */}
        <Link href={mediaHref} className="relative w-12 h-18 rounded-md overflow-hidden bg-zinc-950 flex-shrink-0">
          <PosterImage
            src={item.poster_path}
            fallbackSrc={item.backdrop_path}
            alt={item.title}
            fill
            className="object-cover"
            sizes="48px"
          />
        </Link>

        {/* Title & Metadata */}
        <div className="min-w-0 flex-1">
          <Link
            href={mediaHref}
            className="text-sm font-semibold text-white hover:text-primary transition-colors truncate block"
          >
            {item.title}
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-0.5">
            <span className="capitalize">{item.media_type === 'tv' ? 'Série' : 'Filme'}</span>
            {item.release_date && <span>• {item.release_date.substring(0, 4)}</span>}
            {item.runtime > 0 && <span>• {item.runtime} min</span>}
            <div className="scale-75 origin-left">
              <StatusBadge tmdb_id={item.tmdb_id} />
            </div>
          </div>

          {/* Note */}
          {item.note && (
            <div className="mt-1 flex items-start gap-1.5 text-xs text-zinc-300 bg-zinc-950/60 p-1.5 rounded border border-zinc-800/60 max-w-xl">
              <MessageSquare className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span className="italic">{item.note}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 self-end sm:self-center">
        {/* Add/Track button */}
        <AddToListButton
          tmdb_id={item.tmdb_id}
          media_type={item.media_type}
          title={item.title}
          poster_path={item.poster_path}
          backdrop_path={item.backdrop_path}
          release_date={item.release_date}
          className="h-9 w-9 min-h-[36px] min-w-[36px] touch-manipulation [&>svg]:w-4 [&>svg]:h-4"
        />

        {isOwner && (
          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={index === 0}
              onClick={() => onMoveUp && onMoveUp(index)}
              className="h-9 w-9 min-h-[36px] min-w-[36px] touch-manipulation text-zinc-400 hover:text-white disabled:opacity-20"
              title="Mover para cima"
              aria-label="Mover item para cima"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={index === totalItems - 1}
              onClick={() => onMoveDown && onMoveDown(index)}
              className="h-9 w-9 min-h-[36px] min-w-[36px] touch-manipulation text-zinc-400 hover:text-white disabled:opacity-20"
              title="Mover para baixo"
              aria-label="Mover item para baixo"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onEditNote && onEditNote(item)}
              className="h-9 w-9 min-h-[36px] min-w-[36px] touch-manipulation text-zinc-400 hover:text-primary"
              title="Editar nota"
              aria-label="Editar anotação"
            >
              <Edit3 className="w-4 h-4" />
            </Button>

            <div className="h-4 w-px bg-zinc-800 mx-0.5" aria-hidden="true" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove && onRemove(item)}
              className="h-9 w-9 min-h-[36px] min-w-[36px] touch-manipulation text-red-400 hover:text-red-300 hover:bg-red-950/40"
              title="Remover da lista"
              aria-label="Remover item da lista"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
