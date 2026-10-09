"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, User, LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchInput } from "./SearchInput";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/useUserStore";

export function Topbar() {
  const router = useRouter();
  const { user, clearUser } = useUserStore();

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
            <Link href="/calendar" className="text-foreground/80 hover:text-primary transition-colors">Calendário</Link>
            <Link href="/stats" className="text-foreground/80 hover:text-primary transition-colors">Estatísticas</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 lg:gap-4 text-foreground">
          {/* Mobile Hamburger Menu */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9" />}>
                <Menu className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem render={<Link href="/dashboard" className="w-full cursor-pointer" />}>
                  Início
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/explore" className="w-full cursor-pointer" />}>
                  Explorar
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/my-list" className="w-full cursor-pointer" />}>
                  Minha Lista
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/lists" className="w-full cursor-pointer" />}>
                  Listas
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/calendar" className="w-full cursor-pointer" />}>
                  Calendário
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/stats" className="w-full cursor-pointer" />}>
                  Estatísticas
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/profile" className="w-full cursor-pointer flex justify-between items-center" />}>
                  <span>Perfil</span>
                  {user?.name && <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user.name}</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 cursor-pointer">
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
