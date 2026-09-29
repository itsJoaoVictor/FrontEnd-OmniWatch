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

  const isMovie = release.media.media_type === 'movie';
  const cleanDescription = release.description
    ? release.description.replace(/Lancamento/gi, 'Lançamento')
    : "Nenhuma sinopse disponível.";

  const isDuplicateTitle = isMovie && release.title.trim().toLowerCase() === release.media.title.trim().toLowerCase();
  const cleanReleaseTitle = isDuplicateTitle
    ? "Estreia / Lançamento Oficial"
    : release.title.replace(/Lancamento/gi, 'Lançamento');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:border-t max-sm:border-x-0 max-sm:border-b-0 max-sm:p-5 max-sm:pb-8 max-sm:shadow-2xl">
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

        <DialogHeader className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              {isMovie ? 'Filme' : 'Série'}
            </span>
            {!isMovie && release.season_number != null && release.episode_number != null && (
              <span className="text-[10px] text-red-400 font-semibold">
                Temporada {release.season_number} • Ep. {release.episode_number}
              </span>
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-white">{release.media.title}</DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs sm:text-sm">
            {format(parseISO(release.release_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-4 mt-2">
          {release.media.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w154${release.media.poster_path}`}
              className="w-20 sm:w-24 h-28 sm:h-36 object-cover rounded-lg shadow-md shrink-0 bg-zinc-800"
              alt={release.media.title}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-20 sm:w-24 h-28 sm:h-36 bg-zinc-800 rounded-lg flex flex-col items-center justify-center p-2 text-zinc-500 text-xs text-center border border-zinc-700/50 shrink-0">
              Sem Imagem
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm sm:text-base text-zinc-100">{cleanReleaseTitle}</h4>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1.5 line-clamp-4 leading-relaxed">{cleanDescription}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-zinc-800/80">
          <Button variant="outline" onClick={onClose} className="border-zinc-700 hover:bg-zinc-800 text-zinc-300">Fechar</Button>
          <Link 
            href={
              release.media.media_type === 'tv' && release.season_number != null && release.episode_number != null
                ? `/tv/${release.media.tmdb_id}/season/${release.season_number}/episode/${release.episode_number}`
                : `/${release.media.media_type}/${release.media.tmdb_id}`
            }
          >
            <Button className="bg-red-600 hover:bg-red-700 text-white shadow-sm">Ver Detalhes</Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
