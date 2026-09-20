import Image from "next/image";
import { CheckCircle, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HeroFeatureProps {
  data: {
    id: string;
    title: string;
    type: string;
    coverHorizontal: string;
    description?: string;
    currentEpisode?: string | null;
  };
}

export function HeroBanner({ data }: HeroFeatureProps) {
  return (
    <div className="relative w-full h-[55vh] md:h-[65vh] flex items-end overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={data.coverHorizontal}
          alt={data.title}
          fill
          className="object-cover object-[center_15%]"
          priority
        />
        {/* Gradients to blend with dark mode */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 pb-12 md:pb-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4 backdrop-blur-md border border-primary/30">
            <Star className="w-3 h-3 fill-current" />
            Em Destaque
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 max-w-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">
            {data.title}
          </h1>
          {data.description && (
            <p className="text-base md:text-lg text-gray-200 mb-6 max-w-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-2">
              {data.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-4">
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-semibold px-6 shadow-lg shadow-primary/25">
              <CheckCircle className="w-5 h-5" />
              {data.currentEpisode ? `Marcar ${data.currentEpisode} como Visto` : 'Marcar como Visto'}
            </Button>
            <Link href={`/${data.type === 'movie' ? 'movie' : 'tv'}/${data.id}`}>
              <Button size="lg" variant="secondary" className="gap-2 bg-secondary/80 text-secondary-foreground hover:bg-secondary rounded-full font-semibold px-6 backdrop-blur-md border border-border">
                <Info className="w-5 h-5" />
                Detalhes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
