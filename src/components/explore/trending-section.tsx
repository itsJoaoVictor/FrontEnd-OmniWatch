import { TrendingResponse } from "@/types/trending";
import { TrendingBillboard } from "./trending-billboard";

async function getTrendingData(): Promise<TrendingResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  // Sem Data Cache local no Next.js: o backend já gerencia trending_cache
  const res = await fetch(`${apiUrl}/api/trending`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch trending data");
  }

  return res.json();
}

export async function TrendingSection() {
  try {
    const data = await getTrendingData();

    if (!data || !data.results || data.results.length === 0) {
      return (
        <div className="text-muted-foreground py-8 text-center">
          Nenhuma tendência encontrada no momento.
        </div>
      );
    }

    return <TrendingBillboard items={data.results} />;
  } catch (error) {
    console.error("Error loading trending section:", error);
    return (
      <div className="text-destructive py-8 text-center text-sm">
        Erro ao carregar as tendências do momento.
      </div>
    );
  }
}
