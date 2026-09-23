"use client";

import { useEffect, useState } from "react";
import { PersonaCarousel } from "@/types/recommendation";
import { RecommendationsCarousel } from "./recommendations-carousel";
import { api } from "@/lib/axios";
import { Sparkles } from "lucide-react";
import { TrendingSkeleton } from "./trending-skeleton";

export function PersonasSection() {
  const [personas, setPersonas] = useState<PersonaCarousel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/api/recommendations/personas");
        setPersonas(res.data);
      } catch (error) {
        console.error("Error loading personas recommendations section:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <TrendingSkeleton />;
  }

  if (!personas || personas.length === 0) {
    return null;
  }

  const validPersonas = personas.filter(
    (p) => p.recommendations && p.recommendations.length > 0
  );

  if (validPersonas.length === 0) {
    return null;
  }

  return (
    <div className="space-y-12">
      {validPersonas.map((persona) => (
        <section key={persona.id} className="relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-2">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>{persona.emoji}</span>
                <span>{persona.name}</span>
              </h2>
              {persona.tagline && (
                <p className="text-sm font-medium text-primary/90 mt-0.5 italic">
                  "{persona.tagline}"
                </p>
              )}
              <p className="text-muted-foreground text-sm mt-1">
                Recomendações afinadas para a sua faceta de{" "}
                <span className="text-foreground font-medium">
                  {persona.top_genres.join(", ")}
                </span>{" "}
                • com base em {persona.item_count} obras assistidas
              </p>
            </div>

            {persona.sample_titles && persona.sample_titles.length > 0 && (
              <div className="text-xs text-muted-foreground/80 flex items-center gap-1.5 flex-wrap">
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Você curtiu:</span>
                <span className="italic text-foreground/90">
                  {persona.sample_titles.slice(0, 3).join(", ")}
                </span>
              </div>
            )}
          </div>

          <RecommendationsCarousel items={persona.recommendations} />
        </section>
      ))}
    </div>
  );
}
