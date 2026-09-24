"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CollectionResponse } from "@/types/details";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { PosterImage } from "@/components/shared/PosterImage";
import { Button } from "@/components/ui/button";
import { followCollection, unfollowCollection, getCollectionStatus } from "@/services/collections";
import { useMyListStore } from "@/store/useMyListStore";
import { toast } from "@/components/ui/toast";

interface CollectionCarouselProps {
  collection: CollectionResponse;
}

export function CollectionCarousel({ collection }: CollectionCarouselProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchMyList = useMyListStore((state) => state.fetchMyList);

  useEffect(() => {
    let isMounted = true;
    if (!collection?.id) return;

    async function checkStatus() {
      try {
        setIsLoadingStatus(true);
        const res = await getCollectionStatus(collection.id);
        if (isMounted) {
          setIsFollowing(res.is_following);
        }
      } catch (err) {
        // Silently fail if not logged in or network error
      } finally {
        if (isMounted) {
          setIsLoadingStatus(false);
        }
      }
    }

    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [collection?.id]);

  if (!collection || !collection.parts || collection.parts.length === 0) return null;

  async function handleToggleFollow() {
    if (isActionLoading) return;

    setIsActionLoading(true);
    try {
      if (isFollowing) {
        await unfollowCollection(collection.id);
        setIsFollowing(false);
        toast.add({
          title: "Coleção desmarcada",
          description: "Você deixou de seguir esta coleção. Os filmes continuam salvos na sua lista.",
          type: "info",
        });
      } else {
        // Optimistic update: record title, poster_path, backdrop_path in Zustand store
        const store = useMyListStore.getState();
        const currentItems = { ...store.items };
        collection.parts.forEach((part) => {
          if (!currentItems[part.id]) {
            currentItems[part.id] = {
              id: `temp-${Date.now()}-${part.id}`,
              tmdb_id: part.id,
              status: "plan_to_watch",
              media_type: "movie",
              title: part.title,
              poster_path: part.poster_path ?? undefined,
              backdrop_path: part.backdrop_path ?? undefined,
            };
          }
        });
        useMyListStore.setState({ items: currentItems });

        const res = await followCollection(collection.id);
        setIsFollowing(true);
        await fetchMyList();
        toast.add({
          title: "Coleção seguida!",
          description: `${collection.name} adicionada! ${res.movies_added} novos filmes foram adicionados à sua lista como "Quero Ver".`,
          type: "success",
        });
      }
    } catch (error: any) {
      toast.add({
        title: "Erro",
        description: error.response?.data?.detail || "Não foi possível atualizar a coleção.",
        type: "error",
      });
    } finally {
      setIsActionLoading(false);
    }
  }

  return (
    <div className="my-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-2xl font-semibold">Coleção: {collection.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {collection.parts.length} filme{collection.parts.length > 1 ? "s" : ""} na franquia
          </p>
        </div>

        <Button
          variant={isFollowing ? "secondary" : "default"}
          size="sm"
          disabled={isLoadingStatus || isActionLoading}
          onClick={handleToggleFollow}
          className="gap-2 transition-all cursor-pointer"
        >
          {isActionLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processando...</span>
            </>
          ) : isFollowing ? (
            <>
              <BookmarkCheck className="w-4 h-4 text-emerald-500" />
              <span>Seguindo Coleção</span>
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" />
              <span>Seguir Coleção</span>
            </>
          )}
        </Button>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {collection.parts.map((item) => (
            <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-[140px] md:basis-[180px] lg:basis-[220px]">
              <Link href={`/movie/${item.id}`}>
                <Card className="border-0 bg-transparent shadow-none hover:opacity-80 transition-opacity">
                  <CardContent className="p-0">
                    <div className="w-full aspect-[2/3] relative rounded-md overflow-hidden bg-muted mb-2 group">
                      <PosterImage
                        src={item.poster_path}
                        fallbackSrc={item.backdrop_path}
                        alt={item.title}
                        title={item.title}
                        type="movie"
                        fill
                        priority={collection.parts.indexOf(item) < 4}
                        className="transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 140px, 200px"
                      />
                      {/* Botão de Adicionar à Lista */}
                      <div className="absolute top-2 right-2 z-10">
                        <AddToListButton
                          tmdb_id={item.id}
                          media_type="movie"
                          title={item.title}
                          poster_path={item.poster_path ?? undefined}
                          backdrop_path={item.backdrop_path ?? undefined}
                          release_date={item.release_date}
                          className="w-8 h-8 [&>svg]:w-4 [&>svg]:h-4"
                        />
                      </div>
                    </div>
                    <p className="font-bold text-sm truncate">{item.title}</p>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Star className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" />
                      {(item.vote_average / 2).toFixed(1)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4" />
        <CarouselNext className="hidden md:flex -right-4" />
      </Carousel>
    </div>
  );
}
