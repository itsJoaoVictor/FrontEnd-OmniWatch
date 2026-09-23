"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, User, LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchInput } from "./SearchInput";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { useMyListStore } from "@/store/useMyListStore";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const router = useRouter();
  const { fetchMyList } = useMyListStore();

  useEffect(() => {
    fetchMyList();
  }, [fetchMyList]);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
      router.push('/');
    } catch (error) {
      console.error("Erro ao fazer logout", error);
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
            <Link href="/calendar" className="text-foreground/80 hover:text-primary transition-colors">Calendário</Link>
            <Link href="/stats" className="text-foreground/80 hover:text-primary transition-colors">Estatísticas</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 lg:gap-4 text-foreground">
          {/* Mobile Hamburger Menu */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="w-full cursor-pointer">Início</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/explore" className="w-full cursor-pointer">Explorar</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-list" className="w-full cursor-pointer">Minha Lista</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/calendar" className="w-full cursor-pointer">Calendário</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/stats" className="w-full cursor-pointer">Estatísticas</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="w-full cursor-pointer">Perfil</Link>
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
            <Link href="/profile" className="p-2 hover:bg-foreground/10 rounded-full transition-colors">
              <User className="w-5 h-5" />
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
