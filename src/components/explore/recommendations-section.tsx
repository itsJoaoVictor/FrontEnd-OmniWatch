import { RecommendationItem } from "@/types/recommendation";
import { RecommendationsCarousel } from "./recommendations-carousel";
import { cookies } from "next/headers";

async function getRecommendationsData(): Promise<RecommendationItem[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return [];

  const res = await fetch(`${apiUrl}/api/recommendations/explore`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    // We shouldn't cache this as aggressively as trending because it's personalized
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) return []; // Ignore auth errors, just return empty
    throw new Error("Failed to fetch recommendations");
  }

  return res.json();
}

export async function RecommendationsSection() {
  try {
    const items = await getRecommendationsData();
    
    // Cold start or no items
    if (!items || items.length === 0) {
      return null;
    }
    
    const movies = items.filter(item => item.media_type === "movie");
    const series = items.filter(item => item.media_type === "tv");

    if (movies.length === 0 && series.length === 0) return null;

    return (
      <div className="flex flex-col gap-12 mb-12">
        {movies.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              ✨ Filmes Recomendados
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Filmes escolhidos a dedo com base no seu perfil de compatibilidade.
            </p>
            <RecommendationsCarousel items={movies} />
          </section>
        )}

        {series.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              ✨ Séries Recomendadas
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Séries escolhidas a dedo com base no seu perfil de compatibilidade.
            </p>
            <RecommendationsCarousel items={series} />
          </section>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error loading recommendations section:", error);
    return null;
  }
}
