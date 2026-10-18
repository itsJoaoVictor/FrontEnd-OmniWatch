import { Suspense } from 'react';
import { StatsDashboard } from '@/components/Stats/StatsDashboard';

export default function Page() {
  return (
    <div className="px-4 py-6 md:p-8 mt-14 md:mt-16 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6 tracking-tight text-white">Estatísticas</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-zinc-900/50 rounded-2xl border border-zinc-800/80" />}>
        <StatsDashboard />
      </Suspense>
    </div>
  );
}
