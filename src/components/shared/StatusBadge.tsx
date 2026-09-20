
"use client";
import { cn } from "@/lib/utils";
import { useMyListStore, ListStatus } from "@/store/useMyListStore";

interface StatusBadgeProps {
  tmdb_id: number;
  className?: string;
}

const statusLabels: Record<ListStatus, string> = {
  plan_to_watch: "Quero Ver",
  watching: "Assistindo",
  completed: "Assistido",
  dropped: "Abandonei",
};

export function StatusBadge({ tmdb_id, className }: StatusBadgeProps) {
  const { items } = useMyListStore();
  const savedItem = items[tmdb_id];

  if (!savedItem) return null;

  return (
    <span className={cn(
      "px-2.5 py-0.5 text-[11px] font-bold rounded-full shadow-md backdrop-blur-md uppercase tracking-wider border border-white/10 bg-black/70",
      savedItem.status === "plan_to_watch" && "text-blue-400",
      savedItem.status === "watching" && "text-amber-400",
      savedItem.status === "completed" && "text-green-400",
      savedItem.status === "dropped" && "text-red-400",
      className
    )}>
      {statusLabels[savedItem.status]}
    </span>
  );
}

