"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { SearchDropdown } from "@/components/search/SearchDropdown";
import { api } from "@/lib/axios";
import { SearchMultiResponse, SearchItem } from "@/types/search";

export function SearchInput() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const debouncedQuery = useDebounce(query, 500);

  // Lida com clique fora para fechar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Busca dados na API quando o debounceQuery muda
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await api.get<SearchMultiResponse>(`/api/search/multi?query=${encodeURIComponent(debouncedQuery)}`);
        setResults(response.data.results || []);
      } catch (error) {
        console.error("Erro ao buscar resultados:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsExpanded(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className="relative flex items-center h-10">
      <form 
        onSubmit={handleSubmit}
        className={`flex items-center transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded 
            ? "w-[45vw] sm:w-[50vw] md:w-64 bg-background/90 border border-border/50 rounded-md px-2 h-9" 
            : "w-9 h-9 bg-transparent border-transparent rounded-full hover:bg-foreground/10"
        }`}
      >
        <button 
          type="button"
          onClick={isExpanded ? handleSubmit : handleExpand}
          className={`flex items-center justify-center transition-colors ${
            isExpanded ? "p-1 text-muted-foreground hover:text-foreground" : "w-full h-full text-current"
          }`}
          aria-label="Buscar"
        >
          <Search className="w-5 h-5" />
        </button>
        
        <input
          ref={inputRef}
          type="text"
          placeholder="Títulos, pessoas, gêneros"
          className={`bg-transparent border-none outline-none text-sm h-full transition-all duration-300 ${
            isExpanded ? "opacity-100 w-full ml-1" : "opacity-0 w-0"
          }`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isExpanded) setIsExpanded(true);
          }}
          disabled={!isExpanded}
        />
        
        {isExpanded && query && (
          <button 
            type="button" 
            onClick={handleClear}
            className="p-1 ml-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {isExpanded && (query || isLoading) && (
        <SearchDropdown 
          query={debouncedQuery || query} 
          results={results} 
          isLoading={isLoading} 
          onClose={() => setIsExpanded(false)} 
        />
      )}
    </div>
  );
}
