"use client";

import React, { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { api } from '@/lib/axios';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  media_id?: string;
  created_at: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/api/notifications');
        setNotifications(res.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
    // In a real app, you might use SSE or WebSockets for real-time updates
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative p-2 text-zinc-300 hover:text-white hover:bg-foreground/10 rounded-full transition-colors flex items-center justify-center">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600"></span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-zinc-900 border-zinc-800 p-0 text-white">
        <div className="p-3 border-b border-zinc-800 font-bold text-sm">Notificações</div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-zinc-500">Sem notificações no momento.</div>
          ) : (
            notifications.map(notification => (
              <DropdownMenuItem 
                key={notification.id} 
                className={`flex flex-col items-start p-3 cursor-pointer ${notification.is_read ? 'opacity-60' : 'bg-zinc-800/50'}`}
                onClick={() => {
                  if (!notification.is_read) markAsRead(notification.id);
                  // Optional: navigate to media page if media_id exists
                }}
              >
                <div className="flex justify-between w-full mb-1">
                  <span className="font-bold text-sm">{notification.title}</span>
                  <span className="text-[10px] text-zinc-400">
                    {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <span className="text-xs text-zinc-300">{notification.message}</span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
