'use client';

import Link from 'next/link';
import { CustomListSummary } from '@/types/customLists';
import { PosterImage } from '@/components/shared/PosterImage';
import { Trophy, Film, MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface CustomListCardProps {
  list: CustomListSummary;
  isOwner?: boolean;
  onEdit?: (list: CustomListSummary) => void;
  onDelete?: (listId: string) => void;
}

export function CustomListCard({
  list,
  isOwner,
  onEdit,
  onDelete,
}: CustomListCardProps) {
  const posters = list.preview_posters || [];

  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/90 transition-all duration-300 hover:shadow-xl hover:shadow-black/40">
      {/* Banner / Poster Collage Container */}
      <Link href={`/lists/${list.id}`} className="relative w-full aspect-[16/9] bg-zinc-950 overflow-hidden block">
        {posters.length > 0 ? (
          <div className="grid grid-cols-4 h-full w-full">
            {posters.slice(0, 4).map((p, idx) => (
              <div key={idx} className="relative h-full border-r border-zinc-900 last:border-r-0 overflow-hidden">
                <PosterImage
                  src={p}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 25vw, 15vw"
                />
              </div>
            ))}
            {/* Fill missing slots if fewer than 4 posters */}
            {Array.from({ length: Math.max(0, 4 - posters.length) }).map((_, idx) => (
              <div key={`empty-${idx}`} className="bg-zinc-900/40 flex items-center justify-center">
                <Film className="w-5 h-5 text-zinc-700" />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-zinc-600 gap-2 bg-gradient-to-br from-zinc-900 to-zinc-950">
            <Film className="w-10 h-10 stroke-[1.5]" />
            <span className="text-xs text-zinc-500">Lista vazia</span>
          </div>
        )}

        {/* Gradient overlay for bottom readable text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

        {/* Badges on top */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            {list.is_ranked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/90 text-black backdrop-blur-md shadow">
                <Trophy className="w-3 h-3 fill-black" />
                Ranqueada
              </span>
            )}
          </div>

          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-black/75 text-zinc-200 border border-white/10 backdrop-blur-md">
            {list.items_count} {list.items_count === 1 ? 'título' : 'títulos'}
          </span>
        </div>
      </Link>

      {/* Content info */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/lists/${list.id}`}
              className="text-base font-bold text-white group-hover:text-primary transition-colors line-clamp-1"
            >
              {list.title}
            </Link>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-white -mr-2"
                    />
                  }
                >
                  <MoreVertical className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-white">
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={() => onEdit(list)}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4 text-zinc-400" />
                      Editar lista
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(list.id)}
                      className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-950/40 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir lista
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {list.description ? (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
              {list.description}
            </p>
          ) : (
            <p className="text-xs text-zinc-600 mt-1 italic">Sem descrição</p>
          )}
        </div>

        <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
          <span>{list.user_name ? `por ${list.user_name}` : 'Você'}</span>
          <span>
            {new Date(list.updated_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
