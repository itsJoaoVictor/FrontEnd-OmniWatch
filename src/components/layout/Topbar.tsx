"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, User, LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchInput } from "./SearchInput";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/useUserStore";
import { useFriendsStore } from "@/store/useFriendsStore";

export function Topbar() {
  const router = useRouter();
  const { user, clearUser } = useUserStore();
  const { pendingCount, fetchPendingCount } = useFriendsStore();

  useEffect(() => {
    fetchPendingCount();
    // Atualiza periodicamente a cada 45 segundos
    const interval = setInterval(() => {
      fetchPendingCount();
    }, 45000);
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error("Erro ao fazer logout", error);
    } finally {
      clearUser();
      document.cookie = "is_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push('/');
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md shadow-sm border-b border-border/40 text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            OmniWatch
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <Link href="/dashboard" className="text-foreground/80 hover:text-primary transition-colors">Início</Link>
            <Link href="/explore" className="text-foreground/80 hover:text-primary transition-colors">Explorar</Link>
            <Link href="/my-list" className="text-foreground/80 hover:text-primary transition-colors">Minha Lista</Link>
            <Link href="/lists" className="text-foreground/80 hover:text-primary transition-colors">Listas</Link>
            <Link href="/friends" className="text-foreground/80 hover:text-primary transition-colors flex items-center gap-1.5">
              <span>Amigos</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground shadow-sm animate-pulse">
                  {pendingCount}
                </span>
              )}
            </Link>
            <Link href="/feed" className="text-foreground/80 hover:text-primary transition-colors">Feed</Link>
            <Link href="/calendar" className="text-foreground/80 hover:text-primary transition-colors">Calendário</Link>
            <Link href="/stats" className="text-foreground/80 hover:text-primary transition-colors">Estatísticas</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 lg:gap-4 text-foreground">
          <SearchInput />
          <NotificationBell />
          <div className="hidden lg:flex items-center gap-2">
            <Link 
              href="/profile" 
              className="flex items-center gap-2 py-1.5 px-2.5 hover:bg-foreground/10 rounded-full transition-colors text-xs font-medium"
              title={user?.name || "Perfil"}
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              {user?.name && (
                <span className="hidden xl:inline text-muted-foreground hover:text-foreground">
                  {user.name}
                </span>
              )}
            </Link>
            <button onClick={handleLogout} className="p-2 hover:bg-foreground/10 text-red-500 rounded-full transition-colors" title="Sair">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="ml-0 lg:ml-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
