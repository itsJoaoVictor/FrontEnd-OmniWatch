import Image from "next/image";
import { ProductionCompanyItem } from "@/types/details";

interface TechnicalDetailsSidebarProps {
  originalTitle: string;
  originalLanguage: string;
  status: string;
  productionCompanies: ProductionCompanyItem[];
}

export function TechnicalDetailsSidebar({
  originalTitle,
  originalLanguage,
  status,
  productionCompanies,
}: TechnicalDetailsSidebarProps) {
  // Convert language codes to full names (simple mapping, could be expanded)
  let fullLanguageName = originalLanguage;
  try {
    const languageNames = new Intl.DisplayNames(['pt-BR'], { type: 'language' });
    fullLanguageName = languageNames.of(originalLanguage) || originalLanguage;
    // Capitalize first letter
    fullLanguageName = fullLanguageName.charAt(0).toUpperCase() + fullLanguageName.slice(1);
  } catch (e) {
    // Fallback if code is invalid
  }

  // Translate status to Portuguese
  const statusTranslations: Record<string, string> = {
    "Rumored": "Rumor",
    "Planned": "Planejado",
    "In Production": "Em Produção",
    "Post Production": "Pós-Produção",
    "Released": "Lançado",
    "Canceled": "Cancelado"
  };
  const translatedStatus = statusTranslations[status] || status;

  return (
    <aside className="bg-card text-card-foreground p-6 rounded-xl border border-border space-y-6">
      <h3 className="font-semibold text-lg border-b border-border pb-2">Detalhes Técnicos</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Título Original</h4>
          <p className="text-sm">{originalTitle}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Idioma Original</h4>
          <p className="text-sm">{fullLanguageName}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
          <p className="text-sm">{translatedStatus}</p>
        </div>

        {productionCompanies && productionCompanies.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Empresas de Produção</h4>
            <div className="flex flex-col gap-4">
              {productionCompanies.map((company) => (
                <div key={company.id} className="flex items-center gap-3">
                  {company.logo_path ? (
                    <div className="bg-white/90 p-1 rounded-md flex-shrink-0 flex items-center justify-center w-12 h-12 overflow-hidden">
                      <Image
                        src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                        alt={company.name}
                        width={40}
                        height={40}
                        className="object-contain max-h-full max-w-full"
                        style={{ width: "auto", height: "auto" }}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="bg-muted p-1 rounded-md flex-shrink-0 flex items-center justify-center w-12 h-12">
                      <span className="text-[10px] text-muted-foreground text-center line-clamp-2 px-1">{company.name}</span>
                    </div>
                  )}
                  <span className="text-sm font-medium leading-tight">{company.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
