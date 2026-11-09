"use client";

import React, { useState, useEffect } from "react";
import { BellRing, Smartphone, X, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { pushNotificationService } from "@/services/pushNotificationService";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "omniwatch_push_prompt_dismissed_until";

export function PushNotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const user = useUserStore((state) => state.user);
  const isInitialized = useUserStore((state) => state.isInitialized);

  useEffect(() => {
    // Só sincroniza ou exibe prompt se o usuário estiver autenticado no app
    if (!isInitialized || !user) return;

    // 1. Verifica se Web Push é suportado no aparelho/navegador
    if (!pushNotificationService.isSupported()) return;

    // 2. Se a permissão já foi concedida, garante silenciosamente a sincronização e renovação de chave em background
    if (Notification.permission === "granted") {
      pushNotificationService.syncSubscription().catch(() => {});
      return;
    }

    // Se o usuário bloqueou expressamente, não exibe o prompt
    if (Notification.permission === "denied") return;

    // 3. Verifica se o usuário dispensou recentemente (snooze de 7 dias)
    const dismissedUntil = localStorage.getItem(DISMISSED_KEY);
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      return;
    }

    // 4. Verifica se já está inscrito
    pushNotificationService.isSubscribed().then((subscribed) => {
      if (subscribed) return;

      // Aguarda 2.5 segundos após abrir o app para exibir o prompt de forma suave e contextual
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2500);

      return () => clearTimeout(timer);
    });
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Adia o próximo aviso por 7 dias para respeitar o usuário
    const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, sevenDays.toString());
  };

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const success = await pushNotificationService.subscribe();
      if (success) {
        setIsVisible(false);
        toast.add({
          title: "Notificações ativadas! 🔔",
          description: "Você receberá indicações e novidades na barra do celular.",
          type: "success",
        });
      } else {
        setIsVisible(false);
        // Se o usuário recusou ou fechou o diálogo nativo
        const threeDays = Date.now() + 3 * 24 * 60 * 60 * 1000;
        localStorage.setItem(DISMISSED_KEY, threeDays.toString());
      }
    } catch (err) {
      console.error("Erro ao ativar push pelo banner:", err);
      setIsVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed z-50 bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="relative overflow-hidden bg-zinc-950/95 backdrop-blur-xl border border-primary/30 p-4 rounded-2xl shadow-2xl text-zinc-100 flex flex-col gap-3">
        {/* Glow de fundo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 font-semibold text-sm text-white">
              <span>Ativar Notificações no Celular?</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-primary/20 text-primary border border-primary/30">
                Push
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Receba indicações dos seus amigos e avisos de novos episódios direto na barra de status do seu aparelho.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Mais tarde"
            aria-label="Dispensar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800/60 relative z-10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            disabled={isLoading}
            className="text-xs text-zinc-400 hover:text-white h-8 px-3"
          >
            Mais tarde
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleEnable}
            disabled={isLoading}
            className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Ativando...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Ativar Notificações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
