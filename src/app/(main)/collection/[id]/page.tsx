"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Film, RotateCw, Star, Trash2, BookmarkPlus } from "lucide-react";
import { UserFollowedCollection } from "@/types/collections";
import {
  getFollowedCollections,
  getCollectionDetails,
  followCollection,
  syncCollection,
  unfollowCollection,
} from "@/services/collections";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { useMyListStore } from "@/store/useMyListStore";

const STATUS_LABEL: Record<string, string> = {
  completed: "Assistido",
  watching: "Assistindo",
  plan_to_watch: "Quero Ver",
  upcoming: "Aguardando Estreia",
  dropped: "Abandonado",
};

export default function CollectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tmdbId = Number(params.id);

  const [collection, setCollection] = useState<UserFollowedCollection | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const listItems = useMyListStore((s) => s.items);
  const fetchMyList = useMyListStore((s) => s.fetchMyList);

  useEffect(() => {
    fetchMyList();
  }, [fetchMyList]);

  const load = useCallback(async () => {
    try {
      const all = await getFollowedCollections();
      const existing = all.find((c) => c.tmdb_id === tmdbId);
      if (existing) {
        setCollection(existing);
        setIsFollowing(true);
      } else {
        // Busca dados públicos da coleção no TMDB/Backend se ainda não for seguida
        const tmdbData = await getCollectionDetails(tmdbId);
        if (tmdbData) {
          const parts = tmdbData.parts || [];
          const total = parts.length;
          const watched = parts.filter(
            (p: any) => listItems[p.id]?.status === "completed"
          ).length;
          const pct = total > 0 ? Math.round((watched / total) * 100) : 0;
          setCollection({
            id: String(tmdbData.id),
            tmdb_id: tmdbData.id,
            name: tmdbData.name,
            overview: tmdbData.overview,
            poster_path: tmdbData.poster_path,
            backdrop_path: tmdbData.backdrop_path,
            total_movies: total,
            watched_movies: watched,
            completion_percentage: pct,
            items: parts.map((p: any) => ({
              id: String(p.id),
              tmdb_id: p.id,
              title: p.title,
              release_date: p.release_date,
              poster_path: p.poster_path,
              backdrop_path: p.backdrop_path,
              status: listItems[p.id]?.status ?? null,
              rating: listItems[p.id]?.rating ?? null,
            })),
            created_at: new Date().toISOString(),
          });
          setIsFollowing(false);
        } else {
          setCollection(null);
        }
      }
    } catch {
      setCollection(null);
    } finally {
      setLoading(false);
    }
  }, [tmdbId, listItems]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFollow() {
    if (!collection || busy) return;
    setBusy(true);
    try {
      const res = await followCollection(collection.tmdb_id);
      toast.add({
        title: "Coleção seguida!",
        description: `Você começou a acompanhar ${collection.name}. ${res.movies_added} novos filmes foram adicionados à sua lista.`,
        type: "success",
      });
      setIsFollowing(true);
      await Promise.all([load(), fetchMyList()]);
    } catch (err: any) {
      toast.add({
        title: "Erro ao seguir coleção",
        description: err.response?.data?.detail || "Falha ao seguir coleção.",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    if (!collection || busy) return;
    setBusy(true);
    try {
      const res = await syncCollection(collection.tmdb_id);
      const totalAdded = (res.new_parts_count || 0) + (res.reconciled_count || 0);
      toast.add({
        title: totalAdded > 0 ? "Coleção sincronizada!" : "Tudo atualizado!",
        description:
          totalAdded > 0
            ? `${totalAdded} filme(s) foram colocados na sua lista em "Quero Ver".`
            : "Todos os filmes da franquia já estão na sua lista e não há lançamentos novos no TMDB.",
        type: totalAdded > 0 ? "success" : "info",
      });
      await Promise.all([load(), fetchMyList()]);
    } catch (err: any) {
      toast.add({
        title: "Erro ao sincronizar",
        description: err.response?.data?.detail || "Falha ao verificar novidades no TMDB.",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleUnfollow() {
    if (!collection || busy) return;
    if (!confirm(`Deseja parar de monitorar a coleção "${collection.name}"? Os filmes adicionados continuarão na sua lista.`)) return;
    setBusy(true);
    try {
      await unfollowCollection(collection.tmdb_id);
      toast.add({ title: "Coleção removida", description: `Você deixou de seguir "${collection.name}".`, type: "info" });
      router.push("/my-list");
    } catch {
      toast.add({ title: "Erro", description: "Não foi possível deixar de seguir a coleção.", type: "error" });
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-muted-foreground">Carregando...</div>;
  }

  if (!collection) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-muted-foreground">Coleção não encontrada ou indisponível.</p>
        <Link href="/my-list" className="underline">Voltar para minha lista</Link>
      </div>
    );
  }

  const backdrop = collection.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${collection.backdrop_path}`
    : null;
  const isCompleted =
    collection.total_movies > 0 && collection.watched_movies === collection.total_movies;
  const pct = Math.min(100, Math.max(0, collection.completion_percentage));

  // Calcula média de notas dos filmes avaliados
  const ratedItems = (collection.items || []).filter((item) => {
    const saved = listItems[item.tmdb_id];
    const r = saved?.rating ?? item.rating;
    return typeof r === "number" && r > 0;
  });
  const ratedCount = collection.rated_movies_count ?? ratedItems.length;
  const averageRating =
    collection.user_average_rating !== undefined && collection.user_average_rating !== null
      ? collection.user_average_rating.toFixed(1)
      : ratedItems.length > 0
      ? (
          ratedItems.reduce((acc, item) => {
            const saved = listItems[item.tmdb_id];
            const r = saved?.rating ?? item.rating ?? 0;
            return acc + r;
          }, 0) / ratedItems.length
        ).toFixed(1)
      : null;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="relative h-56 sm:h-80 w-full overflow-hidden bg-muted">
        {backdrop ? (
          <Image src={backdrop} alt={collection.name} fill priority className="object-cover" sizes="100vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-14 h-14 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <Link
          href="/my-list"
          className="absolute top-4 left-4 inline-flex items-center gap-1 text-sm bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" /> Minha lista
        </Link>
        <div className="absolute top-4 right-4 flex gap-2 items-center">
          {averageRating && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-300 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-500/30 shadow-md">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{averageRating}</span>
            </div>
          )}
          {isFollowing ? (
            <>
              <Button variant="secondary" size="icon" className="rounded-full cursor-pointer" onClick={handleSync} disabled={busy} title="Sincronizar novos filmes com TMDB">
                <RotateCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="destructive" size="icon" className="rounded-full cursor-pointer" onClick={handleUnfollow} disabled={busy} title="Deixar de seguir esta coleção">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={handleFollow}
              disabled={busy}
              className="rounded-full gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm px-4 shadow-lg cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4" />
              {busy ? "Seguindo..." : "Seguir Coleção"}
            </Button>
          )}
        </div>
        <h1 className="absolute bottom-4 left-6 right-6 text-2xl sm:text-4xl font-bold drop-shadow">
          {collection.name}
        </h1>
      </div>

      <div className="px-4 sm:px-6 mt-6 space-y-6">
        {collection.overview && (
          <p className="text-sm sm:text-base text-muted-foreground">{collection.overview}</p>
        )}

        {/* Métricas: Progresso e Avaliação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card/60 border border-border/50 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col justify-between">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground font-medium">Progresso da Coleção</span>
              <span className="font-semibold">
                {collection.watched_movies} de {collection.total_movies} assistidos ({collection.completion_percentage}%)
              </span>
            </div>
            <div className="w-full bg-secondary/80 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${isCompleted ? "bg-emerald-500" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col justify-between pt-2 md:pt-0 border-t md:border-t-0 md:border-l md:pl-4 border-border/40">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                Sua Nota Média
              </span>
              {averageRating ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-amber-400">{averageRating}</span>
                  <span className="text-xs text-muted-foreground">/ 5.0</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Sem avaliações</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {averageRating
                ? `${ratedCount} de ${collection.total_movies} ${collection.total_movies === 1 ? "filme" : "filmes"} avaliados nesta franquia`
                : "Atribua notas aos filmes assistidos para calcular sua média."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {collection.items.map((item) => {
            const saved = listItems[item.tmdb_id];
            const status = saved?.status ?? item.status;
            const rating = saved?.rating ?? item.rating;
            return (
              <div key={item.id} className="group relative">
                <Link href={`/movie/${item.tmdb_id}`} className="block">
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                    {item.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 20vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">N/A</div>
                    )}
                    <span className="absolute bottom-2 left-2 text-[11px] font-medium bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      {(status && STATUS_LABEL[status]) || "Não na lista"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium truncate group-hover:underline">{item.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {item.release_date && <span>{item.release_date.split("-")[0]}</span>}
                    {rating ? (
                      <span className="flex items-center text-yellow-500">
                        <Star className="w-3 h-3 fill-yellow-500 mr-0.5" />
                        {rating}
                      </span>
                    ) : null}
                  </div>
                </Link>
                <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                  <AddToListButton
                    tmdb_id={item.tmdb_id}
                    media_type="movie"
                    title={item.title}
                    poster_path={item.poster_path}
                    backdrop_path={item.backdrop_path}
                    release_date={item.release_date}
                    className="h-8 w-8"
                  />
                  <FavoriteButton tmdb_id={item.tmdb_id} size="sm" />
                </div>
              </div>
            );
          })}
        </div>      </div>
    </div>
  );
}

