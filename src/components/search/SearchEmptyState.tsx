import { Search } from "lucide-react";

interface SearchEmptyStateProps {
  query: string;
}

export function SearchEmptyState({ query }: SearchEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
      <Search className="w-8 h-8 mb-2 opacity-20" />
      <p className="text-sm">
        Nenhum resultado encontrado para <span className="font-semibold text-foreground">"{query}"</span>.
      </p>
    </div>
  );
}
