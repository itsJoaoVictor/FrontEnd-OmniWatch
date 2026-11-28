
"use client";
import { cn } from "@/lib/utils";
import { useMyListStore } from "@/store/useMyListStore";
import { MEDIA_STATUS_CONFIG } from "@/lib/mediaStatus";

import { RotateCcw } from "lucide-react";

interface StatusBadgeProps {
  tmdb_id: number;
  className?: string;
}

export function StatusBadge({ tmdb_id, className }: StatusBadgeProps) {
  const { items } = useMyListStore();
  const savedItem = items[tmdb_id];

  if (!savedItem) return null;

  const statusConfig = MEDIA_STATUS_CONFIG[savedItem.status] ?? MEDIA_STATUS_CONFIG.plan_to_watch;
  const rewatchCount = savedItem.rewatch_count || 0;

  return (
    <span className={cn(
      "px-2.5 py-0.5 text-[11px] font-bold rounded-full shadow-md backdrop-blur-md uppercase tracking-wider border bg-black/90 inline-flex items-center gap-1.5",
      statusConfig.badgeClass,
      className
    )}>
      <span>{statusConfig.label}</span>
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

