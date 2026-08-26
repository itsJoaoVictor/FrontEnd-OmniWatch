"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-10 w-10 bg-transparent" />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center h-10 w-10 rounded-full border shadow-sm bg-background/50 backdrop-blur-md hover:bg-accent transition-colors">
        <Palette className="h-[1.2rem] w-[1.2rem] text-foreground" />
        <span className="sr-only">Escolher Tema</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Aparência</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setTheme("light")} className="justify-between cursor-pointer">
            <span>Modo Claro</span>
            {theme === "light" && <span className="w-2 h-2 rounded-full bg-foreground" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")} className="justify-between cursor-pointer">
            <span>Modo Escuro</span>
            {(theme === "dark" || theme === "system") && <span className="w-2 h-2 rounded-full bg-foreground" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuLabel>Cores em Destaque</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setTheme("theme-netflix")} className="flex items-center gap-2 cursor-pointer">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span>Netflix (Vermelho)</span>
            {theme === "theme-netflix" && <span className="ml-auto w-2 h-2 rounded-full bg-foreground" />}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setTheme("theme-anime")} className="flex items-center gap-2 cursor-pointer">
            <div className="w-3 h-3 rounded-full bg-fuchsia-600" />
            <span>Anime (Roxo)</span>
            {theme === "theme-anime" && <span className="ml-auto w-2 h-2 rounded-full bg-foreground" />}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setTheme("theme-ocean")} className="flex items-center gap-2 cursor-pointer">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <span>Ocean (Azul)</span>
            {theme === "theme-ocean" && <span className="ml-auto w-2 h-2 rounded-full bg-foreground" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
