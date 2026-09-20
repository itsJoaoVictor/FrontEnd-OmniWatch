"use client";

import React, { useState, useEffect } from 'react';
import { CalendarGridView } from '@/components/calendar/CalendarGridView';
import { CalendarListView } from '@/components/calendar/CalendarListView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReleaseEvent } from '@/types/calendar';
import { api } from '@/lib/axios';

export default function CalendarPage() {
  const [releases, setReleases] = useState<ReleaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grid');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const fetchReleases = async () => {
      setLoading(true);
      try {
        // If in 'grid' view, we pass the month to filter. If in 'list' view, we pass nothing to get all future releases.
        const params = activeTab === 'grid' ? { month: currentMonth } : {};
        const res = await api.get('/api/calendar/my-releases', { params });
        setReleases(res.data);
      } catch (error) {
        console.error('Error fetching calendar releases:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReleases();
  }, [currentMonth, activeTab]);

  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Calendário de Lançamentos</h1>
        
        {activeTab === 'grid' && (
          <div className="flex items-center gap-4 text-white w-full md:w-auto">
            <input 
              type="month" 
              value={currentMonth} 
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="bg-zinc-800 border-zinc-700 rounded-md p-2 w-full md:w-auto"
            />
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-secondary/50">
          <TabsTrigger value="grid" className="px-6">Grade (Mensal)</TabsTrigger>
          <TabsTrigger value="list" className="px-6">Lista (Agenda)</TabsTrigger>
        </TabsList>
        <TabsContent value="grid">
          <CalendarGridView releases={releases} loading={loading} currentMonth={currentMonth} />
        </TabsContent>
        <TabsContent value="list">
          <CalendarListView releases={releases} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
