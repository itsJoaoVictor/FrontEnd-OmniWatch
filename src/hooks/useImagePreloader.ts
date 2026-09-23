"use client";

import { useEffect, useRef } from "react";
import { buildTmdbUrl } from "@/components/shared/PosterImage";

interface PreloadOptions {
  /**
   * Quantidade de itens iniciais a ignorar no preload (pois já são carregados com prioridade na tela visível).
   * Padrão: 12
   */
  initialSkip?: number;
  /**
   * Quantidade de imagens a carregar em cada lote em segundo plano.
   * Padrão: 4
   */
  batchSize?: number;
  /**
   * Intervalo em milissegundos entre lotes sucessivos.
   * Padrão: 350
   */
  batchDelayMs?: number;
}

const preloadedUrls = new Set<string>();

/**
 * Hook para pré-carregar imagens em segundo plano quando o navegador estiver ocioso (requestIdleCallback),
 * evitando travar o carregamento dos itens prioritários da tela inicial.
 */
export function useImagePreloader(
  items: (string | null | undefined)[],
  options: PreloadOptions = {}
) {
  const { initialSkip = 12, batchSize = 4, batchDelayMs = 350 } = options;
  const isCancelledRef = useRef(false);

  useEffect(() => {
    isCancelledRef.current = false;

    // Filtra e prepara apenas os itens que estão além do viewport inicial
    const candidates = items
      .slice(initialSkip)
      .filter((p): p is string => Boolean(p && p.trim() !== ""));

    if (candidates.length === 0) return;

    let currentIndex = 0;
    let timerId: NodeJS.Timeout | null = null;
    let idleId: number | null = null;

    const processNextBatch = () => {
      if (isCancelledRef.current || currentIndex >= candidates.length) {
        return;
      }

      const batch = candidates.slice(currentIndex, currentIndex + batchSize);
      currentIndex += batchSize;

      batch.forEach((posterPath) => {
        const fullUrl = buildTmdbUrl(posterPath, "w342");
        if (!fullUrl || preloadedUrls.has(fullUrl)) return;

        preloadedUrls.add(fullUrl);

        try {
          const img = new Image();
          img.decoding = "async";
          if ("fetchPriority" in img) {
            (img as any).fetchPriority = "low";
          }
          img.src = fullUrl;
        } catch {
          // Ignora falhas de preloading silenciosamente
        }
      });

      if (currentIndex < candidates.length && !isCancelledRef.current) {
        timerId = setTimeout(() => {
          scheduleBatch();
        }, batchDelayMs);
      }
    };

    const scheduleBatch = () => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        idleId = (window as any).requestIdleCallback(processNextBatch, { timeout: 2000 });
      } else {
        timerId = setTimeout(processNextBatch, 500);
      }
    };

    // Inicia o agendamento após um breve delay para garantir que o render inicial tenha prioridade total
    const startTimer = setTimeout(() => {
      scheduleBatch();
    }, 1000);

    return () => {
      isCancelledRef.current = true;
      clearTimeout(startTimer);
      if (timerId) clearTimeout(timerId);
      if (idleId && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        (window as any).cancelIdleCallback(idleId);
      }
    };
  }, [items, initialSkip, batchSize, batchDelayMs]);
}
