import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Share2, Copy } from 'lucide-react';
import { formatCurrency, t } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";

interface BudgetItem {
  id: string;
  name: string;
  allocation: number;
  realization: number;
  category: string;
}

interface ShareRecapDialogProps {
  budgetingList: BudgetItem[];
  month: string;
  year: number;
}

// Remaining allocation for an item (e.g. 40% used -> the 60% that's left).
const getRemaining = (item: BudgetItem) => item.allocation - item.realization;

const getUsedPercent = (item: BudgetItem) =>
  item.allocation > 0 ? (item.realization / item.allocation) * 100 : 0;

export const ShareRecapDialog: React.FC<ShareRecapDialogProps> = ({
  budgetingList,
  month,
  year,
}) => {
  const [open, setOpen] = useState(false);
  // Which items to include in the shared recap. Default: nothing selected —
  // the user picks the items they want to share.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  // Start fresh (nothing selected) each time the dialog is opened.
  React.useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
    }
  }, [open]);

  const allSelected =
    budgetingList.length > 0 && selectedIds.size === budgetingList.length;

  const toggleAll = () => {
    setSelectedIds(
      allSelected ? new Set() : new Set(budgetingList.map((item) => item.id))
    );
  };

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedItems = useMemo(
    () => budgetingList.filter((item) => selectedIds.has(item.id)),
    [budgetingList, selectedIds]
  );

  const totals = useMemo(() => {
    return selectedItems.reduce(
      (acc, item) => {
        acc.allocation += item.allocation;
        acc.used += item.realization;
        acc.remaining += getRemaining(item);
        return acc;
      },
      { allocation: 0, used: 0, remaining: 0 }
    );
  }, [selectedItems]);

  const buildText = () => {
    const lines: string[] = [];
    lines.push(`💰 ${t('shareRecapTitle')} — ${month} ${year}`);
    lines.push('');
    selectedItems.forEach((item) => {
      const remaining = getRemaining(item);
      const pct = Math.round(getUsedPercent(item));
      const tail =
        remaining < 0
          ? ` (${pct}% ${t('used')}, ${formatCurrency(Math.abs(remaining))} ${t('over')})`
          : ` (${pct}% ${t('used')})`;
      lines.push(`• ${item.name}: ${formatCurrency(remaining)}${tail}`);
    });
    lines.push('');
    lines.push('━━━━━━━━━━━━━━');
    lines.push(`${t('totalAllocation')}: ${formatCurrency(totals.allocation)}`);
    lines.push(`${t('totalUsed')}: ${formatCurrency(totals.used)}`);
    lines.push(`${t('totalRemaining')}: ${formatCurrency(totals.remaining)}`);
    return lines.join('\n');
  };

  const handleCopy = async () => {
    if (selectedItems.length === 0) {
      showError(t('noItemsSelected'));
      return;
    }
    try {
      await navigator.clipboard.writeText(buildText());
      showSuccess(t('copiedToClipboard'));
    } catch {
      showError(t('copyFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={budgetingList.length === 0}>
          <Share2 className="h-4 w-4 mr-1" />
          {t('shareRecap')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('shareRecapTitle')}</DialogTitle>
        </DialogHeader>

        {/* Select-all toggle */}
        <div className="flex items-center justify-between -mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('selectItemsToShare')}
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={toggleAll}
            disabled={budgetingList.length === 0}
          >
            {allSelected ? t('unselectAll') : t('selectAll')}
          </Button>
        </div>

        {/* Item selection list */}
        <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1 border-y border-gray-100 dark:border-gray-800 py-1">
          {budgetingList.map((item) => {
            const remaining = getRemaining(item);
            const pct = Math.round(getUsedPercent(item));
            return (
              <label
                key={item.id}
                className="flex items-center gap-3 py-1.5 px-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={() => toggle(item.id)}
                />
                <span className="flex-1 text-sm truncate">{item.name}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {pct}% {t('used')}
                </span>
                <span
                  className={`text-sm font-medium tabular-nums ${
                    remaining < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {formatCurrency(remaining)}
                </span>
              </label>
            );
          })}
        </div>

        {/* Shareable recap card — clean layout meant to be screenshotted */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="text-center mb-3">
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              💰 {t('shareRecapTitle')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {month} {year}
            </div>
          </div>

          <div className="space-y-1.5">
            {selectedItems.map((item) => {
              const remaining = getRemaining(item);
              return (
                <div
                  key={item.id}
                  className="flex items-baseline justify-between gap-2 text-sm"
                >
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {item.name}
                  </span>
                  <span
                    className={`font-medium tabular-nums ${
                      remaining < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {formatCurrency(remaining)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{t('totalAllocation')}</span>
              <span className="tabular-nums">{formatCurrency(totals.allocation)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{t('totalUsed')}</span>
              <span className="tabular-nums">{formatCurrency(totals.used)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-emerald-600 dark:text-emerald-400">
              <span>{t('totalRemaining')}</span>
              <span className="tabular-nums">{formatCurrency(totals.remaining)}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
          {t('screenshotHint')}
        </p>

        <Button onClick={handleCopy} className="w-full" disabled={selectedItems.length === 0}>
          <Copy className="h-4 w-4 mr-2" />
          {t('copyAsText')}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ShareRecapDialog;
