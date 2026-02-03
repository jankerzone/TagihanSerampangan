import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { monthNames } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PeriodSelectorProps {
  currentYear: number;
  currentMonth: string;
  onYearChange: (year: number) => void;
  onMonthChange: (month: string) => void;
}

export const PeriodSelector = ({ 
  currentYear, 
  currentMonth, 
  onYearChange, 
  onMonthChange 
}: PeriodSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [tempYear, setTempYear] = useState(currentYear);

  const handleMonthSelect = (month: string) => {
    onMonthChange(month);
    onYearChange(tempYear);
    setOpen(false);
  };

  const handleYearIncrement = () => {
    setTempYear(tempYear + 1);
  };

  const handleYearDecrement = () => {
    setTempYear(tempYear - 1);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="h-9 justify-between gap-2 font-medium px-4 min-w-[180px] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
        >
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{currentMonth} {currentYear}</span>
          <ChevronRight className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {/* Year Selector */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 p-3 bg-gray-50/50 dark:bg-gray-900/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleYearDecrement}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold tabular-nums">{tempYear}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleYearIncrement}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Month Grid */}
        <div className="grid grid-cols-3 gap-2 p-3">
          {monthNames.map((month) => (
            <Button
              key={month}
              variant="ghost"
              size="sm"
              onClick={() => handleMonthSelect(month)}
              className={cn(
                "h-9 text-sm font-normal transition-all hover:bg-primary/10",
                currentMonth === month && tempYear === currentYear
                  ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm ring-1 ring-primary/20"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              {month.substring(0, 3)}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
