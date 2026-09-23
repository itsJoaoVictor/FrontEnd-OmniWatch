"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Film, Tv, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface PosterImageProps {
  src?: string | null;
  fallbackSrc?: string | null; // ex: backdrop_path horizontal para resgate
  alt: string;
  title?: string;
  type?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  className?: string;
  containerClassName?: string;
  showTitleInFallback?: boolean;
}

export type TmdbSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "w1280" | "original";

/**
 * Constrói URL direta do TMDB
 */
export function buildTmdbUrl(src?: string | null, size: TmdbSize = "w342"): string | null {
  if (!src || typeof src !== "string" || src.trim() === "") return null;

  const trimmed = src.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("image.tmdb.org/t/p/")) {
      return trimmed.replace(/\/t\/p\/(w[0-9]+|original)\//, `/t/p/${size}/`);
    }
    return trimmed;
  }

  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `https://image.tmdb.org/t/p/${size}${cleanPath}`;
}

/**
 * Constrói URL de fallback através do Proxy com Cache do Backend OmniWatch
 */
export function buildProxyUrl(src?: string | null, size: TmdbSize = "w342"): string | null {
  if (!src || typeof src !== "string" || src.trim() === "") return null;

  const trimmed = src.trim();
  // Extrai apenas o caminho relativo se já for URL do TMDB
  const pathOnly = trimmed.replace(/^https?:\/\/image\.tmdb\.org\/t\/p\/(w[0-9]+|original)/, "");
  const cleanPath = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${apiUrl}/api/images/proxy?path=${encodeURIComponent(cleanPath)}&size=${size}`;
}

type LoadingStage =
  | "primary-direct"   // TMDB direto (w342)
  | "primary-proxy"    // Backend Proxy (w342)
  | "fallback-direct"  // TMDB direto com backdrop (w780)
  | "fallback-proxy"   // Backend Proxy com backdrop (w780)
  | "exhausted";       // Todos falharam ou nenhuma imagem informada

export function PosterImage({
  src,
  fallbackSrc,
  alt,
  title,
  type = "movie",
  priority = false,
  className,
  containerClassName,
  showTitleInFallback = true,
}: PosterImageProps) {
  // Determina estágio inicial baseado na presença de src
  const getInitialStage = (): LoadingStage => {
    if (src && src.trim() !== "") return "primary-direct";
    if (fallbackSrc && fallbackSrc.trim() !== "") return "fallback-direct";
    return "exhausted";
  };

  const [stage, setStage] = useState<LoadingStage>(getInitialStage);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reseta o ciclo quando o src ou fallbackSrc mudam externamente
  useEffect(() => {
    setStage(getInitialStage());
    setIsLoaded(false);
  }, [src, fallbackSrc]);

  // Calcula a URL atual dependendo do estágio
  const getCurrentUrl = (): string | null => {
    switch (stage) {
      case "primary-direct":
        return buildTmdbUrl(src, "w342");
      case "primary-proxy":
        return buildProxyUrl(src, "w342");
      case "fallback-direct":
        return buildTmdbUrl(fallbackSrc, "w780");
      case "fallback-proxy":
        return buildProxyUrl(fallbackSrc, "w780");
      case "exhausted":
      default:
        return null;
    }
  };

  const currentUrl = getCurrentUrl();

  // Avança para o próximo estágio de recuperação
  const advanceStage = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoaded(false);

    setStage((prev) => {
      switch (prev) {
        case "primary-direct":
          return "primary-proxy";
        case "primary-proxy":
          return fallbackSrc && fallbackSrc.trim() !== "" ? "fallback-direct" : "exhausted";
        case "fallback-direct":
          return "fallback-proxy";
        case "fallback-proxy":
        case "exhausted":
        default:
          return "exhausted";
      }
    });
  }, [fallbackSrc]);

  // Gerenciador de timeout (3.5 segundos para TMDB direto)
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Se estiver em modo direto TMDB e ainda não carregou, dá um timeout de segurança
    if ((stage === "primary-direct" || stage === "fallback-direct") && !isLoaded) {
      timeoutRef.current = setTimeout(() => {
        // Se após 3.5s a imagem ainda não carregou, chaveia para o proxy do backend
        advanceStage();
      }, 3500);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [stage, isLoaded, advanceStage]);

  // Trata imagens já no cache do navegador (evita que fiquem presas em loading no React)
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [currentUrl]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.naturalWidth > 0) {
      setIsLoaded(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  const handleImageError = () => {
    advanceStage();
  };

  const displayTitle = title || alt;

  const getFallbackIcon = (size: number = 24) => {
    const iconClass = `w-${size === 28 ? "7" : size === 18 ? "4" : "6"} h-${size === 28 ? "7" : size === 18 ? "4" : "6"}`;
    switch (type?.toLowerCase()) {
      case "tv":
        return <Tv className={iconClass} />;
      case "person":
        return <User className={iconClass} />;
      case "movie":
      default:
        return <Film className={iconClass} />;
    }
  };

  // Se esgotou todas as tentativas ou não há URL disponível
  if (stage === "exhausted" || !currentUrl) {
    return (
      <div
        className={cn(
          "w-full h-full flex flex-col justify-between p-4 text-center bg-gradient-to-b from-zinc-800/95 via-zinc-900 to-zinc-950 border border-zinc-700/40 select-none overflow-hidden relative",
          containerClassName
        )}
      >
        <div className="w-full flex justify-between items-center text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
          <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50">
            {type === "tv" ? "Série" : type === "person" ? "Pessoa" : "Filme"}
          </span>
        </div>

        <div className="my-auto flex flex-col items-center justify-center py-2">
          <div className="p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/40 shadow-inner mb-3 text-primary/80">
            {getFallbackIcon(28)}
          </div>
          {showTitleInFallback && (
            <p className="text-xs font-semibold text-zinc-200 line-clamp-3 leading-snug px-1 max-w-[95%]">
              {displayTitle}
            </p>
          )}
        </div>

        <div className="w-full text-center">
          <span className="text-[10px] text-zinc-500 font-mono tracking-tight">Sem pôster</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden bg-zinc-900 select-none",
        containerClassName
      )}
    >
      {/* Skeleton elegante enquanto carrega para nunca ficar uma tela preta vazia */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-zinc-800 to-zinc-950 animate-pulse select-none z-0">
          <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700/40 flex items-center justify-center mb-2 text-zinc-500">
            {getFallbackIcon(18)}
          </div>
          {displayTitle && (
            <p className="text-[11px] font-medium text-zinc-400 line-clamp-2 px-2 max-w-[90%]">
              {displayTitle}
            </p>
          )}
        </div>
      )}

      {/* Imagem do Poster ou Backdrop */}
      <img
        ref={imgRef}
        key={currentUrl}
        src={currentUrl}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300 relative z-10",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </div>
  );
}
