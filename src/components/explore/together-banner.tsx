"use client";

import Link from "next/link";
import { Users, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TogetherBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/15 via-purple-600/10 to-pink-600/10 p-5 md:p-6 shadow-md transition-all hover:border-primary/40">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
                Assistir Juntos
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                <Sparkles className="w-3 h-3" /> Novo
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-xl">
              Combine seu perfil com o de um amigo! Nosso sistema analisa o gosto dos dois para recomendar o que vocês vão adorar assistir juntos.
            </p>
          </div>
        </div>

        <Link href="/explore/together" className="shrink-0 w-full sm:w-auto">
          <Button className="w-full sm:w-auto font-semibold gap-2 shadow-sm">
            <span>Combinar Gostos</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
