import Image from "next/image";
import Link from "next/link";
import { CollectionResponse } from "@/types/details";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { AddToListButton } from "@/components/shared/AddToListButton";

interface CollectionCarouselProps {
  collection: CollectionResponse;
}

export function CollectionCarousel({ collection }: CollectionCarouselProps) {
  if (!collection || !collection.parts || collection.parts.length === 0) return null;
  const imageUrl = "https://image.tmdb.org/t/p/w342";

  return (
    <div className="my-8">
      <h3 className="text-2xl font-semibold mb-4">Coleção: {collection.name}</h3>
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {collection.parts.map((item) => (
            <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-[140px] md:basis-[180px] lg:basis-[220px]">
              <Link href={`/movie/${item.id}`}>
                <Card className="border-0 bg-transparent shadow-none hover:opacity-80 transition-opacity">
                  <CardContent className="p-0">
                    <div className="w-full aspect-[2/3] relative rounded-md overflow-hidden bg-muted mb-2 group">
                      {item.poster_path ? (
                        <Image
                          src={`${imageUrl}${item.poster_path}`}
                          alt={item.title}
                          fill
                          priority={collection.parts.indexOf(item) < 4}
                          loading={collection.parts.indexOf(item) < 4 ? "eager" : "lazy"}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          Sem Poster
                        </div>
                      )}
                      {/* Botão de Adicionar à Lista */}
                      <div className="absolute top-2 right-2 z-10">
                        <AddToListButton tmdb_id={item.id} media_type="movie" className="w-8 h-8 [&>svg]:w-4 [&>svg]:h-4" />
                      </div>
                    </div>
                    <p className="font-bold text-sm truncate">{item.title}</p>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Star className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" />
                      {(item.vote_average / 2).toFixed(1)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4" />
        <CarouselNext className="hidden md:flex -right-4" />
      </Carousel>
    </div>
  );
}
