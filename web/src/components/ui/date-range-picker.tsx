'use client';

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DatePickerWithRangeProps {
  selected?: { from: Date; to: Date };
  onSelect?: (range: { from: Date; to: Date } | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePickerWithRange({
  selected,
  onSelect,
  placeholder = "选择日期范围",
  className
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected?.from ? (
              selected.to ? (
                <>
                  {format(selected.from, "yyyy年MM月dd日", { locale: zhCN })} -{" "}
                  {format(selected.to, "yyyy年MM月dd日", { locale: zhCN })}
                </>
              ) : (
                format(selected.from, "yyyy年MM月dd日", { locale: zhCN })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selected?.from}
            selected={selected}
            onSelect={onSelect as any}
            numberOfMonths={2}
            locale={zhCN}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}