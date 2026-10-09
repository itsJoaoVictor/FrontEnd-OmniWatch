"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/axios";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Users, EyeOff, RotateCcw, Calendar, Film, Tv, Sparkles, ListPlus, AtSign } from "lucide-react";
import { EditUsernameModal } from "@/components/profile/EditUsernameModal";
import { useUserStore } from "@/store/useUserStore";

interface DismissedItem {
  id: string;
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  expires_at: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  created_at?: string;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dismissedItems, setDismissedItems] = useState<DismissedItem[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingDismissed, setIsLoadingDismissed] = useState(true);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [isEditUsernameOpen, setIsEditUsernameOpen] = useState(false);
  const { setUser: setStoreUser } = useUserStore();

  useEffect(() => {
    async function loadData() {
      // 1. Carrega dados do usuário
      try {
        const userRes = await api.get("/api/users/me");
        setUser(userRes.data);
        setStoreUser(userRes.data);
      } catch (err) {
        console.error("Erro ao carregar perfil do usuário:", err);
      } finally {
        setIsLoadingUser(false);
      }

      // 2. Carrega recomendações dispensadas
      try {
        const recsRes = await api.get("/api/recommendations/dismissed");
        setDismissedItems(recsRes.data);
      } catch (err) {
        console.error("Erro ao carregar recomendações dispensadas:", err);
      } finally {
        setIsLoadingDismissed(false);
      }
    }

    loadData();
  }, []);

  const handleRestore = async (item: DismissedItem) => {
    setRestoringId(item.tmdb_id);
    try {
      await api.post("/api/recommendations/undismiss", {
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
      });

      setDismissedItems((prev) => prev.filter((i) => i.tmdb_id !== item.tmdb_id));

      toast.add({
        title: "Recomendação restaurada",
        description: `"${item.title}" voltou a ser elegível para as suas recomendações.`,
        type: "success",
      });
    } catch (err) {
      console.error("Erro ao restaurar recomendação:", err);
      toast.add({
        title: "Erro ao restaurar",
        description: "Não foi possível restaurar a obra. Tente novamente.",
        type: "error",
      });
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-10">
      {/* Cabeçalho do Perfil */}
      <section className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-md">
        {isLoadingUser ? (
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="w-48 h-6" />
              <Skeleton className="w-64 h-4" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xl md:text-2xl shadow-inner">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold">{user?.name || "Usuário"}</h1>
                  {user?.username ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                      @{user.username}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Sem username
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {user?.created_at && (
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Membro desde {formatDate(user.created_at)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditUsernameOpen(true)}
                className="border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-xs text-white cursor-pointer"
              >
                <AtSign className="w-3.5 h-3.5 mr-1.5 text-primary" />
                {user?.username ? "Alterar @username" : "Definir @username"}
              </Button>

              <Link href="/friends">
                <Button variant="outline" className="border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-xs text-white">
                  <Users className="w-4 h-4 mr-2 text-primary" />
                  Amigos
                </Button>
              </Link>

              <Link href="/lists">
                <Button variant="outline" className="border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-xs text-white">
                  <ListPlus className="w-4 h-4 mr-2 text-primary" />
                  Minhas Listas Personalizadas
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Seção: Obras Ocultadas (Não tenho interesse) */}
      <section className="space-y-6">
        <div className="border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-bold">Recomendações Ocultadas</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Obras que você marcou como <strong>&quot;Não tenho interesse&quot;</strong>. Elas ficam em repouso (snooze) temporário
            por 6 meses e não aparecem nos seus carrosséis de Explorar. Você pode restaurá-las a qualquer momento.
          </p>
        </div>

        {isLoadingDismissed ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
            ))}
          </div>
        ) : dismissedItems.length === 0 ? (
          <div className="bg-zinc-950/40 border border-dashed border-zinc-800 rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-muted-foreground">
              <Sparkles className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200">Nenhuma obra ocultada</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Quando você dispensar títulos no Explorar usando a opção <strong>&quot;Não tenho interesse&quot;</strong> no menu (...) de cada card, eles serão listados aqui para fácil gerenciamento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {dismissedItems.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden border border-zinc-800 bg-zinc-950/80 hover:border-zinc-700 transition-colors flex flex-col group"
              >
                <div className="aspect-[2/3] relative bg-zinc-900 overflow-hidden">
                  {item.poster_path ? (
                    <Image
                      src={
                        item.poster_path.startsWith("http")
                          ? item.poster_path
                          : `https://image.tmdb.org/t/p/w342${item.poster_path}`
                      }
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <Film className="w-10 h-10" />
                    </div>
                  )}

                  {/* Badge de tipo */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-md text-[10px] font-semibold text-zinc-200 rounded border border-white/10">
                      {item.media_type === "movie" ? (
                        <>
                          <Film className="w-2.5 h-2.5" /> Filme
                        </>
                      ) : (
                        <>
                          <Tv className="w-2.5 h-2.5" /> Série
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <CardContent className="p-3 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-xs md:text-sm line-clamp-1 text-zinc-100" title={item.title}>
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      Oculto até: {formatDate(item.expires_at)}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={restoringId === item.tmdb_id}
                    onClick={() => handleRestore(item)}
                    className="w-full text-xs h-8 border-zinc-800 hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${restoringId === item.tmdb_id ? "animate-spin" : ""}`} />
                    <span>{restoringId === item.tmdb_id ? "Restaurando..." : "Restaurar"}</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <EditUsernameModal
        open={isEditUsernameOpen}
        onOpenChange={setIsEditUsernameOpen}
        currentUsername={user?.username}
        onSuccess={(newUsername) => {
          setUser((prev) => (prev ? { ...prev, username: newUsername } : null));
        }}
      />
    </div>
  );
}
