"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Bookmark, Calendar, BarChart2, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Início" },
    { href: "/explore", icon: Compass, label: "Explorar" },
    { href: "/my-list", icon: Bookmark, label: "Lista" },
    { href: "/calendar", icon: Calendar, label: "Calendário" },
    { href: "/stats", icon: BarChart2, label: "Estatísticas" },
    { href: "/profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-[9999] bg-background/90 backdrop-blur-md shadow-[0_-1px_3px_rgba(0,0,0,0.1)] border-t border-border/40 lg:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full py-1 space-y-1 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              } transition-colors`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "fill-primary/20" : ""}`} />
              <span className="text-[10px] leading-tight font-medium text-center truncate max-w-full px-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
