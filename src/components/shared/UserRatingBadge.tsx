"use client";
import { Star } from "lucide-react";
import { useMyListStore } from "@/store/useMyListStore";

export function UserRatingBadge({ tmdb_id }: { tmdb_id: number }) {
  const { items } = useMyListStore();
  const savedItem = items[tmdb_id];

  if (!savedItem || !savedItem.rating) return null;

  return (
    <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md border border-white/15 px-2.5 py-0.5 rounded-full shadow-md" title="Sua Nota">
      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
      <span className="font-semibold text-yellow-500 text-[13px]">
        {savedItem.rating.toFixed(1)}
      </span>
      <span className="text-[10px] text-gray-300 font-medium uppercase tracking-wider ml-1">Voce</span>
    </div>
  );
}
