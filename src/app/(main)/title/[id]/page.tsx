import { Button } from "@/components/ui/button";

export default async function TitleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="p-8 mt-16 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold">Detalhes da Obra (ID: {id})</h1>
      <p className="text-muted-foreground mt-2">Visão Geral, Episódios e Elenco em breve.</p>
      
      <div className="mt-8 flex gap-4">
        <Button>Adicionar à lista</Button>
        <Button variant="secondary">Marcar Visto</Button>
      </div>
    </div>
  );
}
