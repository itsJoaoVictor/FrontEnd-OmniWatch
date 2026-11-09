"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Film,
  Tv,
  CheckCircle2,
  Clock,
  Quote,
  Send,
  X,
  Plus,
  Loader2,
  EyeOff,
  Sparkles,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { PosterImage } from "@/components/shared/PosterImage";
import { AddToListButton } from "@/components/shared/AddToListButton";
import { useMyListStore, ListStatus } from "@/store/useMyListStore";
import { friendsService } from "@/services/friendsService";
import { FriendRecommendationItem } from "@/types/friends";
import { cn } from "@/lib/utils";

interface RecommendationsTabProps {
  onPendingCountChange?: (count: number) => void;
}

export function RecommendationsTab({ onPendingCountChange }: RecommendationsTabProps) {
  const [subTab, setSubTab] = useState<"pending" | "history">("pending");
  const [recommendations, setRecommendations] = useState<FriendRecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { items: myItems, addToList } = useMyListStore();

  const loadData = useCallback(async (currentSubTab: "pending" | "history") => {
    setIsLoading(true);
    try {
      const data = await friendsService.getReceivedRecommendations(currentSubTab);
      setRecommendations(data);

      if (currentSubTab === "pending") {
        onPendingCountChange?.(data.length);
      }
    } catch (err) {
      console.error("Erro ao carregar recomendações:", err);
      toast.add({
        title: "Erro",
        description: "Erro ao carregar indicações de amigos.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    loadData(subTab);
  }, [subTab, loadData]);

  // Ação rápida: Adicionar à Minha Lista como "plan_to_watch"
  const handleQuickAdd = async (rec: FriendRecommendationItem) => {
    setProcessingId(rec.id);
    try {
      await addToList(rec.tmdb_id, rec.media_type, {
        title: rec.media_title,
        poster_path: rec.media_poster_path,
        release_date: rec.media_release_date,
        status: "plan_to_watch",
      });

      // Atualiza o status da recomendação para 'accepted'
      await friendsService.updateRecommendationStatus(rec.id, "accepted");
      toast.add({
        title: "Adicionado à Lista",
        description: `"${rec.media_title}" foi adicionado à sua lista!`,
        type: "success",
      });

      // Remove da lista pendente local
      setRecommendations((prev) => prev.filter((r) => r.id !== rec.id));
      onPendingCountChange?.(Math.max(0, recommendations.length - 1));
    } catch (err) {
      console.error("Erro ao adicionar à lista:", err);
      toast.add({
        title: "Erro",
        description: "Não foi possível adicionar à lista.",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Dispensar indicação
  const handleDismiss = async (rec: FriendRecommendationItem) => {
    setProcessingId(rec.id);
    try {
      await friendsService.updateRecommendationStatus(rec.id, "dismissed");
      toast.add({
        title: "Dispensado",
        description: "Indicação dispensada com sucesso.",
        type: "info",
      });
      setRecommendations((prev) => prev.filter((r) => r.id !== rec.id));
      onPendingCountChange?.(Math.max(0, recommendations.length - 1));
    } catch (err) {
      console.error("Erro ao dispensar indicação:", err);
      toast.add({
        title: "Erro",
        description: "Não foi possível dispensar a indicação.",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(parseISO(dateStr), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-abas: Pendentes vs Histórico */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={subTab === "pending" ? "default" : "outline"}
            onClick={() => setSubTab("pending")}
            className="text-xs h-8 rounded-lg"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Pendentes
            {subTab === "pending" && recommendations.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-bold">
                {recommendations.length}
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant={subTab === "history" ? "default" : "outline"}
            onClick={() => setSubTab("history")}
            className="text-xs h-8 rounded-lg"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Histórico
          </Button>
        </div>

        <p className="text-xs text-zinc-500 hidden sm:block">
          {subTab === "pending"
            ? "Títulos que seus amigos indicaram especialmente para você."
            : "Indicações que você já aceitou ou dispensou."}
        </p>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">Carregando indicações...</span>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
            {subTab === "pending" ? (
              <Inbox className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            {subTab === "pending"
              ? "Nenhuma indicação pendente"
              : "Seu histórico está vazio"}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto mb-5">
            {subTab === "pending"
              ? "Quando seus amigos recomendarem filmes ou séries para você, eles aparecerão aqui com recados exclusivos."
              : "As indicações que você aceitar ou dispensar serão arquivadas aqui para referência futura."}
          </p>
          {subTab === "pending" && (
            <Link href="/friends">
              <Button size="sm" variant="outline" className="text-xs">
                Ver Meus Amigos
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec) => {
            const isSaved = !!myItems[rec.tmdb_id];
            const year = rec.media_release_date
              ? rec.media_release_date.substring(0, 4)
              : null;
            const isProcessing = processingId === rec.id;

            return (
              <div
                key={rec.id}
                className="group relative flex flex-col justify-between bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 transition-all duration-200 overflow-hidden"
              >
                <div>
                  {/* Cabeçalho do Card: Quem indicou */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0 uppercase">
                        {rec.sender.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {rec.sender.name}
                        </p>
                        {rec.sender.username && (
                          <p className="text-[10px] text-zinc-400 truncate">
                            @{rec.sender.username}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-500 shrink-0">
                      {formatRelativeTime(rec.created_at)}
                    </span>
                  </div>

                  {/* Informações da Mídia */}
                  <div className="flex gap-3">
                    <Link
                      href={`/${rec.media_type}/${rec.tmdb_id}`}
                      className="shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-zinc-800 block hover:opacity-90 transition-opacity"
                    >
                      <PosterImage
                        src={rec.media_poster_path}
                        alt={rec.media_title}
                        tmdbSize="w185"
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${rec.media_type}/${rec.tmdb_id}`}
                        className="text-sm font-semibold text-white hover:text-primary transition-colors line-clamp-2"
                      >
                        {rec.media_title}
                      </Link>

                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                        <span className="flex items-center gap-1 font-medium text-zinc-300">
                          {rec.media_type === "movie" ? (
                            <Film className="w-3 h-3 text-primary" />
                          ) : (
                            <Tv className="w-3 h-3 text-primary" />
                          )}
                          {rec.media_type === "movie" ? "Filme" : "Série"}
                        </span>
                        {year && <span>• {year}</span>}
                        {typeof rec.media_vote_average === "number" &&
                          rec.media_vote_average > 0 && (
                            <span>• ★ {rec.media_vote_average.toFixed(1)}</span>
                          )}
                      </div>

                      {/* Status no Histórico */}
                      {subTab === "history" && (
                        <div className="mt-2">
                          {rec.status === "accepted" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Adicionado à lista
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                              <EyeOff className="w-3 h-3" /> Dispensado
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recado do Amigo (se houver) */}
                  {rec.message && (
                    <div className="mt-3 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2">
                      <Quote className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5 rotate-180" />
                      <p className="italic leading-relaxed break-words">{rec.message}</p>
                    </div>
                  )}
                </div>

                {/* Ações para Pendentes */}
                {subTab === "pending" && (
                  <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(rec)}
                      disabled={isProcessing}
                      className="text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 h-8 px-2.5"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Dispensar
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleQuickAdd(rec)}
                      disabled={isProcessing || isSaved}
                      className={cn(
                        "text-xs font-medium h-8 px-3 rounded-lg flex items-center gap-1.5",
                        isSaved
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isSaved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Na sua lista
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar à Lista
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
