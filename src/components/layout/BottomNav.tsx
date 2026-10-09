"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Bookmark, Rss, Menu } from "lucide-react";
import { useFriendsStore } from "@/store/useFriendsStore";
import { MobileDrawerMenu } from "./MobileDrawerMenu";

export function BottomNav() {
  const pathname = usePathname();
  const { pendingCount } = useFriendsStore();

  const primaryNavItems = [
    { href: "/dashboard", icon: Home, label: "Início" },
    { href: "/explore", icon: Compass, label: "Explorar" },
    { href: "/feed", icon: Rss, label: "Feed" },
    { href: "/my-list", icon: Bookmark, label: "Minha Lista" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/50 shadow-lg lg:hidden pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all duration-200 select-none ${
                isActive 
                  ? "text-primary font-bold" 
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110 fill-primary/15" : ""}`} />
              </div>
              <span className={`text-[11px] tracking-tight leading-none truncate max-w-[64px] ${isActive ? "text-primary" : ""}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}

        {/* 5º Botão: Menu Expandível no Bottom Bar */}
        <MobileDrawerMenu
          trigger={(open) => (
            <button
              onClick={open}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all duration-200 select-none text-muted-foreground hover:text-foreground font-medium"
              aria-label="Abrir menu de opções"
            >
              <div className="relative">
                <Menu className="w-5 h-5 transition-transform duration-200" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-extrabold flex items-center justify-center shadow-sm animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight leading-none truncate max-w-[64px]">
                Menu
              </span>
            </button>
          )}
        />
      </div>
    </nav>
  );
}
