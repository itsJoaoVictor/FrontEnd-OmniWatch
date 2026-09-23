import { PersonaCarousel } from "@/types/recommendation";
import { RecommendationsCarousel } from "./recommendations-carousel";
import { cookies } from "next/headers";
import { Sparkles } from "lucide-react";

async function getPersonasData(): Promise<PersonaCarousel[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return [];

  const res = await fetch(`${apiUrl}/api/recommendations/personas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) return [];
    throw new Error("Failed to fetch personas recommendations");
  }

  return res.json();
}

export async function PersonasSection() {
  try {
    const personas = await getPersonasData();

    if (!personas || personas.length === 0) {
      return null;
    }

    // Filtrar personas que possuem recomendações válidas
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
  } catch (error) {
    console.error("Error loading personas recommendations section:", error);
    return null;
  }
}
