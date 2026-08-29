import { HeroBanner } from "@/components/home/HeroBanner";
import { ContentCarousel } from "@/components/home/ContentCarousel";
import fs from "fs/promises";
import path from "path";
import { MediaItem } from "@/components/home/MediaCard";

interface HomeData {
  heroFeature: Omit<MediaItem, "coverHorizontal"> & { coverHorizontal: string; description: string };
  continueWatching: MediaItem[];
  moviesInQueue: MediaItem[];
}

async function getHomeData(): Promise<HomeData> {
  const filePath = path.join(process.cwd(), "src/mocks/homeData.json");
  const jsonData = await fs.readFile(filePath, "utf-8");
  return JSON.parse(jsonData);
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <div className="pb-16 overflow-hidden">
      <HeroBanner data={data.heroFeature} />
      
      <div className="mt-4 md:mt-8 relative z-20 space-y-8 flex flex-col pb-8">
        <ContentCarousel 
          title="Continuar Assistindo" 
          items={data.continueWatching} 
          layout="tracking" 
        />
        
        <ContentCarousel 
          title="Filmes na Fila" 
          items={data.moviesInQueue} 
          layout="poster"
        />
      </div>
    </div>
  );
}
