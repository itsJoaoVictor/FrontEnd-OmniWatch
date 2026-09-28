import { StatsDashboard } from '@/components/Stats/StatsDashboard';

export default function Page() {
  return (
    <div className="px-4 py-6 md:p-8 mt-14 md:mt-16 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6 tracking-tight text-white">Estatísticas</h1>
      <StatsDashboard />
    </div>
  );
}
