'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  shortcut?: string;
  size?: 'sm' | 'md' | 'lg';
  onClear?: () => void;
  resultCount?: number;
  totalCount?: number;
  showCount?: boolean;
}

export function FilterSearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  className,
  inputClassName,
  shortcut = '/',
  size = 'md',
  onClear,
  resultCount,
  totalCount,
  showCount = false,
}: FilterSearchInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  // Global shortcut to focus input on pressing shortcut key (e.g. '/')
  React.useEffect(() => {
    if (!shortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.key === shortcut && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === 'Escape' && isFocused) {
        if (value) {
          onChange('');
          onClear?.();
        } else {
          inputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut, isFocused, value, onChange, onClear]);

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <div
      className={cn(
        "group relative flex items-center transition-all duration-300",
        className
      )}
    >
      {/* Container com acabamento de vidro, borda suave e iluminação ao focar */}
      <div
        className={cn(
          "relative flex items-center w-full rounded-2xl transition-all duration-300",
          "bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl",
          "border border-border/70 dark:border-white/10 hover:border-border dark:hover:border-white/20",
          "shadow-sm shadow-black/5 dark:shadow-black/30",
          isFocused && [
            "border-primary/50 dark:border-primary/60",
            "ring-4 ring-primary/10",
            "bg-card/95 dark:bg-zinc-900/90",
            "shadow-lg shadow-primary/5 dark:shadow-primary/10",
          ],
          isSmall
            ? "h-9 px-3"
            : isLarge
            ? "h-12 px-4.5"
            : "h-10 sm:h-11 px-3.5"
        )}
      >
        {/* Ícone de Busca animado */}
        <div className="flex items-center justify-center shrink-0">
          <Search
            className={cn(
              "transition-all duration-200 shrink-0 select-none",
              isSmall ? "w-3.5 h-3.5 mr-2" : "w-4 h-4 mr-2.5",
              isFocused
                ? "text-primary scale-110"
                : "text-muted-foreground group-hover:text-foreground/80"
            )}
            aria-hidden="true"
          />
        </div>

        {/* Campo de Texto */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 font-normal transition-colors",
            isSmall ? "text-xs sm:text-sm" : "text-sm",
            inputClassName
          )}
        />

        {/* Área de Ações à direita */}
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {/* Badge de contador de resultados quando há busca */}
          {showCount && value.trim() && typeof resultCount === 'number' && (
            <span
              className={cn(
                "font-medium rounded-full transition-all duration-200 select-none animate-in fade-in zoom-in-95",
                isSmall
                  ? "text-[10px] px-1.5 py-0.2"
                  : "text-[11px] px-2 py-0.5",
                resultCount > 0
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "bg-muted text-muted-foreground border border-border/50"
              )}
            >
              {resultCount}
              {typeof totalCount === 'number' ? `/${totalCount}` : ''}
            </span>
          )}

          {/* Botão de limpar ou Atalho de teclado */}
          {value ? (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-muted active:scale-90",
                isSmall ? "p-0.5" : "p-1"
              )}
              title="Limpar pesquisa (Esc)"
              aria-label="Limpar pesquisa"
            >
              <X className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
            </button>
          ) : shortcut ? (
            <kbd
              className={cn(
                "hidden sm:inline-flex items-center justify-center font-mono font-medium select-none transition-opacity",
                "text-muted-foreground/70 bg-muted/60 dark:bg-zinc-800/60 border border-border/60 dark:border-white/10 rounded-md",
                isSmall
                  ? "min-w-[18px] h-4.5 px-1 text-[9px]"
                  : "min-w-[20px] h-5 px-1.5 text-[10px]"
              )}
              title={`Pressione '${shortcut}' para pesquisar`}
            >
              {shortcut}
            </kbd>
          ) : null}
        </div>
      </div>
    </div>
  );
}
