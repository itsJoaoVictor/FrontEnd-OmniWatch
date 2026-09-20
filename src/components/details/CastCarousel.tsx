import Image from "next/image";
import Link from "next/link";
import { CastItem } from "@/types/details";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

interface CastCarouselProps {
  cast: CastItem[];
}

export function CastCarousel({ cast }: CastCarouselProps) {
  if (!cast || cast.length === 0) return null;
  const imageUrl = "https://image.tmdb.org/t/p/w185";

  return (
    <div className="my-8">
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold">Elenco Principal</h3>
          <div className="flex items-center gap-2">
            <CarouselPrevious className="relative inset-auto translate-y-0 translate-x-0 h-8 w-8 bg-background hover:bg-accent border" />
            <CarouselNext className="relative inset-auto translate-y-0 translate-x-0 h-8 w-8 bg-background hover:bg-accent border" />
          </div>
        </div>
        <CarouselContent className="-ml-2 md:-ml-4">
          {cast.map((actor) => (
            <CarouselItem key={actor.id} className="pl-2 md:pl-4 basis-[140px] md:basis-[180px]">
              <Link href={`/person/${actor.id}`}>
                <Card className="border-0 bg-transparent shadow-none hover:opacity-80 transition-opacity cursor-pointer">
                  <CardContent className="p-0">
                    <div className="w-full aspect-[2/3] relative rounded-md overflow-hidden bg-muted mb-2">
                      {actor.profile_path ? (
                        <Image
                          src={`${imageUrl}${actor.profile_path}`}
                          alt={actor.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          Sem Foto
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-sm truncate">{actor.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{actor.character}</p>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
