import { Loader2 } from "lucide-react";
import Link from "next/link";
import { SearchItem } from "@/types/search";
import { SearchResultItem } from "./SearchResultItem";
import { SearchEmptyState } from "./SearchEmptyState";

interface SearchDropdownProps {
  query: string;
  results: SearchItem[];
  isLoading: boolean;
  onClose: () => void;
}

export function SearchDropdown({ query, results, isLoading, onClose }: SearchDropdownProps) {
  if (!query) return null;

  return (
    <div className="absolute top-full mt-2 right-0 w-80 bg-background border border-border rounded-lg shadow-xl overflow-hidden flex flex-col z-50">
      <div className="max-h-96 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-6 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin opacity-50" />
          </div>
        ) : results.length > 0 ? (
          <div className="flex flex-col space-y-1">
            {results.slice(0, 6).map((item) => (
              <SearchResultItem key={`${item.media_type}-${item.id}`} item={item} onClick={onClose} />
            ))}
          </div>
        ) : (
          <SearchEmptyState query={query} />
        )}
      </div>
      
      {!isLoading && results.length > 0 && (
        <div className="p-2 border-t border-border bg-muted/20">
          <Link 
            href={`/search?q=${encodeURIComponent(query)}`}
            onClick={onClose}
            className="block w-full text-center text-sm font-medium text-primary hover:text-primary/80 py-2 rounded-md hover:bg-muted/50 transition-colors"
          >
            Ver todos os resultados
          </Link>
        </div>
      )}
    </div>
  );
}
