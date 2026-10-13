
"use client";
import { cn } from "@/lib/utils";
import { useMyListStore, ListStatus } from "@/store/useMyListStore";

import { RotateCcw } from "lucide-react";

interface StatusBadgeProps {
  tmdb_id: number;
  className?: string;
}

const statusLabels: Record<ListStatus, string> = {
  plan_to_watch: "Quero Ver",
  watching: "Assistindo",
  completed: "Assistido",
  dropped: "Abandonei",
  upcoming: "Aguardando Estreia",
};

export function StatusBadge({ tmdb_id, className }: StatusBadgeProps) {
  const { items } = useMyListStore();
  const savedItem = items[tmdb_id];

  if (!savedItem) return null;

  const rewatchCount = savedItem.rewatch_count || 0;

  return (
    <span className={cn(
      "px-2.5 py-0.5 text-[11px] font-bold rounded-full shadow-md backdrop-blur-md uppercase tracking-wider border border-white/15 bg-black/90 inline-flex items-center gap-1.5",
      savedItem.status === "plan_to_watch" && "text-blue-400",
      savedItem.status === "watching" && "text-amber-400",
      savedItem.status === "completed" && "text-green-400",
      savedItem.status === "dropped" && "text-red-400",
      savedItem.status === "upcoming" && "text-purple-400 border-purple-500/30",
      className
    )}>
      <span>{statusLabels[savedItem.status]}</span>
      {rewatchCount > 0 && (
        <>
          <span className="text-white/30 text-[10px]">•</span>
          <span
            className="text-emerald-300 font-semibold inline-flex items-center gap-0.5 normal-case"
            title={`Reassistido ${rewatchCount}x (${rewatchCount + 1}x no total)`}
          >
            <RotateCcw className="w-2.5 h-2.5 stroke-[2.5]" />
            <span>{rewatchCount > 1 ? `Reassistido ${rewatchCount}x` : "Reassistido"}</span>
          </span>
        </>
      )}
    </span>
  );
}

