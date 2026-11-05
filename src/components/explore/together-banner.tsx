"use client";

import Link from "next/link";
import { Users, Sparkles, ArrowRight, Film, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TogetherBanner() {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-purple-600/10 to-pink-600/10 p-5 md:p-6 shadow-md transition-all duration-300 hover:border-primary/55 hover:shadow-lg hover:shadow-primary/5">
      {/* Luz ambiente de fundo */}
      <div className="absolute -top-16 -right-16 w-52 h-52 bg-primary/15 rounded-full blur-3xl pointer-events-none transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          {/* Ícone com anel e dupla insígnia */}
          <div className="relative shrink-0">
            <div className="p-3 rounded-2xl bg-primary/20 text-primary border border-primary/35 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center text-[10px] text-zinc-950 font-black shadow-xs">
              ⚡
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-foreground">
                Assistir Juntos
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                <Sparkles className="w-3 h-3 text-amber-400" /> Match Duplo
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground border border-border">
                <Film className="w-3 h-3" /> Filmes & Séries
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
              Combine seu perfil com o de um amigo! Nosso algoritmo cruza a biblioteca dos dois e encontra obras de máximo consenso para a sessão perfeita.
            </p>
          </div>
        </div>

        <Link href="/explore/together" className="shrink-0 w-full sm:w-auto">
          <Button className="w-full sm:w-auto font-bold gap-2 shadow-sm group-hover:shadow-md transition-all cursor-pointer">
            <span>Combinar Gostos</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
