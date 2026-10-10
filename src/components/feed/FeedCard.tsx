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
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FeedCardProps {
  item: FriendFeedItem;
}

export function FeedCard({ item }: FeedCardProps) {
  const { items, addToList } = useMyListStore();
  const [isAdding, setIsAdding] = useState(false);

  const isInMyList = !!items[item.tmdb_id];

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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Flame className="w-3.5 h-3.5" />
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
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : '/placeholder-poster.png';

  return (
    <div className="bg-card/70 border border-border/60 hover:border-border transition-all duration-300 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md flex flex-col gap-4">
      {/* Top Header: Friend info & action badge */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={item.username ? `/profile/${item.username}` : `/profile/${item.user_id}`}
          className="flex items-center gap-3 min-w-0 group hover:opacity-90 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0 shadow-inner group-hover:ring-1 group-hover:ring-primary transition-all">
            {item.user_name ? item.user_name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                {item.user_name}
              </span>
              {item.username && (
                <span className="text-xs text-muted-foreground truncate">
                  @{item.username}
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {getRelativeTime(item.watched_at)}
            </span>
          </div>
        </Link>

        <div className="shrink-0">
          {renderBadge()}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="flex gap-4 items-center bg-secondary/30 rounded-xl p-3 border border-border/40">
        <Link href={mediaHref} className="shrink-0 relative group">
          <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-lg overflow-hidden bg-muted relative shadow-md">
            <Image
              src={posterUrl}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="96px"
            />
          </div>
        </Link>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 self-stretch">
          <div className="space-y-1.5">
            <Link href={mediaHref} className="hover:text-primary transition-colors block">
              <h4 className="font-bold text-base sm:text-lg text-foreground line-clamp-1">
                {item.title}
              </h4>
            </Link>

            {item.episodes_label && (
              <div className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/15 text-primary border border-primary/25">
                {item.episodes_label}
              </div>
            )}

            {item.rating !== null && item.rating !== undefined && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium pt-0.5">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>Nota: {Number(item.rating > 5 ? item.rating / 2 : item.rating).toFixed(1)} / 5</span>
              </div>
            )}
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              variant={isInMyList ? 'secondary' : 'outline'}
              className="h-8 text-xs font-medium gap-1.5"
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

            <Link href={mediaHref}>
              <Button size="sm" variant="ghost" className="h-8 text-xs gap-1">
                Detalhes
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
