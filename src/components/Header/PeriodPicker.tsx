import * as React from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PeriodPickerProps {
  currentMonth: string;
  currentYear: string;
  monthNames: string[];
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
}

export function PeriodPicker({
  currentMonth,
  currentYear,
  monthNames,
  onMonthChange,
  onYearChange,
}: PeriodPickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleYearPrev = () => {
    const newYear = (parseInt(currentYear) - 1).toString();
    onYearChange(newYear);
  };

  const handleYearNext = () => {
    const newYear = (parseInt(currentYear) + 1).toString();
    onYearChange(newYear);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[200px] justify-start text-left font-normal bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all",
            !currentMonth && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {currentMonth} {currentYear}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="flex items-center justify-between mb-4 px-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={handleYearPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-bold tracking-tight">
            {currentYear}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={handleYearNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {monthNames.map((month) => {
            const isSelected = month === currentMonth;
            return (
              <Button
                key={month}
                variant={isSelected ? "default" : "ghost"}
                className={cn(
                  "h-9 w-full text-xs transition-all",
                  isSelected 
                    ? "bg-primary shadow-sm" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => {
                  onMonthChange(month);
                  setOpen(false);
                }}
              >
                {month.substring(0, 3)}
                {isSelected && <Check className="ml-1 h-3 w-3" />}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
