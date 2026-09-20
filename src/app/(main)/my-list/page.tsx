'use client';

import { useEffect, useState } from 'react';
import { useMyListStore, ListStatus, SavedItem } from '@/store/useMyListStore';
import { MediaCard } from '@/components/home/MediaCard';
import { AddToListButton } from '@/components/shared/AddToListButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function MyListPage() {
  const { items, isLoading } = useMyListStore();
  const [mediaTab, setMediaTab] = useState<'all' | 'movie' | 'tv'>('all');
  const [statusFilter, setStatusFilter] = useState<ListStatus | 'all'>('all');

  // Convert dictionary to array for mapping
  const itemsArray = Object.values(items);

  // Filter items
  const filteredItems = itemsArray.filter((item) => {
    // 1. Filter by media type
    if (mediaTab !== 'all' && item.media_type !== mediaTab) return false;
    
    // 2. Filter by status
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;

    return true;
  });

  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 max-w-[1600px] mx-auto pb-20">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">Minha Lista</h1>
      
      <Tabs defaultValue="all" onValueChange={(val) => setMediaTab(val as any)} className="w-full mb-8">
        <TabsList className="mb-6 bg-secondary/50">
          <TabsTrigger value="all" className="px-6">Todos</TabsTrigger>
          <TabsTrigger value="movie" className="px-6">Filmes</TabsTrigger>
          <TabsTrigger value="tv" className="px-6">Séries</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        <Button 
          variant={statusFilter === 'all' ? 'default' : 'outline'} 
          className="rounded-full"
          onClick={() => setStatusFilter('all')}
        >
          Todos os Status
        </Button>
        <Button 
          variant={statusFilter === 'plan_to_watch' ? 'default' : 'outline'} 
          className="rounded-full"
          onClick={() => setStatusFilter('plan_to_watch')}
        >
          Quero Ver
        </Button>
        <Button 
          variant={statusFilter === 'watching' ? 'default' : 'outline'} 
          className="rounded-full"
          onClick={() => setStatusFilter('watching')}
        >
          Assistindo
        </Button>
        <Button 
          variant={statusFilter === 'completed' ? 'default' : 'outline'} 
          className="rounded-full"
          onClick={() => setStatusFilter('completed')}
        >
          Concluídos
        </Button>
        <Button 
          variant={statusFilter === 'dropped' ? 'default' : 'outline'} 
          className="rounded-full"
          onClick={() => setStatusFilter('dropped')}
        >
          Abandonados
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-pulse">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted rounded-md" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-xl text-muted-foreground mb-4">Nenhum título encontrado com estes filtros.</p>
          <Button variant="outline" onClick={() => { setMediaTab('all'); setStatusFilter('all'); }}>
            Limpar Filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 gap-y-8">
          {filteredItems.map((item, index) => (
            <div key={item.id} className="relative group">
              <MediaCard
                item={{
                  id: item.tmdb_id.toString(),
                  title: item.title || 'Título Desconhecido',
                  type: item.media_type,
                  coverVertical: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '',
                }}
                layout="poster"
                priority={index < 10}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
