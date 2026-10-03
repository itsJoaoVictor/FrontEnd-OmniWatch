import Image from "next/image";
import { NetworkItem, EpisodeItem } from "@/types/details";
import { formatReleaseDate } from "@/lib/dateUtils";

interface TvTechnicalDetailsSidebarProps {
  status: string;
  networks: NetworkItem[];
  nextEpisodeToAir: EpisodeItem | null;
  lastEpisodeToAir: EpisodeItem | null;
  numberOfSeasons: number;
  numberOfEpisodes: number;
}

export function TvTechnicalDetailsSidebar({
  status,
  networks,
  nextEpisodeToAir,
  lastEpisodeToAir,
  numberOfSeasons,
  numberOfEpisodes,
}: TvTechnicalDetailsSidebarProps) {
  
  // Translate status to Portuguese
  const statusTranslations: Record<string, string> = {
    "Returning Series": "Série de Retorno (Renovada)",
    "Ended": "Finalizada",
    "Canceled": "Cancelada",
    "In Production": "Em Produção",
    "Planned": "Planejada",
    "Pilot": "Piloto"
  };
  const translatedStatus = statusTranslations[status] || status;

  return (
    <aside className="bg-card text-card-foreground p-6 rounded-xl border border-border space-y-6">
      <h3 className="font-semibold text-lg border-b border-border pb-2">Detalhes Técnicos</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
          <p className="text-sm font-medium">{translatedStatus}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Temporadas</h4>
            <p className="text-sm font-medium">{numberOfSeasons}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Episódios</h4>
            <p className="text-sm font-medium">{numberOfEpisodes}</p>
          </div>
        </div>

        {networks && networks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Redes / Emissoras</h4>
            <div className="flex flex-col gap-4">
              {networks.map((network) => (
                <div key={network.id} className="flex items-center gap-3">
                  {network.logo_path ? (
                    <div className="bg-white/90 p-1 rounded-md flex-shrink-0 flex items-center justify-center w-12 h-12 overflow-hidden">
                      <Image
                        src={`https://image.tmdb.org/t/p/w200${network.logo_path}`}
                        alt={network.name}
                        width={40}
                        height={40}
                        className="object-contain max-h-full max-w-full"
                        style={{ width: "auto", height: "auto" }}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="bg-muted p-1 rounded-md flex-shrink-0 flex items-center justify-center w-12 h-12">
                      <span className="text-[10px] text-muted-foreground text-center line-clamp-2 px-1">{network.name}</span>
                    </div>
                  )}
                  <span className="text-sm font-medium leading-tight">{network.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {nextEpisodeToAir && (
          <div className="pt-2 border-t border-border/50">
            <h4 className="text-sm font-medium text-green-500 mb-1">Próximo Episódio</h4>
            <div className="text-sm">
              <p className="font-semibold">{nextEpisodeToAir.name}</p>
              <p className="text-muted-foreground text-xs mt-1">
                T{nextEpisodeToAir.season_number} E{nextEpisodeToAir.episode_number} 
                {nextEpisodeToAir.air_date ? ` • ${formatReleaseDate(nextEpisodeToAir.air_date)}` : ""}
              </p>
            </div>
          </div>
        )}

        {lastEpisodeToAir && (
          <div className="pt-2 border-t border-border/50">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Último Episódio Lançado</h4>
            <div className="text-sm">
              <p className="font-semibold">{lastEpisodeToAir.name}</p>
              <p className="text-muted-foreground text-xs mt-1">
                T{lastEpisodeToAir.season_number} E{lastEpisodeToAir.episode_number}
                {lastEpisodeToAir.air_date ? ` • ${formatReleaseDate(lastEpisodeToAir.air_date)}` : ""}
              </p>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
