import Link from "next/link";
import { Film, Tv, User } from "lucide-react";
import { SearchItem } from "@/types/search";

interface SearchResultItemProps {
  item: SearchItem;
  onClick?: () => void;
}

export function SearchResultItem({ item, onClick }: SearchResultItemProps) {
  const getBadgeIcon = () => {
    switch (item.media_type) {
      case "movie":
        return <Film className="w-3 h-3 mr-1" />;
      case "tv":
        return <Tv className="w-3 h-3 mr-1" />;
      case "person":
        return <User className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const getBadgeLabel = () => {
    switch (item.media_type) {
      case "movie":
        return "Filme";
      case "tv":
        return "Série";
      case "person":
        return "Pessoa";
      default:
        return "Desconhecido";
    }
  };

  const href = `/${item.media_type}/${item.id}`;
  
  // Use a fallback image if image_path is not available
  const imageUrl = item.image_path 
    ? `https://image.tmdb.org/t/p/w92${item.image_path}` 
    : "/placeholder.png";

  const year = item.date ? new Date(item.date).getFullYear() : null;

  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="flex items-center gap-3 p-2 hover:bg-muted/50 transition-colors rounded-md group"
    >
      <div className="flex-shrink-0 w-10 h-14 bg-muted rounded overflow-hidden relative">
        {item.image_path ? (
          <img 
            src={imageUrl} 
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            {getBadgeIcon()}
          </div>
        )}
      </div>
      
      <div className="flex flex-col overflow-hidden">
        <h4 className="text-sm font-medium truncate text-foreground transition-colors">
          {item.title}
        </h4>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="flex items-center bg-foreground/10 px-1.5 py-0.5 rounded mr-2">
            {getBadgeIcon()}
            {getBadgeLabel()}
          </span>
          {year && <span>{year}</span>}
        </div>
      </div>
    </Link>
  );
}
