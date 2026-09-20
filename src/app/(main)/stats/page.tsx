import { StatsDashboard } from '@/components/Stats/StatsDashboard';

export default function Page() {
  return (
    <div className="p-8 mt-16 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Estatísticas</h1>
      <StatsDashboard />
    </div>
  );
}
