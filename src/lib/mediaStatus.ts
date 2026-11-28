import type { ComponentType } from 'react';
import { Bookmark, Play, Check, XCircle, Clock } from 'lucide-react';
import type { ListStatus } from '@/store/useMyListStore';

export interface MediaStatusConfig {
  /** Rótulo principal no singular (ex: dropdowns, badges, toasts) */
  label: string;
  /** Rótulo curto para pills compactas e abas */
  shortLabel: string;
  /** Rótulo no plural para abas e filtros de coleção */
  pluralLabel: string;
  /** Ícone padrão do status */
  icon: ComponentType<{ className?: string }>;
  /** Cor de texto principal */
  textClass: string;
  /** Borda com hover (ex: AddToListButton) */
  borderClass: string;
  /** Cor do indicador circular (dot) */
  dotClass: string;
  /** Estilo de badge flutuante sobre pôster escuro (ex: StatusBadge, MediaCard) */
  badgeClass: string;
  /** Estilo de pill suave para cards e listas (ex: LibraryCard, Coleções, Universos) */
  pillClass: string;
  /** Estilo de botão de filtro ativo (ex: AddFromMyListModal) */
  activeFilterClass: string;
}

/**
 * Fonte única de verdade para nomenclatura, ícones e paleta semântica dos status de mídia.
 *
 * Paleta escolhida para evitar conflitos visuais:
 * - plan_to_watch (Quero Ver): Índigo
 * - watching (Assistindo): Laranja (máximo contraste contra Verde/Índigo e distinto do amarelo das estrelas)
 * - completed (Concluído): Verde Esmeralda
 * - dropped (Abandonado): Vermelho/Rosa
 * - upcoming (Aguardando Estreia): Roxo
 */
export const MEDIA_STATUS_CONFIG: Record<ListStatus, MediaStatusConfig> = {
  plan_to_watch: {
    label: 'Quero Ver',
    shortLabel: 'Quero Ver',
    pluralLabel: 'Quero Ver',
    icon: Bookmark,
    textClass: 'text-indigo-400',
    borderClass: 'border-indigo-500/50 hover:border-indigo-400',
    dotClass: 'bg-indigo-400',
    badgeClass: 'text-indigo-400 border-indigo-500/30',
    pillClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
    activeFilterClass: 'bg-indigo-500 text-white font-semibold',
  },
  watching: {
    label: 'Assistindo',
    shortLabel: 'Assistindo',
    pluralLabel: 'Assistindo',
    icon: Play,
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/50 hover:border-orange-400',
    dotClass: 'bg-orange-400',
    badgeClass: 'text-orange-400 border-orange-500/30',
    pillClass: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    activeFilterClass: 'bg-orange-500 text-black font-semibold',
  },
  completed: {
    label: 'Concluído',
    shortLabel: 'Concluído',
    pluralLabel: 'Concluídos',
    icon: Check,
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/50 hover:border-emerald-400',
    dotClass: 'bg-emerald-400',
    badgeClass: 'text-emerald-400 border-emerald-500/30',
    pillClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    activeFilterClass: 'bg-emerald-500 text-black font-semibold',
  },
  dropped: {
    label: 'Abandonado',
    shortLabel: 'Abandonado',
    pluralLabel: 'Abandonados',
    icon: XCircle,
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/50 hover:border-rose-400',
    dotClass: 'bg-rose-400',
    badgeClass: 'text-rose-400 border-rose-500/30',
    pillClass: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    activeFilterClass: 'bg-rose-500 text-white font-semibold',
  },
  upcoming: {
    label: 'Aguardando Estreia',
    shortLabel: 'Aguardando',
    pluralLabel: 'Aguardando',
    icon: Clock,
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/50 hover:border-purple-400',
    dotClass: 'bg-purple-400',
    badgeClass: 'text-purple-400 border-purple-500/30',
    pillClass: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    activeFilterClass: 'bg-purple-500 text-white font-semibold',
  },
};

/**
 * Normaliza status vindos de endpoints legados (ex: 'watched' -> 'completed')
 * e retorna a configuração visual correspondente, ou null se não estiver na lista.
 */
export function getMediaStatusConfig(status?: string | null): MediaStatusConfig | null {
  if (!status) return null;
  if (status === 'watched') return MEDIA_STATUS_CONFIG.completed;
  if (status in MEDIA_STATUS_CONFIG) {
    return MEDIA_STATUS_CONFIG[status as ListStatus];
  }
  return null;
}
