import Image from "next/image";
import Link from "next/link";
import { CrewItem } from "@/types/details";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

interface DirectorSectionProps {
  crew: CrewItem[];
  title?: string;
}

export function DirectorSection({ crew, title = "Direção" }: DirectorSectionProps) {
  if (!crew || crew.length === 0) return null;
  const imageUrl = "https://image.tmdb.org/t/p/w185";

  return (
    <div className="my-8">
      <h3 className="text-2xl font-semibold mb-4">{title}</h3>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {crew.map((director) => (
            <CarouselItem key={`${director.id}-${director.job}`} className="pl-2 md:pl-4 basis-[140px] md:basis-[180px]">
              <Link href={`/person/${director.id}`}>
                <Card className="border-0 bg-transparent shadow-none hover:opacity-80 transition-opacity cursor-pointer">
                  <CardContent className="p-0">
                    <div className="w-full aspect-[2/3] relative rounded-md overflow-hidden bg-muted mb-2">
                      {director.profile_path ? (
                        <Image
                          src={`${imageUrl}${director.profile_path}`}
                          alt={director.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          Sem Foto
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-sm truncate">{director.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{director.job}</p>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        {crew.length > 4 && (
          <>
            <CarouselPrevious className="flex absolute left-2 z-10 bg-black/60 text-white border-0 hover:bg-black/80 hover:text-white h-8 w-8 md:h-10 md:w-10" />
            <CarouselNext className="flex absolute right-2 z-10 bg-black/60 text-white border-0 hover:bg-black/80 hover:text-white h-8 w-8 md:h-10 md:w-10" />
          </>
        )}
      </Carousel>
    </div>
  );
}
