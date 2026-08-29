import { Suspense } from "react";
import { TrendingSection } from "@/components/explore/trending-section";
import { TrendingSkeleton } from "@/components/explore/trending-skeleton";

export default function Page() {
  return (
    <div className="p-8 mt-16 max-w-7xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold">Explorar</h1>
        <p className="text-muted-foreground mt-2">Sistema de Compatibilidade (Match Score) em breve.</p>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-6">Em Alta</h2>
        <Suspense fallback={<TrendingSkeleton />}>
          <TrendingSection />
        </Suspense>
      </section>
    </div>
  );
}
