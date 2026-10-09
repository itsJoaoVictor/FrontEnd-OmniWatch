'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Users, 
  ListPlus, 
  Calendar, 
  BarChart2, 
  User as UserIcon, 
  LogOut, 
  X, 
  Menu,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/useUserStore';
import { useFriendsStore } from '@/store/useFriendsStore';
import { api } from '@/lib/axios';

interface MobileDrawerMenuProps {
  onLogout?: () => void;
  trigger?: (open: () => void) => React.ReactNode;
}

export function MobileDrawerMenu({ onLogout, trigger }: MobileDrawerMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, clearUser } = useUserStore();
  const { pendingCount } = useFriendsStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fecha o menu quando a rota muda
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Bloqueia rolagem do body quando aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fecha com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLogoutAction = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout', error);
    } finally {
      clearUser();
      document.cookie = 'is_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/');
    }
  };

  const primaryItems = [
    {
      href: '/friends',
      label: 'Amigos',
      icon: Users,
      badge: pendingCount > 0 ? pendingCount : undefined,
      color: 'text-sky-500 bg-sky-500/10 dark:bg-sky-500/20',
    },
    {
      href: '/lists',
      label: 'Listas',
      icon: ListPlus,
      color: 'text-purple-500 bg-purple-500/10 dark:bg-purple-500/20',
    },
    {
      href: '/calendar',
      label: 'Calendário',
      icon: Calendar,
      color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20',
    },
    {
      href: '/stats',
      label: 'Estatísticas',
      icon: BarChart2,
      color: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20',
    },
  ];

  // Conteúdo do Bottom Sheet
  const sheetContent = (
    <div className={`fixed inset-0 z-[99999] lg:hidden transition-all duration-300 ${isOpen ? 'visible' : 'invisible pointer-events-none'}`}>
      {/* Backdrop 100% opaco e escurecido */}
      <div 
        className={`fixed inset-0 bg-black/75 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Painel Bottom Sheet que sobe de baixo */}
      <div
        className={`fixed inset-x-0 bottom-0 max-w-lg mx-auto bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border-t border-zinc-200 dark:border-zinc-800 rounded-t-3xl shadow-2xl p-4 sm:p-5 transition-transform duration-300 ease-out flex flex-col gap-3 pb-8 sm:pb-6 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ opacity: 1 }}
      >
        {/* Barra puxadora no topo */}
        <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto -mt-1 mb-1" />

        {/* Cabeçalho: Usuário e Botão Fechar */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 min-w-0 group"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0 ring-2 ring-primary/30">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm truncate block text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors">
                {user?.name || 'Meu Perfil'}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate block">
                {user?.username ? `@${user.username}` : user?.email || ''}
              </span>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 shrink-0"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Grade de 4 opções principais (2x2) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {primaryItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 select-none ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-tight truncate">
                    {item.label}
                  </span>
                  {!!item.badge && item.badge > 0 && (
                    <span className="min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center animate-pulse shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* 5º Item: Meu Perfil (largura completa) */}
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className={`col-span-2 relative flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 select-none ${
              pathname === '/profile'
                ? 'border-primary bg-primary/10 text-primary font-bold'
                : 'border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-blue-500 bg-blue-500/10 dark:bg-blue-500/20">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold tracking-tight block">
                  Configurações do Perfil
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block truncate">
                  Gerenciar username, senha e conta
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
          </Link>
        </div>

        {/* Rodapé: Botão Sair (sempre visível) */}
        <div className="pt-1">
          <Button
            variant="destructive"
            className="w-full justify-center gap-2 h-10 font-semibold text-xs rounded-xl shadow-sm"
            onClick={() => {
              setIsOpen(false);
              handleLogoutAction();
            }}
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Botão de acionamento */}
      {trigger ? (
        trigger(() => setIsOpen(true))
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative rounded-full hover:bg-foreground/10 text-foreground"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5" />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      )}

      {/* Renderiza o Bottom Sheet via Portal no body */}
      {mounted && typeof document !== 'undefined' ? createPortal(sheetContent, document.body) : null}
    </>
  );
}
