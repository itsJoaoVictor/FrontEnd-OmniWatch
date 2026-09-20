import { SeasonItem } from "@/types/details";
import { SeasonCard } from "./SeasonCard";

interface SeasonsListProps {
  seasons: SeasonItem[];
  seriesId: number;
  fallbackPosterPath?: string | null;
}

export function SeasonsList({ seasons, seriesId, fallbackPosterPath }: SeasonsListProps) {
  if (!seasons || seasons.length === 0) return null;

  return (
    <div className="my-8">
      <h3 className="text-2xl font-semibold mb-6">Temporadas</h3>
      <div className="flex flex-col gap-6">
        {seasons.map((season) => (
          <SeasonCard
            key={season.id}
            season={season}
            seriesId={seriesId}
            fallbackPosterPath={fallbackPosterPath}
          />
        ))}
      </div>
    </div>
  );
}
