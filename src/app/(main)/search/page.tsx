"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/axios";
import { SearchMultiResponse, SearchItem } from "@/types/search";
import { MediaCard, MediaItem } from "@/components/home/MediaCard";
import { Loader2 } from "lucide-react";
function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [data, setData] = useState<SearchMultiResponse | null>(null);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // Reset when query changes
  useEffect(() => {
    setPage(1);
    setItems([]);
    setData(null);
  }, [query]);

  useEffect(() => {
    if (!query) {
      setData(null);
      setItems([]);
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      
      setError("");
      try {
        const response = await api.get<SearchMultiResponse>(`/api/search/multi?query=${encodeURIComponent(query)}&page=${page}`);
        setData(response.data);
        if (page === 1) {
          setItems(response.data.results);
        } else {
          setItems((prev) => [...prev, ...response.data.results]);
        }
      } catch (err) {
        console.error(err);
        setError("Ocorreu um erro ao buscar os resultados.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    };

    fetchResults();
  }, [query, page]);

  const handleLoadMore = () => {
    if (data && page < data.total_pages) {
      setPage((prev) => prev + 1);
    }
  };

  const mapToMediaItem = (item: SearchItem): MediaItem => ({
    id: String(item.id),
    title: item.title,
    type: item.media_type,
    coverVertical: item.image_path ? `https://image.tmdb.org/t/p/w342${item.image_path}` : undefined,
    release_date: item.date,
  });

  return (
    <main className="min-h-screen pt-24 pb-12 px-4 lg:px-8 container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {query ? `Resultados para "${query}"` : "Busca"}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-destructive">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Nenhum resultado encontrado.
        </div>
      ) : (
        <div className="flex flex-col space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {items.map((item, idx) => (
              <MediaCard 
                key={`${item.media_type}-${item.id}-${idx}`} 
                item={mapToMediaItem(item)} 
                layout="poster" 
                priority={idx < 10}
              />
            ))}
          </div>
          
          {data && page < data.total_pages && (
            <div className="flex justify-center mt-8">
              <button 
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-2 rounded-full bg-primary/20 hover:bg-primary/30 text-primary font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  "Carregar mais"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
