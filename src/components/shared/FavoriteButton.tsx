'use client';

import { useMyListStore } from '@/store/useMyListStore';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface FavoriteButtonProps {
  tmdb_id: number;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function FavoriteButton({ tmdb_id, className, size = 'default' }: FavoriteButtonProps) {
  const { items, toggleFavorite } = useMyListStore();
  const [isAnimating, setIsAnimating] = useState(false);

  const numericTmdbId = Number(tmdb_id);
  const isValidId = !isNaN(numericTmdbId) && numericTmdbId > 0;
  const savedItem = isValidId ? items[numericTmdbId] : undefined;

  // Regra de Negócio: O status deve ser 'Assistindo' ou 'Assistido'.
  // Se não possuir nenhum desses status, nem aparece a opção de adicionar aos favoritos.
  if (!savedItem || !['watching', 'completed'].includes(savedItem.status)) {
    return null;
  }

  const isFavorite = Boolean(savedItem.is_favorite);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isValidId) return;

    setIsAnimating(true);
    await toggleFavorite(numericTmdbId);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    sm: 'h-8 w-8 [&>svg]:w-4 [&>svg]:h-4',
    default: 'h-10 w-10 [&>svg]:w-5 [&>svg]:h-5',
    lg: 'w-12 h-12 [&>svg]:w-6 [&>svg]:h-6',
  }[size];

  return (
    <Button
      onClick={handleClick}
      size="icon"
      className={cn(
        'rounded-full shadow-[0_0_12px_rgba(0,0,0,0.6)] bg-black/70 hover:bg-black/90 backdrop-blur-md transition-all duration-200 border',
        isFavorite
          ? 'border-rose-500/60 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.35)] hover:border-rose-400'
          : 'border-white/20 text-white/70 hover:text-rose-400 hover:border-rose-500/40',
        isAnimating && 'scale-125',
        sizeClasses,
        className
      )}
      title={isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos (Aumenta peso no Explorar)'}
      aria-label={isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
    >
      <Heart
        className={cn(
          'transition-all duration-200',
          isFavorite ? 'fill-rose-500 text-rose-500' : 'fill-transparent'
        )}
      />
    </Button>
  );
}
