
'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Film, Tv } from 'lucide-react';

interface StatData {
  totalTime: number;
  totalTimeMovies: number;
  totalTimeTv: number;
  totalMovies: number;
  totalEpisodes: number;
  ratingDistribution: { rating: string, count: number }[];
  topGenres: { name: string, count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#8dd1e1'];

export function StatsDashboard() {
  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await api.get('/api/statistics');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className='flex justify-center items-center h-64'>Carregando estatísticas...</div>;
  if (!data) return <div className='flex justify-center items-center h-64'>Nenhuma estatística disponível.</div>;

  const formatTime = (minutes: number) => {
    const totalHours = Math.floor(minutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const mins = minutes % 60;
    
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Tempo Assistido</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatTime(data.totalTime)}
            </div>
            <div className='text-xs text-muted-foreground mt-1 flex flex-col space-y-1'>
              <span>Filmes: {formatTime(data.totalTimeMovies || 0)}</span>
              <span>Séries: {formatTime(data.totalTimeTv || 0)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Filmes Assistidos</CardTitle>
            <Film className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{data.totalMovies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Episódios Assistidos</CardTitle>
            <Tv className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{data.totalEpisodes}</div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Notas</CardTitle>
          </CardHeader>
          <CardContent className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={data.ratingDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#333' />
                <XAxis dataKey='rating' stroke='#888' />
                <YAxis allowDecimals={false} stroke='#888' />
                <Tooltip cursor={{fill: '#222'}} contentStyle={{backgroundColor: '#111', borderColor: '#333'}} />
                <Bar dataKey='count' fill='#3b82f6' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gêneros Mais Assistidos</CardTitle>
          </CardHeader>
          <CardContent className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={data.topGenres}
                  dataKey='count'
                  nameKey='name'
                  cx='50%'
                  cy='50%'
                  outerRadius={100}
                  fill='#8884d8'
                  label={({ name, percent }) => (percent ?? 0) > 0.05 ? name : ''}
                >
                  {data.topGenres.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333'}} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

