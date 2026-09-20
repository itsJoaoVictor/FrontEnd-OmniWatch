"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReleaseEvent } from '@/types/calendar';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

interface ReleaseDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  release: ReleaseEvent | null;
}

export function ReleaseDetailsSheet({ isOpen, onClose, release }: ReleaseDetailsSheetProps) {
  if (!release) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{release.media.title}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {format(parseISO(release.release_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-4 mt-4">
          {release.media.poster_path ? (
            <img src={`https://image.tmdb.org/t/p/w154${release.media.poster_path}`} className="w-24 h-auto rounded-md shadow" alt="poster" />
          ) : (
            <div className="w-24 h-36 bg-zinc-800 rounded-md"></div>
          )}
          
          <div className="flex-1">
            <h4 className="font-bold text-lg">{release.title}</h4>
            <p className="text-sm text-zinc-300 mt-2 line-clamp-4">{release.description || "Nenhuma sinopse disponível."}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="border-zinc-700 hover:bg-zinc-800 text-zinc-300">Fechar</Button>
          <Link 
            href={
              release.media.media_type === 'tv' && release.season_number != null && release.episode_number != null
                ? `/tv/${release.media.tmdb_id}/season/${release.season_number}/episode/${release.episode_number}`
                : `/${release.media.media_type}/${release.media.tmdb_id}`
            }
          >
            <Button className="bg-red-600 hover:bg-red-700 text-white">Ver Detalhes</Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
