import { Suspense } from "react";
import { TrendingSection } from "@/components/explore/trending-section";
import { TrendingSkeleton } from "@/components/explore/trending-skeleton";
import { RecommendationsSection } from "@/components/explore/recommendations-section";
import { UpcomingSection } from "@/components/explore/upcoming-section";
import { PersonasSection } from "@/components/explore/personas-section";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 md:space-y-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Explorar</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">Descubra novas obras, o que está em alta e suas recomendações personalizadas.</p>
      </div>

      <Suspense fallback={<TrendingSkeleton />}>
        <RecommendationsSection />
      </Suspense>

      <Suspense fallback={<TrendingSkeleton />}>
        <UpcomingSection />
      </Suspense>

      <Suspense fallback={<TrendingSkeleton />}>
        <PersonasSection />
      </Suspense>

      <section>
        <h2 className="text-2xl font-bold mb-6">Em Alta</h2>
        <Suspense fallback={<TrendingSkeleton />}>
          <TrendingSection />
        </Suspense>
      </section>
    </div>
  );
}
