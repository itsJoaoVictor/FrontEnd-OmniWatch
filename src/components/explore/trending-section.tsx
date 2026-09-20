import { TrendingResponse } from "@/types/trending";
import { TrendingCarousel } from "./trending-carousel";

async function getTrendingData(): Promise<TrendingResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  // Usando revalidate para armazenar o dado em cache no Next.js (ISR)
  const res = await fetch(`${apiUrl}/api/trending`, {
    next: { revalidate: process.env.NODE_ENV === 'development' ? 0 : 3600 },
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
      return <div className="text-muted-foreground">Nenhuma tendência encontrada.</div>;
    }
    
    return <TrendingCarousel items={data.results} />;
  } catch (error) {
    console.error("Error loading trending section:", error);
    return <div className="text-destructive">Erro ao carregar as tendências do momento.</div>;
  }
}
