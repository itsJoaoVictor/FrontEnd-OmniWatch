"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { friendsService } from "@/services/friendsService";
import { FriendEligibilityItem, IneligibleReason } from "@/types/friends";
import { PosterImage } from "@/components/shared/PosterImage";
import {
  Search,
  Send,
  Loader2,
  Check,
  UserCheck,
  Clock,
  Film,
  Tv,
  Users,
  AlertCircle,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaInfo {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath?: string | null;
  releaseDate?: string | null;
  voteAverage?: number | null;
}

interface RecommendToFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaInfo;
  initialFriendId?: string;
  initialFriendName?: string;
}

export function RecommendToFriendModal({
  isOpen,
  onClose,
  media,
  initialFriendId,
  initialFriendName,
}: RecommendToFriendModalProps) {
  const [friends, setFriends] = useState<FriendEligibilityItem[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFriendIds(new Set());
      setMessage("");
      setSearchQuery("");
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    friendsService
      .getRecommendationEligibility(media.tmdbId, media.mediaType)
      .then((data) => {
        if (!isMounted) return;
        setFriends(data);

        // Se veio um amigo inicial (ex: do Together), pré-seleciona se estiver elegível
        if (initialFriendId) {
          const target = data.find((f) => f.id === initialFriendId);
          if (target && target.is_eligible) {
            setSelectedFriendIds(new Set([initialFriendId]));
          }
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar amigos elegíveis:", err);
        toast.add({
          title: "Erro",
          description: "Não foi possível carregar sua lista de amigos.",
          type: "error",
        });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, media.tmdbId, media.mediaType, initialFriendId]);

  const filteredFriends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.username && f.username.toLowerCase().includes(q))
    );
  }, [friends, searchQuery]);

  const toggleFriend = (id: string, isEligible: boolean) => {
    if (!isEligible || isSending) return;
    setSelectedFriendIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllEligible = () => {
    const eligibleIds = filteredFriends.filter((f) => f.is_eligible).map((f) => f.id);
    setSelectedFriendIds(new Set(eligibleIds));
  };

  const deselectAll = () => {
    setSelectedFriendIds(new Set());
  };

  const getReasonBadge = (reason: IneligibleReason | null) => {
    switch (reason) {
      case "ALREADY_WATCHED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="w-3 h-3" /> Já assistiu
          </span>
        );
      case "ALREADY_IN_LIST":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Check className="w-3 h-3" /> Já na lista
          </span>
        );
      case "PENDING_RECOMMENDATION":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Já enviada
          </span>
        );
      default:
        return null;
    }
  };

  const handleSend = async () => {
    if (selectedFriendIds.size === 0) return;

    setIsSending(true);
    try {
      await friendsService.sendRecommendation({
        recipient_ids: Array.from(selectedFriendIds),
        tmdb_id: media.tmdbId,
        media_type: media.mediaType,
        media_title: media.title,
        media_poster_path: media.posterPath,
        media_release_date: media.releaseDate,
        media_vote_average: media.voteAverage,
        message: message.trim() || undefined,
      });

      const count = selectedFriendIds.size;
      toast.add({
        title: "Sucesso",
        description:
          count === 1
            ? "Indicação enviada com sucesso!"
            : `Indicação enviada para ${count} amigos!`,
        type: "success",
      });
      onClose();
    } catch (err: any) {
      console.error("Erro ao enviar recomendação:", err);
      const detail = err?.response?.data?.detail;
      toast.add({
        title: "Não foi possível enviar",
        description: typeof detail === "string" ? detail : "Falha ao enviar indicação.",
        type: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  const year = media.releaseDate ? media.releaseDate.substring(0, 4) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSending && onClose()}>
      <DialogContent className="max-w-lg w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl">
        {/* Header com prévia da mídia */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/50">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Recomendar a um Amigo
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Envie uma indicação personalizada privada para seus amigos no OmniWatch.
            </DialogDescription>
          </DialogHeader>

          {/* Mini Card da Mídia */}
          <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl">
            <div className="w-12 h-16 rounded-md overflow-hidden shrink-0 bg-zinc-800 relative">
              <PosterImage
                src={media.posterPath || null}
                alt={media.title}
                tmdbSize="w185"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">{media.title}</h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                <span className="flex items-center gap-1 font-medium text-zinc-300">
                  {media.mediaType === "movie" ? (
                    <Film className="w-3 h-3 text-primary" />
                  ) : (
                    <Tv className="w-3 h-3 text-primary" />
                  )}
                  {media.mediaType === "movie" ? "Filme" : "Série"}
                </span>
                {year && <span>• {year}</span>}
                {typeof media.voteAverage === "number" && media.voteAverage > 0 && (
                  <span className="flex items-center gap-1 text-amber-400 font-medium">
                    • <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {(media.voteAverage / 2).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Corpo: Lista de Amigos */}
        <div className="p-5 space-y-4 max-h-[460px] overflow-y-auto">
          {/* Busca de Amigos & Ações rápidas */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar amigo por nome ou @username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between text-xs px-1 text-zinc-400">
              <span>
                {selectedFriendIds.size > 0
                  ? `${selectedFriendIds.size} selecionado${selectedFriendIds.size > 1 ? "s" : ""}`
                  : "Nenhum amigo selecionado"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllEligible}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Selecionar todos
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de amigos */}
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-zinc-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs">Carregando amigos...</span>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs flex flex-col items-center gap-2">
                <Users className="w-6 h-6 text-zinc-600" />
                {searchQuery
                  ? "Nenhum amigo encontrado para esta busca."
                  : "Você ainda não possui amigos adicionados."}
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const isSelected = selectedFriendIds.has(friend.id);
                const isEligible = friend.is_eligible;

                return (
                  <div
                    key={friend.id}
                    onClick={() => toggleFriend(friend.id, isEligible)}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border transition-all select-none",
                      isEligible
                        ? "cursor-pointer hover:bg-zinc-900/80 active:scale-[0.99]"
                        : "opacity-60 cursor-not-allowed bg-zinc-900/30 border-zinc-800/50",
                      isSelected
                        ? "bg-primary/10 border-primary/40 text-white"
                        : "bg-zinc-900/50 border-zinc-800/80 text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Checkbox customizado */}
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                          isSelected
                            ? "bg-primary border-primary text-black"
                            : isEligible
                            ? "border-zinc-700 bg-zinc-800/50"
                            : "border-zinc-800 bg-zinc-900 text-transparent"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {/* Avatar e Info */}
                      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-xs font-semibold text-zinc-200 shrink-0 uppercase">
                        {friend.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {friend.name}
                        </p>
                        {friend.username && (
                          <p className="text-[11px] text-zinc-400 truncate">
                            @{friend.username}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Badge se inelegível */}
                    {!isEligible && (
                      <div className="shrink-0 ml-2">
                        {getReasonBadge(friend.ineligible_reason)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Campo de Mensagem Opcional */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <label htmlFor="rec-message" className="font-medium">
                Recado opcional:
              </label>
              <span className={cn(message.length > 260 ? "text-amber-400" : "text-zinc-500")}>
                {message.length}/280
              </span>
            </div>
            <textarea
              id="rec-message"
              rows={2}
              maxLength={280}
              placeholder="Ex: 'Lembrei de você com esse filme! Tem tudo a ver com o que você gosta.'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 resize-none transition-colors"
            />
          </div>
        </div>

        {/* Footer com botões */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSending}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={selectedFriendIds.size === 0 || isSending}
            className="text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 px-4"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Enviar Indicação
                {selectedFriendIds.size > 0 && ` (${selectedFriendIds.size})`}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
