"use client";

import Image from "next/image";
import { Clapperboard, Share2 } from "lucide-react";
import { ProductionCompanyItem } from "@/types/details";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

interface TechnicalDetailsSidebarProps {
  originalTitle: string;
  originalLanguage: string;
  status: string;
  productionCompanies: ProductionCompanyItem[];
  budget?: number;
  revenue?: number;
}

export function TechnicalDetailsSidebar({
  originalTitle,
  originalLanguage,
  status,
  productionCompanies,
  budget,
  revenue,
}: TechnicalDetailsSidebarProps) {

  // Convert language codes to full names in pt-BR
  let fullLanguageName = originalLanguage;
  try {
    const languageNames = new Intl.DisplayNames(["pt-BR"], { type: "language" });
    fullLanguageName = languageNames.of(originalLanguage) || originalLanguage;
    fullLanguageName = fullLanguageName.charAt(0).toUpperCase() + fullLanguageName.slice(1);
  } catch {
    // Fallback se o código for inválido
  }

  // Tradução dos status mais comuns do TMDB
  const statusTranslations: Record<string, string> = {
    Rumored: "Rumor",
    Planned: "Planejado",
    "In Production": "Em Produção",
    "Post Production": "Pós-Produção",
    Released: "Lançado nos Cinemas",
    Canceled: "Cancelado",
    Ended: "Finalizada",
    Returning: "Em Exibição",
  };
  const translatedStatus = statusTranslations[status] || status;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href);
          toast.add({
            title: "Link copiado!",
            description: "O link deste título foi copiado para a área de transferência.",
            type: "success",
          });
        }
      } catch {
        toast.add({
          title: "Não foi possível copiar o link",
          type: "error",
        });
      }
    }
  };

  return (
    <aside className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-xs space-y-6">
      <h3 className="font-bold text-base border-b border-border pb-3 flex items-center justify-between text-foreground">
        <span>Ficha Técnica</span>
        <span className="text-xs text-muted-foreground font-normal">Detalhes da Produção</span>
      </h3>

      <div className="space-y-4 text-xs">
        <div>
          <h4 className="font-semibold text-muted-foreground mb-1">Título Original</h4>
          <p className="font-medium text-foreground text-sm">{originalTitle}</p>
        </div>

        <div>
          <h4 className="font-semibold text-muted-foreground mb-1">Idioma Original</h4>
          <p className="font-medium text-foreground text-sm">{fullLanguageName}</p>
        </div>

        <div>
          <h4 className="font-semibold text-muted-foreground mb-1">Status</h4>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20 text-xs">
            {translatedStatus}
          </span>
        </div>

        {/* Orçamento e Bilheteria quando disponíveis */}
        {(Boolean(budget && budget > 0) || Boolean(revenue && revenue > 0)) && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            {Boolean(budget && budget > 0) && (
              <div>
                <h4 className="font-semibold text-muted-foreground mb-0.5">Orçamento</h4>
                <p className="font-bold text-foreground text-sm">{formatCurrency(budget!)}</p>
              </div>
            )}
            {Boolean(revenue && revenue > 0) && (
              <div>
                <h4 className="font-semibold text-muted-foreground mb-0.5">Bilheteria</h4>
                <p className="font-bold text-emerald-500 text-sm">{formatCurrency(revenue!)}</p>
              </div>
            )}
          </div>
        )}

        {/* Empresas de Produção sem duplicidade de texto */}
        {productionCompanies && productionCompanies.length > 0 && (
          <div className="pt-3 border-t border-border">
            <h4 className="font-semibold text-muted-foreground mb-3">Empresas Produtoras</h4>
            <div className="space-y-2.5">
              {productionCompanies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center gap-3 p-2 rounded-xl bg-muted/40 border border-border/60"
                >
                  {company.logo_path ? (
                    <div className="bg-white p-1 rounded-lg flex-shrink-0 flex items-center justify-center w-9 h-9 overflow-hidden shadow-2xs">
                      <Image
                        src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                        alt={company.name}
                        width={36}
                        height={36}
                        className="object-contain max-h-full max-w-full"
                        style={{ width: "auto", height: "auto" }}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Clapperboard className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-xs font-semibold text-foreground line-clamp-1 leading-tight">
                    {company.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão de Compartilhar */}
        <div className="pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="w-full gap-2 rounded-xl text-xs font-semibold cursor-pointer border-border hover:bg-accent"
          >
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span>Compartilhar Filme</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
