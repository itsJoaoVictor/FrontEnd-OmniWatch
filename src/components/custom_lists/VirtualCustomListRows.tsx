'use client';

import { useRef } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { CustomListItem } from '@/types/customLists';
import { CustomListItemRow } from './CustomListItemRow';

interface VirtualCustomListRowsProps {
  items: CustomListItem[];
  isRanked: boolean;
  isOwner: boolean;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onEditNote?: (item: CustomListItem) => void;
  onRemove?: (item: CustomListItem) => void;
}

export function VirtualCustomListRows({
  items,
  isRanked,
  isOwner,
  onMoveUp,
  onMoveDown,
  onEditNote,
  onRemove,
}: VirtualCustomListRowsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => 72,
    overscan: 5,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  // Para listas pequenas (< 15 itens), renderizar diretamente sem overhead
  if (items.length <= 15) {
    return (
      <div className="space-y-2">
        {items.map((it, idx) => (
          <CustomListItemRow
            key={it.id}
            item={it}
            index={idx}
            totalItems={items.length}
            isRanked={isRanked}
            isOwner={isOwner}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onEditNote={onEditNote}
            onRemove={onRemove}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={listRef} className="w-full relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const item = items[virtualItem.index];
        return (
          <div
            key={item.id}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            className="absolute top-0 left-0 w-full pb-2"
            style={{
              transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
            }}
          >
            <CustomListItemRow
              item={item}
              index={virtualItem.index}
              totalItems={items.length}
              isRanked={isRanked}
              isOwner={isOwner}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onEditNote={onEditNote}
              onRemove={onRemove}
            />
          </div>
        );
      })}
    </div>
  );
}
