"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Bell, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Topbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-colors duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-md shadow-sm border-b border-border/40" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            OmniWatch
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <Link href="/dashboard" className={`hover:text-primary transition-colors ${isScrolled ? "text-foreground" : "text-white"}`}>Início</Link>
            <Link href="/explore" className={`hover:text-primary transition-colors ${isScrolled ? "text-foreground/80" : "text-white/80"}`}>Explorar</Link>
            <Link href="/my-list" className={`hover:text-primary transition-colors ${isScrolled ? "text-foreground/80" : "text-white/80"}`}>Minha Lista</Link>
            <Link href="/calendar" className={`hover:text-primary transition-colors ${isScrolled ? "text-foreground/80" : "text-white/80"}`}>Calendário</Link>
            <Link href="/stats" className={`hover:text-primary transition-colors ${isScrolled ? "text-foreground/80" : "text-white/80"}`}>Estatísticas</Link>
          </nav>
        </div>
        <div className={`flex items-center gap-4 ${isScrolled ? "text-foreground" : "text-white"}`}>
          <button className="p-2 hover:bg-foreground/10 rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-foreground/10 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <Link href="/profile" className="p-2 hover:bg-foreground/10 rounded-full transition-colors">
            <User className="w-5 h-5" />
          </Link>
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
