"use client";

import Image from "next/image";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface MediaItem {
  id: string;
  title: string;
  type: string;
  coverHorizontal?: string;
  coverVertical?: string;
  progress?: number;
  currentEpisode?: string | null;
}

interface MediaCardProps {
  item: MediaItem;
  layout?: "tracking" | "poster";
}

export function MediaCard({ item, layout = "poster" }: MediaCardProps) {
  const [isWatched, setIsWatched] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Layout para "Continue Assistindo" (Estilo Tracker/TV Time)
  if (layout === "tracking") {
    return (
      <Link href={`/title/${item.id}`} className="group relative flex gap-4 bg-card hover:bg-accent border border-border hover:border-primary/50 rounded-xl p-3 transition-all duration-300 cursor-pointer block">
        <div className="relative w-32 md:w-40 aspect-video rounded-lg overflow-hidden shrink-0 shadow-md">
          {item.coverHorizontal && (
            <Image
              src={item.coverHorizontal}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}
          {/* Overlay escuro leve na imagem */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
        </div>
        
        <div className="flex-1 flex flex-col justify-center py-1 overflow-hidden">
          <p className="text-xs text-primary font-medium mb-1 tracking-wider uppercase">
            {item.currentEpisode ? `Próximo: ${item.currentEpisode}` : "Novo"}
          </p>
          <h3 className="text-foreground font-bold text-base md:text-lg truncate mb-2">
            {item.title}
          </h3>
          
          {item.progress !== undefined && (
            <div className="mt-auto flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{item.progress}%</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center pr-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsWatched(!isWatched);
            }}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 border-2",
              isWatched 
                ? "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                : "bg-transparent border-muted-foreground/50 text-muted-foreground hover:border-primary hover:text-primary"
            )}
            title="Marcar como visto"
          >
            <Check className={cn("w-5 h-5", isWatched && "stroke-[3px]")} />
          </button>
        </div>
      </Link>
    );
  }

  // Layout Poster Clássico (Descobrir/Em Alta)
  return (
    <Link href={`/title/${item.id}`} className="relative group cursor-pointer w-full transition-all duration-300 hover:-translate-y-2 block">
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-muted shadow-lg border border-border group-hover:border-primary/50 transition-colors">
        {item.coverVertical && (
          <Image
            src={item.coverVertical}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        
        {/* Overlay do Poster - sempre dark para garantir leitura sobre imagem */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="flex items-center justify-between translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight flex-1">
              {item.title}
            </h3>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsAdded(!isAdded);
              }}
              className="ml-2 w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
