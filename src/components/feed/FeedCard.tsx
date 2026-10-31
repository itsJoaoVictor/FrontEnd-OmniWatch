'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FriendFeedItem } from '@/types/friends';
import { useMyListStore } from '@/store/useMyListStore';
import { toast } from '@/components/ui/toast';
import { 
  Film, 
  Tv, 
  Flame, 
  Star, 
  Plus, 
  Check, 
  User as UserIcon,
  ExternalLink 
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FeedCardProps {
  item: FriendFeedItem;
}

export function FeedCard({ item }: FeedCardProps) {
  const isInMyList = useMyListStore((state) => !!state.items[item.tmdb_id]);
  const addToList = useMyListStore((state) => state.addToList);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToList = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInMyList || isAdding) return;

    try {
      setIsAdding(true);
      await addToList(item.tmdb_id, item.media_type, {
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        status: 'plan_to_watch',
      });
      toast.add({
        title: 'Adicionado à lista',
        description: `"${item.title}" foi adicionado à sua lista.`,
        type: 'success',
      });
    } catch {
      toast.add({
        title: 'Erro',
        description: 'Não foi possível adicionar à sua lista.',
        type: 'error',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: ptBR });
    } catch {
      return 'recentemente';
    }
  };

  const renderBadge = () => {
    if (item.action_type === 'binge_watched') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30 shadow-sm animate-pulse-slow">
          <Flame className="w-3.5 h-3.5 text-purple-400 fill-purple-400/40" />
          Maratonou
        </span>
      );
    }
    if (item.action_type === 'watched_episode') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <Tv className="w-3.5 h-3.5" />
          Assistiu episódio
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
        <Film className="w-3.5 h-3.5" />
        Assistiu filme
      </span>
    );
  };

  const mediaHref = item.media_type === 'movie' ? `/movie/${item.tmdb_id}` : `/tv/${item.tmdb_id}`;
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : '/placeholder-poster.png';

  const isBinge = item.action_type === 'binge_watched';

  return (
    <div className="bg-card/70 backdrop-blur-sm border border-border/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 group">
      {/* Top Header: Friend info & action badge */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={item.username ? `/profile/${item.username}` : `/profile/${item.user_id}`}
          className="flex items-center gap-3 min-w-0 group/author hover:opacity-95 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20 shadow-sm group-hover/author:ring-2 group-hover/author:ring-primary/40 transition-all">
            {item.user_name ? item.user_name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-foreground group-hover/author:text-primary transition-colors truncate">
                {item.user_name}
              </span>
              {item.username && (
                <span className="text-xs text-muted-foreground truncate">
                  @{item.username}
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground/80 block">
              {getRelativeTime(item.watched_at)}
            </span>
          </div>
        </Link>

        <div className="shrink-0">
          {renderBadge()}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="flex gap-4 items-center bg-secondary/25 hover:bg-secondary/35 transition-colors rounded-xl p-3 border border-border/40">
        <Link href={mediaHref} className="shrink-0 relative group/poster block overflow-hidden rounded-xl">
          <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-xl overflow-hidden bg-muted relative shadow-md">
            <Image
              src={posterUrl}
              alt={item.title}
              fill
              className="object-cover group-hover/poster:scale-105 group-hover:scale-105 transition-transform duration-300"
              sizes="96px"
            />
          </div>
        </Link>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 self-stretch">
          <div className="space-y-1.5">
            <Link href={mediaHref} prefetch={false} className="hover:text-primary transition-colors block">
              <h3 className="font-bold text-base sm:text-lg text-foreground line-clamp-2 leading-snug hover:underline decoration-primary/50 underline-offset-2">
                {item.title}
              </h3>
            </Link>

            {item.episodes_label && (
              <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                isBinge 
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' 
                  : 'bg-primary/15 text-primary border border-primary/25'
              }`}>
                {isBinge && <Flame className="w-3 h-3 text-purple-400" />}
                {item.episodes_label}
              </div>
            )}

            {item.rating !== null && item.rating !== undefined && (
              <div className="flex items-center pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/15 to-yellow-500/10 text-amber-300 border border-amber-500/30 shadow-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Nota {Number(item.rating > 5 ? item.rating / 2 : item.rating).toFixed(1)} / 5</span>
                </span>
              </div>
            )}
          </div>

          {/* Quick Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2.5">
            <Button
              size="sm"
              variant={isInMyList ? 'secondary' : 'outline'}
              className="h-8 text-xs font-medium gap-1.5 touch-manipulation hover:border-primary/40"
              onClick={handleAddToList}
              disabled={isInMyList || isAdding}
            >
              {isInMyList ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Na Minha Lista
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Quero Ver
                </>
              )}
            </Button>

            <Link
              href={mediaHref}
              prefetch={false}
              aria-label={`Ver detalhes de ${item.title}`}
              className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'h-8 text-xs gap-1 touch-manipulation text-muted-foreground hover:text-foreground' })}
            >
              Detalhes
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
