"use client";

import React, { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, UserPlus, Trash2, CheckCheck } from 'lucide-react';
import { api } from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useFriendsStore } from '@/store/useFriendsStore';
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
  const router = useRouter();
  const { fetchPendingCount } = useFriendsStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/api/notifications/');
        setNotifications(res.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
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

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      await api.post('/api/notifications/read-all');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await api.delete(`/api/notifications/${id}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    const previous = [...notifications];
    try {
      setNotifications([]);
      await api.delete('/api/notifications/clear-all');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      setNotifications(previous);
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setOpen(false);

    const isRecommendation =
      notification.title.toLowerCase().includes('indica') ||
      notification.title.toLowerCase().includes('recomenda');
    const isFriendRequest =
      !isRecommendation &&
      (notification.title.toLowerCase().includes('amizade') ||
        notification.title.toLowerCase().includes('amigo'));

    if (isRecommendation) {
      router.push('/my-list?tab=recommendations');
    } else if (isFriendRequest) {
      fetchPendingCount();
      router.push('/friends');
    } else if (notification.media_id) {
      router.push(`/media/${notification.media_id}`);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="relative p-2 text-zinc-300 hover:text-white hover:bg-foreground/10 rounded-full transition-colors flex items-center justify-center">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600"></span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-88 bg-zinc-900 border-zinc-800 p-0 text-white shadow-2xl">
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Notificações</span>
            {unreadCount > 0 && (
              <span className="bg-red-500/20 text-red-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-red-500/30">
                {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
              </span>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-800"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Lidas</span>
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearAllNotifications();
                }}
                className="text-xs text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-800"
                title="Limpar todas as notificações"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            </div>
          )}
        </div>

        <div className="max-h-[360px] overflow-y-auto divide-y divide-zinc-800/40">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">
              Sem notificações no momento.
            </div>
          ) : (
            notifications.map(notification => {
              const isFriendRequest = notification.title.toLowerCase().includes('amizade') || notification.title.toLowerCase().includes('amigo');
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group relative flex items-start justify-between p-3 cursor-pointer transition-colors hover:bg-zinc-800/60 ${
                    notification.is_read ? 'opacity-65' : 'bg-zinc-800/30 font-medium'
                  }`}
                >
                  <div className="flex-1 pr-2 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {!notification.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      )}
                      <span className="font-semibold text-sm truncate flex items-center gap-1.5 text-zinc-100">
                        {isFriendRequest && <UserPlus className="w-3.5 h-3.5 text-primary shrink-0" />}
                        {notification.title}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-700/50 rounded transition-colors"
                      title="Excluir notificação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
