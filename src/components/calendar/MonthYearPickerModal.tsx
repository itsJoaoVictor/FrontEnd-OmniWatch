"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface MonthYearPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string; // "YYYY-MM"
  onSelectMonth: (monthStr: string) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MonthYearPickerModal({
  isOpen,
  onClose,
  currentMonth,
  onSelectMonth,
}: MonthYearPickerModalProps) {
  const [selectedYear, setSelectedYear] = useState(() => {
    return parseInt(currentMonth.split('-')[0], 10) || new Date().getFullYear();
  });

  const now = new Date();
  const currentRealYear = now.getFullYear();
  const currentRealMonth = now.getMonth(); // 0-indexed

  const [activeYearStr, activeMonthStr] = currentMonth.split('-');
  const activeYear = parseInt(activeYearStr, 10);
  const activeMonth = parseInt(activeMonthStr, 10) - 1;

  const handleSelect = (monthIndex: number) => {
    const formatted = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    onSelectMonth(formatted);
    onClose();
  };

  const handleJumpToToday = () => {
    const formatted = `${currentRealYear}-${String(currentRealMonth + 1).padStart(2, '0')}`;
    setSelectedYear(currentRealYear);
    onSelectMonth(formatted);
    onClose();
  };

  const quickYears = [currentRealYear - 1, currentRealYear, currentRealYear + 1, currentRealYear + 2];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-sm max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:border-t max-sm:border-x-0 max-sm:border-b-0 max-sm:p-5 max-sm:pb-8 shadow-2xl">
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

        <DialogHeader className="text-left mb-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-red-500" />
            <DialogTitle className="text-lg font-bold text-white">Escolher Mês e Ano</DialogTitle>
          </div>
        </DialogHeader>

        {/* Year Selector Control */}
        <div className="flex items-center justify-between bg-zinc-800/80 p-2 rounded-xl border border-zinc-700/60 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedYear(y => y - 1)}
            className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-lg"
            title="Ano anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-base font-bold text-white tracking-wider">
            {selectedYear}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedYear(y => y + 1)}
            className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-lg"
            title="Próximo ano"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Year Chips */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {quickYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedYear === year
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-750'
              }`}
            >
              {year}
            </button>
          ))}
        </div>

        {/* 12 Months Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {MONTH_NAMES.map((name, idx) => {
            const isSelected = selectedYear === activeYear && idx === activeMonth;
            const isCurrentMonthNow = selectedYear === currentRealYear && idx === currentRealMonth;

            return (
              <button
                key={name}
                onClick={() => handleSelect(idx)}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all border text-center ${
                  isSelected
                    ? 'bg-red-600 border-red-500 text-white font-bold shadow-md'
                    : isCurrentMonthNow
                    ? 'bg-zinc-800 border-red-500/50 text-red-400 hover:bg-zinc-750'
                    : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border-zinc-700/60'
                }`}
              >
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={handleJumpToToday}
            className="text-xs border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:text-white"
          >
            Ir para Mês Atual
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
