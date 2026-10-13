"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/useUserStore";
import { APP_RELEASES, LATEST_RELEASE_ID } from "@/lib/changelog";
import { Sparkles, CheckCircle2, Layers, Calendar } from "lucide-react";

export function WhatsNewModal() {
  const { user, isLoading, isInitialized, fetchUser, markReleaseSeen } = useUserStore();
  const [dismissedInSession, setDismissedInSession] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isInitialized || (user && typeof user.last_seen_release_id !== "number"))) {
      fetchUser();
    }
  }, [isInitialized, isLoading, user, fetchUser]);

  // Calcula todas as atualizações publicadas desde o último acesso do usuário (acumulativo)
  // utilizando exclusivamente o registro persistido no banco de dados (backend)
  const unseenReleases = useMemo(() => {
    if (!isInitialized || !user) return [];
    // Aguarda o carregamento completo do last_seen_release_id do banco para evitar abrir o modal indevidamente após o login
    if (typeof user.last_seen_release_id !== "number") return [];
    // Aguarda o usuário configurar o @username primeiro para não sobrepor modais
    if (!user.username) return [];

    const dbSeen = user.last_seen_release_id;

    return APP_RELEASES.filter((release) => release.id > dbSeen).sort(
      (a, b) => b.id - a.id
    );
  }, [isInitialized, user]);

  const isOpen = unseenReleases.length > 0 && !dismissedInSession;

  const handleConfirm = async () => {
    setDismissedInSession(true);
    if (user?.id) {
      await markReleaseSeen(LATEST_RELEASE_ID);
    }
  };

  if (!isOpen) return null;

  const isMultiple = unseenReleases.length > 1;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleConfirm();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg bg-zinc-950/95 border border-white/10 backdrop-blur-xl shadow-2xl rounded-2xl p-6 text-white max-h-[85vh] flex flex-col">
        <DialogHeader className="space-y-3 text-left flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            {isMultiple ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
                <Layers className="w-3.5 h-3.5" />
                {unseenReleases.length} novas atualizações
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
                Novidade {unseenReleases[0].version}
              </span>
            )}
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight">
            {isMultiple
              ? "O que mudou desde seu último acesso"
              : unseenReleases[0].title}
          </DialogTitle>

          <DialogDescription className="text-zinc-400 text-sm leading-relaxed">
            {isMultiple
              ? `Confira as ${unseenReleases.length} atualizações lançadas no OmniWatch desde a sua última visita:`
              : unseenReleases[0].summary}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6 overflow-y-auto pr-1 flex-1">
          {unseenReleases.map((release) => (
            <div
              key={release.id}
              className={
                isMultiple
                  ? "relative pl-4 border-l-2 border-primary/40 space-y-3"
                  : "space-y-3"
              }
            >
              {isMultiple && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/20 text-primary">
                      {release.version}
                    </span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {release.date}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    {release.title}
                  </h4>
                  <p className="text-xs text-zinc-400">{release.summary}</p>
                </div>
              )}

              <div className="space-y-2.5">
                {release.highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        {item.title}
                      </span>
                      {item.tag && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed pl-5">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 mt-2 border-t border-white/10 flex-shrink-0">
          <Button
            type="button"
            onClick={handleConfirm}
            className="w-full h-10 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
          >
            Entendi, conferir novidades
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
