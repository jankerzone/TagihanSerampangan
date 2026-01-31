"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit3, Trash2, Settings, LogOut, Loader2, Download, Upload, ListPlus, CheckSquare, Pencil, ArrowUpDown, MoreHorizontal, PiggyBank } from 'lucide-react';

import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getMonthKey,
  formatCurrency,
  monthNames,
  monthNumbers,
  t,
} from "@/lib/utils";
import { Link, useNavigate } from 'react-router-dom';
import { showSuccess, showError } from "@/utils/toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from "@/lib/api";
import { EditableCell } from "@/components/EditableCell";
import { EditableTextField } from "@/components/EditableTextField";
import { ThemeToggle } from "@/components/ThemeToggle";

// Types
interface IncomeSource {
  id: string;
  name: string;
  amount: number;
}

interface Saving {
  id: string;
  name: string;
  amount: number;
}

interface BudgetItem {
  id: string;
  name: string;
  allocation: number;
  realization: number;
  category: string;
}

interface FinancialData {
  incomeSources: IncomeSource[];
  savingList: Saving[];
  budgetingList: BudgetItem[];
}

// Helper to derive specific shades for panel styling based on a base color (e.g., "green-100")
const getDerivedColorClasses = (selectedColor: string) => {
  const parts = selectedColor.split('-'); // e.g., ["green", "100"]
  const colorName = parts[0];
  const shade = parseInt(parts[1]);

  // Logic to derive shades based on user's request:
  // If base is COLOR-X00:
  //   Background: COLOR-(X+1)00 (e.g., 100 -> 200, 200 -> 300)
  //   Text: COLOR-800 (fixed dark text for light backgrounds)
  //   Border: COLOR-(X+2)00 (e.g., 100 -> 300, 200 -> 400)

  let bgColorShade = shade + 100;
  let textColorShade = 800;
  let borderColorShade = shade + 200;

  // Ensure shades don't exceed 900
  if (bgColorShade > 900) bgColorShade = 900;
  if (borderColorShade > 900) borderColorShade = 900;

  return {
    bgColor: `bg-${colorName}-${bgColorShade}`,
    textColor: `text-${colorName}-${textColorShade}`,
    borderColor: `border-${colorName}-${borderColorShade}`
  };
};

// Memoized Category Badge Component removed to fix lag - replaced with Dialog approach

const categoryColors: Record<string, string> = {
  'Zakat': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
  'Pajak': 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  'Keluarga': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  'Rumah': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
  'Tagihan': 'bg-rose-100 text-rose-800 hover:bg-rose-200',
  'Lainnya': 'bg-slate-100 text-slate-800 hover:bg-slate-200',
};

const getDefaultCategoryColor = (category: string) => {
  return categoryColors[category] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
};

// Savings Contributions Component
const SavingsContributionsSection = ({ currentKey }: { currentKey: string }) => {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newContrib, setNewContrib] = useState({ goalId: '', amount: '' });

  const { data: goals } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: api.savingsGoals.getAll,
    initialData: { goals: [] }
  });

  const { data: contributions } = useQuery({
    queryKey: ['savingsContributions', currentKey],
    queryFn: () => api.savingsContributions.getByMonth(currentKey),
    initialData: { contributions: [] }
  });

  const addContribMutation = useMutation({
    mutationFn: api.savingsContributions.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsContributions', currentKey] });
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      showSuccess('Contribution added!');
      setNewContrib({ goalId: '', amount: '' });
      setIsAddOpen(false);
    }
  });

  const deleteContribMutation = useMutation({
    mutationFn: api.savingsContributions.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsContributions', currentKey] });
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      showSuccess('Deleted!');
    }
  });

  if (!goals || !goals.goals || goals.goals.length === 0) {
    return (
      <div className="text-center py-8">
        <PiggyBank className="h-12 w-12 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">No savings goals yet!</p>
        <Link to="/savings-goals">
          <Button>Create Your First Goal</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="mb-4">
            <PlusCircle className="h-4 w-4 mr-1" /> Add Contribution
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Monthly Contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Goal</Label>
              <Select value={newContrib.goalId} onValueChange={v => setNewContrib({...newContrib, goalId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a goal..." />
                </SelectTrigger>
                <SelectContent>
                  {(goals?.goals || []).map((g: any) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (Rp)</Label>
              <Input type="number" value={newContrib.amount} onChange={e => setNewContrib({...newContrib, amount: e.target.value})} placeholder="1000000" />
            </div>
            <Button onClick={() => {
              if (!newContrib.goalId || !newContrib.amount) return;
              addContribMutation.mutate({
                savings_goal_id: newContrib.goalId,
                month_key: currentKey,
                amount: parseInt(newContrib.amount)
              });
            }} className="w-full">Add</Button>
          </div>
        </DialogContent>
      </Dialog>

      {(!contributions || !contributions.contributions || contributions.contributions.length === 0) ? (
        <p className="text-gray-500 text-center py-4">No contributions this month</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Goal</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(contributions?.contributions || []).map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.goal_name}</TableCell>
                <TableCell className="text-right">{formatCurrency(c.amount)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => deleteContribMutation.mutate(c.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Local State for UI
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));

  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isAddSavingOpen, setIsAddSavingOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isEditRealizationOpen, setIsEditRealizationOpen] = useState(false);
  const [isEditAllocationOpen, setIsEditAllocationOpen] = useState(false);
  const [isChangeCategoryOpen, setIsChangeCategoryOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [newIncome, setNewIncome] = useState({ name: '', amount: '' });
  const [newSaving, setNewSaving] = useState({ name: '', amount: '' });
  const [newBudget, setNewBudget] = useState({ name: '', allocation: '', category: "Lainnya" });
  const [newRealization, setNewRealization] = useState('');
  const [newAllocation, setNewAllocation] = useState('');

  // Bulk Add State
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [bulkAddText, setBulkAddText] = useState('');

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof BudgetItem, direction: 'asc' | 'desc' } | null>(null);

  // Fetch Global Settings
  const { data: globalSettings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.getGlobal,
    initialData: {
      categories: ["Zakat", "Pajak", "Keluarga", "Rumah", "Lainnya"],
      colors: {
        income: "green-100",
        budgeted_expenses: "orange-100",
        spending: "red-100",
        savings: "blue-100"
      },
      lang: "en"
    }
  });

  // Update local state when settings load (optional, but good for consistency)
  useEffect(() => {
    if (globalSettings) {
      // We could sync year/month here if we wanted to persist last view
    }
  }, [globalSettings]);

  // Fetch Month Data
  const currentKey = getMonthKey(currentYear, currentMonth);
  const { data, isLoading: isDataLoading } = useQuery({
    queryKey: ['monthData', currentKey],
    queryFn: () => api.data.getMonthData(currentKey),
    initialData: {
      incomeSources: [],
      savingList: [],
      budgetingList: []
    }
  });

  // Fetch month's savings contributions
  const { data: monthContributions } = useQuery({
    queryKey: ['savingsContributions', currentKey],
    queryFn: () => api.savingsContributions.getMonthTotal(currentKey),
    initialData: { total: 0 }
  });

  // Mutation to save data
  const saveDataMutation = useMutation({
    mutationFn: (newData: FinancialData) => api.data.saveMonthData(currentKey, newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthData', currentKey] });
    },
    onError: (error: any) => {
      showError(error.message || "Failed to save data");
    }
  });

  // Mutation to save settings
  const saveSettingsMutation = useMutation({
    mutationFn: (newSettings: any) => api.settings.saveGlobal(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  // Optimistic update mutations for individual items
  const updateBudgetItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BudgetItem> }) => 
      api.budgetItems.update(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['monthData', currentKey] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(['monthData', currentKey]);
      
      // Optimistically update
      queryClient.setQueryData(['monthData', currentKey], (old: any) => ({
        ...old,
        budgetingList: old.budgetingList.map((item: BudgetItem) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      }));
      
      return { previousData };
    },
    onError: (err, variables, context: any) => {
      // Rollback on error
      queryClient.setQueryData(['monthData', currentKey], context.previousData);
      showError('Failed to update budget item');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['monthData', currentKey] });
    },
  });

  const updateIncomeSourceMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<IncomeSource> }) => 
      api.incomeSources.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['monthData', currentKey] });
      const previousData = queryClient.getQueryData(['monthData', currentKey]);
      
      queryClient.setQueryData(['monthData', currentKey], (old: any) => ({
        ...old,
        incomeSources: old.incomeSources.map((item: IncomeSource) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      }));
      
      return { previousData };
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['monthData', currentKey], context.previousData);
      showError('Failed to update income source');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['monthData', currentKey] });
    },
  });

  const updateSavingMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Saving> }) => 
      api.savings.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['monthData', currentKey] });
      const previousData = queryClient.getQueryData(['monthData', currentKey]);
      
      queryClient.setQueryData(['monthData', currentKey], (old: any) => ({
        ...old,
        savingList: old.savingList.map((item: Saving) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      }));
      
      return { previousData };
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['monthData', currentKey], context.previousData);
      showError('Failed to update saving');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['monthData', currentKey] });
    },
  });

  // Calculations
  const totalIncome = data?.incomeSources?.reduce((sum: number, item: IncomeSource) => sum + item.amount, 0) || 0;
  const totalPlannedSavings = monthContributions?.total || 0; // Use actual contributions from savings goals
  const availableToSpend = totalIncome - totalPlannedSavings;
  const totalBudgetedExpenses = data?.budgetingList?.reduce((sum: number, item: BudgetItem) => sum + item.allocation, 0) || 0;
  const totalSpending = data?.budgetingList?.reduce((sum: number, item: BudgetItem) => sum + item.realization, 0) || 0;
  const remainingMoney = availableToSpend - totalSpending;

  // Handlers
  const handleAddIncome = () => {
    if (newIncome.name && newIncome.amount) {
      const newIncomeItem: IncomeSource = {
        id: Date.now().toString(),
        name: newIncome.name,
        amount: parseInt(newIncome.amount)
      };

      const updatedData = {
        ...data,
        incomeSources: [...data.incomeSources, newIncomeItem]
      };

      saveDataMutation.mutate(updatedData);

      setNewIncome({ name: '', amount: '' });
      setIsAddIncomeOpen(false);
    } else {
      showError(t('requiredFields'));
    }
  };

  const handleAddSaving = () => {
    if (newSaving.name && newSaving.amount) {
      const newSavingItem: Saving = {
        id: Date.now().toString(),
        name: newSaving.name,
        amount: parseInt(newSaving.amount)
      };

      const updatedData = {
        ...data,
        savingList: [...data.savingList, newSavingItem]
      };

      saveDataMutation.mutate(updatedData);

      setNewSaving({ name: '', amount: '' });
      setIsAddSavingOpen(false);
    } else {
      showError(t('requiredFields'));
    }
  };

  const handleAddBudget = () => {
    if (newBudget.name && newBudget.allocation) {
      const newBudgetItem: BudgetItem = {
        id: Date.now().toString(),
        name: newBudget.name,
        allocation: parseInt(newBudget.allocation),
        realization: 0,
        category: newBudget.category
      };

      const updatedData = {
        ...data,
        budgetingList: [...data.budgetingList, newBudgetItem]
      };

      saveDataMutation.mutate(updatedData);

      setNewBudget({ name: '', allocation: '', category: globalSettings.categories[0] || "Lainnya" });
      setIsAddBudgetOpen(false);
    } else {
      showError(t('requiredFields'));
    }
  };

  const handleEditRealization = () => {
    if (selectedBudgetId && newRealization) {
      const updatedData = {
        ...data,
        budgetingList: data.budgetingList.map((item: BudgetItem) =>
          item.id === selectedBudgetId
            ? { ...item, realization: parseInt(newRealization) }
            : item
        )
      };

      saveDataMutation.mutate(updatedData);

      setNewRealization('');
      setSelectedBudgetId(null);
      setIsEditRealizationOpen(false);
    } else {
      showError(t('requiredFields'));
    }
  };

  const handleEditAllocation = () => {
    if (selectedBudgetId && newAllocation) {
      const updatedData = {
        ...data,
        budgetingList: data.budgetingList.map((item: BudgetItem) =>
          item.id === selectedBudgetId
            ? { ...item, allocation: parseInt(newAllocation) }
            : item
        )
      };

      saveDataMutation.mutate(updatedData);

      setNewAllocation('');
      setSelectedBudgetId(null);
      setIsEditAllocationOpen(false);
    } else {
      showError(t('requiredFields'));
    }
  };

  const handleChangeCategory = (newCategory: string) => {
    if (selectedBudgetId) {
      const updatedData = {
        ...data,
        budgetingList: data.budgetingList.map((item: BudgetItem) =>
          item.id === selectedBudgetId
            ? { ...item, category: newCategory }
            : item
        )
      };
      saveDataMutation.mutate(updatedData);
      showSuccess(t('categoryUpdated'));
      setIsChangeCategoryOpen(false);
      setSelectedBudgetId(null);
    }
  };

  const openChangeCategory = (id: string) => {
    setSelectedBudgetId(id);
    setIsChangeCategoryOpen(true);
  };

  const handleDeleteItem = (type: 'income' | 'saving' | 'budget', id: string) => {
    let updatedData;

    switch (type) {
      case 'income':
        updatedData = { ...data, incomeSources: data.incomeSources.filter((item: IncomeSource) => item.id !== id) };
        break;
      case 'saving':
        updatedData = { ...data, savingList: data.savingList.filter((item: Saving) => item.id !== id) };
        break;
      case 'budget':
        updatedData = { ...data, budgetingList: data.budgetingList.filter((item: BudgetItem) => item.id !== id) };
        break;
      default:
        return;
    }

    saveDataMutation.mutate(updatedData);
  };

  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
  };

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);
    if (!isNaN(yearNum)) {
      setCurrentYear(yearNum);
    }
  };

  const openEditRealization = (id: string, currentRealization: number) => {
    setSelectedBudgetId(id);
    setNewRealization(currentRealization.toString());
    setIsEditRealizationOpen(true);
  };

  const openEditAllocation = (id: string, currentAllocation: number) => {
    setSelectedBudgetId(id);
    setNewAllocation(currentAllocation.toString());
    setIsEditAllocationOpen(true);
  };

  const handleCopyFromPreviousMonth = async () => {
    // This logic is a bit complex to migrate directly to backend without a specific endpoint
    // For now, we'll fetch previous month data and save it to current month
    // Or we can implement a backend endpoint for this.
    // Let's do it client-side for now to save time.

    const monthIndex = monthNames.indexOf(currentMonth);
    let prevYear = currentYear;
    let prevMonthIndex = monthIndex - 1;

    if (prevMonthIndex < 0) {
      prevYear = currentYear - 1;
      prevMonthIndex = 11;
    }

    const prevKey = getMonthKey(prevYear, monthNames[prevMonthIndex]);

    try {
      const prevData = await api.data.getMonthData(prevKey);

      if (prevData.incomeSources.length > 0 || prevData.savingList.length > 0 || prevData.budgetingList.length > 0) {
        const newData = {
          incomeSources: prevData.incomeSources, // IDs might conflict if we don't regenerate them, but for now it's okay as they are unique per row in DB usually, but here we send them back. Ideally we should regenerate IDs.
          savingList: prevData.savingList,
          budgetingList: prevData.budgetingList.map((item: any) => ({
            ...item,
            realization: 0
          }))
        };

        // Regenerate IDs to be safe
        newData.incomeSources = newData.incomeSources.map((item: any) => ({ ...item, id: Date.now().toString() + Math.random() }));
        newData.savingList = newData.savingList.map((item: any) => ({ ...item, id: Date.now().toString() + Math.random() }));
        newData.budgetingList = newData.budgetingList.map((item: any) => ({ ...item, id: Date.now().toString() + Math.random() }));

        saveDataMutation.mutate(newData);
        showSuccess(t('copySuccess'));
      } else {
        showError(t('copyError'));
      }
    } catch (e) {
      showError(t('copyError'));
    }
  };

  const handleExportData = () => {
    try {
      const exportData = {
        incomeSources: data.incomeSources,
        savingList: data.savingList,
        budgetingList: data.budgetingList,
        exportDate: new Date().toISOString(),
        monthKey: currentKey
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tagihan-${currentKey}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess("Data exported successfully!");
    } catch (error) {
      showError("Failed to export data");
      console.error("Export error:", error);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);

        // Basic validation
        if (!parsedData.incomeSources || !parsedData.savingList || !parsedData.budgetingList) {
          throw new Error("Invalid file format - missing required fields");
        }

        // Import only the data arrays
        const importData = {
          incomeSources: parsedData.incomeSources,
          savingList: parsedData.savingList,
          budgetingList: parsedData.budgetingList
        };

        // Use mutation with proper success/error handling
        saveDataMutation.mutate(importData, {
          onSuccess: () => {
            showSuccess(`Imported ${parsedData.incomeSources.length} income, ${parsedData.budgetingList.length} expenses, ${parsedData.savingList.length} savings!`);
          },
          onError: (error: any) => {
            showError(`Failed to save imported data: ${error.message}`);
          }
        });
      } catch (error: any) {
        showError(`Failed to read file: ${error.message}`);
        console.error("Import error:", error);
      }
    };
    
    reader.onerror = () => {
      showError("Failed to read file");
    };
    
    reader.readAsText(file);
    // Reset the input so the same file can be selected again if needed
    event.target.value = '';
  };

  const handleBulkAdd = () => {
    if (!bulkAddText.trim()) {
      showError("Please enter data");
      return;
    }

    const lines = bulkAddText.trim().split('\n');
    const newItems: BudgetItem[] = [];
    let errorCount = 0;

    lines.forEach(line => {
      // Support both tab and comma separators
      const separator = line.includes('\t') ? '\t' : ',';
      const parts = line.split(separator);
      
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const allocation = parseInt(parts[1].replace(/[^0-9]/g, ''));
        const category = parts[2]?.trim() || "Lainnya";

        if (name && !isNaN(allocation)) {
          newItems.push({
            id: Date.now().toString() + Math.random(),
            name,
            allocation,
            realization: 0,
            category
          });
        } else {
          errorCount++;
        }
      } else {
        errorCount++;
      }
    });

    if (newItems.length > 0) {
      const updatedData = {
        ...data,
        budgetingList: [...data.budgetingList, ...newItems]
      };
      saveDataMutation.mutate(updatedData);
      setBulkAddText('');
      setIsBulkAddOpen(false);
      showSuccess(`Successfully added ${newItems.length} items.`);
      if (errorCount > 0) {
        showError(`Failed to parse ${errorCount} lines.`);
      }
    } else {
      showError("No valid items found. Please check the format.");
    }
  };

  const handleBulkSetRealization = () => {
    const updatedData = {
      ...data,
      budgetingList: data.budgetingList.map((item: BudgetItem) => ({
        ...item,
        realization: item.allocation
      }))
    };
    saveDataMutation.mutate(updatedData);
    showSuccess("All realization amounts set to match allocation.");
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSort = (key: keyof BudgetItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedBudgetingList = React.useMemo(() => {
    let sortableItems = [...(data?.budgetingList || [])];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // Handle string comparison for name and category
        if (sortConfig.key === 'name' || sortConfig.key === 'category') {
           const valA = (a[sortConfig.key] || '').toLowerCase();
           const valB = (b[sortConfig.key] || '').toLowerCase();
           if (valA < valB) {
             return sortConfig.direction === 'asc' ? -1 : 1;
           }
           if (valA > valB) {
             return sortConfig.direction === 'asc' ? 1 : -1;
           }
           return 0;
        }
        // Handle number comparison
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data?.budgetingList, sortConfig]);

  const selectedBudget = data.budgetingList.find((item: BudgetItem) => item.id === selectedBudgetId);

  // Derived color classes for each panel
  const colors = globalSettings?.colors || {
    income: "green-100",
    budgeted_expenses: "orange-100",
    spending: "red-100",
    savings: "blue-100"
  };

  const incomeColors = getDerivedColorClasses(colors.income || "green-100");
  const budgetedColors = getDerivedColorClasses(colors.budgeted_expenses || "orange-100");
  const spendingColors = getDerivedColorClasses(colors.spending || "red-100");
  const savingsColors = getDerivedColorClasses(colors.savings || "blue-100");

  if (isSettingsLoading || isDataLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('appName')}</h1>
            {isDataLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('year')}:</span>
                <Input
                  type="number"
                  value={currentYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-20 h-8 text-sm"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('month')}:</span>
                <Select value={currentMonth} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ThemeToggle />
            <Link to="/savings-goals">
              <Button variant="outline" size="sm">
                <PiggyBank className="h-4 w-4 mr-1" />
                Goals
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                {t('settings')}
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              {t('logout')}
            </Button>
          </div>
        </div>

        {/* Monthly Report */}
        <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>{t('monthlyReport')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className={`${incomeColors.bgColor} ${incomeColors.borderColor} border`}>
                <CardContent className="p-4">
                  <div className={`text-sm font-medium ${incomeColors.textColor}`}>{t('totalIncome')}</div>
                  <div className={`text-xl font-bold ${incomeColors.textColor}`}>{formatCurrency(totalIncome)}</div>
                </CardContent>
              </Card>

              <Card className={`${savingsColors.bgColor} ${savingsColors.borderColor} border`}>
                <CardContent className="p-4">
                  <div className={`text-sm font-medium ${savingsColors.textColor}`}>Planned Savings</div>
                  <div className={`text-xl font-bold ${savingsColors.textColor}`}>{formatCurrency(totalPlannedSavings)}</div>
                  <div className={`text-xs mt-1 ${savingsColors.textColor} opacity-75`}>Investment, Gold, etc.</div>
                </CardContent>
              </Card>

              <Card className={`${budgetedColors.bgColor} ${budgetedColors.borderColor} border`}>
                <CardContent className="p-4">
                  <div className={`text-sm font-medium ${budgetedColors.textColor}`}>Available to Spend</div>
                  <div className={`text-xl font-bold ${budgetedColors.textColor}`}>{formatCurrency(availableToSpend)}</div>
                  <div className={`text-xs mt-1 ${budgetedColors.textColor} opacity-75`}>Income - Savings</div>
                </CardContent>
              </Card>

              <Card className={`${spendingColors.bgColor} ${spendingColors.borderColor} border`}>
                <CardContent className="p-4">
                  <div className={`text-sm font-medium ${spendingColors.textColor}`}>{t('spending', { month: currentMonth })}</div>
                  <div className={`text-xl font-bold ${spendingColors.textColor}`}>{formatCurrency(totalSpending)}</div>
                </CardContent>
              </Card>

              <Card className={`${remainingMoney >= 0 ? 'bg-emerald-200 border-emerald-300 dark:bg-emerald-900 dark:border-emerald-700' : 'bg-red-200 border-red-300 dark:bg-red-900 dark:border-red-700'} border`}>
                <CardContent className="p-4">
                  <div className={`text-sm font-medium ${remainingMoney >= 0 ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'}`}>
                    {remainingMoney >= 0 ? 'Remaining' : 'Over Budget'}
                  </div>
                  <div className={`text-xl font-bold ${remainingMoney >= 0 ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'}`}>
                    {formatCurrency(Math.abs(remainingMoney))}
                  </div>
                  <div className="text-xs mt-1 opacity-75">Available - Spent</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Data Management - Copy from Previous Month */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-300">{t('dataManagement')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-4 flex-1 min-w-[200px]">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('copyPrevMonthDesc')}
                </p>
                <Button onClick={handleCopyFromPreviousMonth} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                  {t('copyPrevMonthButton')}
                </Button>
              </div>

              <div className="space-y-4 flex-1 min-w-[200px]">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Export or import data for backup purposes.
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleExportData} variant="outline" className="flex-1 sm:flex-none">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <label className="relative cursor-pointer">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" className="w-full pointer-events-none">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Income & Savings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Income Sources */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('incomeSources')}</CardTitle>
                <Dialog open={isAddIncomeOpen} onOpenChange={setIsAddIncomeOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <PlusCircle className="h-4 w-4 mr-1" />
                      {t('add')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('addIncomeSource')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="incomeName">{t('name')}</Label>
                        <Input
                          id="incomeName"
                          value={newIncome.name}
                          onChange={(e) => setNewIncome({ ...newIncome, name: e.target.value })}
                          placeholder="e.g., Gaji Bulanan"
                        />
                      </div>
                      <div>
                        <Label htmlFor="incomeAmount">{t('amount')} (Rp)</Label>
                        <Input
                          id="incomeAmount"
                          type="number"
                          value={newIncome.amount}
                          onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                          placeholder="e.g., 10000000"
                        />
                      </div>
                      <Button onClick={handleAddIncome} className="w-full">{t('addIncomeSource')}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {data.incomeSources.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">{t('noIncomeSources')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('amount')}</TableHead>
                        <TableHead className="w-16">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.incomeSources.map((income: IncomeSource) => (
                        <TableRow key={income.id}>
                          <TableCell className="font-medium">
                            <EditableTextField
                              value={income.name}
                              onSave={async (value) => {
                                await updateIncomeSourceMutation.mutateAsync({
                                  id: income.id,
                                  updates: { name: value }
                                });
                              }}
                              placeholder="Income name"
                            />
                          </TableCell>
                          <TableCell>
                            <EditableCell
                              value={income.amount}
                              onSave={async (value) => {
                                await updateIncomeSourceMutation.mutateAsync({
                                  id: income.id,
                                  updates: { amount: value }
                                });
                              }}
                              type="currency"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem('income', income.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Monthly Savings Contributions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Monthly Savings</CardTitle>
                <Link to="/savings-goals">
                  <Button size="sm" variant="outline">
                    <PiggyBank className="h-4 w-4 mr-1" />
                    Manage Goals
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <SavingsContributionsSection currentKey={currentKey} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Budgeting List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle>{t('expensesList')}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <ListPlus className="h-4 w-4 mr-1" />
                        Bulk Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Bulk Add Expenses</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Enter your expense data here. Each line should contain <strong>Name</strong>, <strong>Allocation</strong> (number), and <strong>Category</strong> (optional).<br/>
                          <span className="text-xs">You can separate with commas (,) or tabs - or paste from Excel!</span>
                        </p>
                        <Textarea
                          value={bulkAddText}
                          onChange={(e) => setBulkAddText(e.target.value)}
                          placeholder={`Examples:\nListrik, 500000, Rumah\nPulsa, 100000, Keluarga\nBelanja Bulanan, 2000000, Rumah`}
                          className="h-[300px] font-mono text-sm"
                        />
                        <Button onClick={handleBulkAdd} className="w-full">Process Data</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Bulk Set Realization
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will set the realization amount to match the allocation amount for <strong>ALL</strong> expenses in this month. This action cannot be undone easily unless you have a backup.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkSetRealization}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Dialog open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <PlusCircle className="h-4 w-4 mr-1" />
                        {t('add')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('addBudgetItem')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="budgetName">{t('name')}</Label>
                          <Input
                            id="budgetName"
                            value={newBudget.name}
                            onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
                            placeholder="e.g., Zakat Wajib"
                          />
                        </div>
                        <div>
                          <Label htmlFor="budgetAllocation">{t('allocation')} (Rp)</Label>
                          <Input
                            id="budgetAllocation"
                            type="number"
                            value={newBudget.allocation}
                            onChange={(e) => setNewBudget({ ...newBudget, allocation: e.target.value })}
                            placeholder="e.g., 325000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="budgetCategory">{t('category')}</Label>
                          <Select value={newBudget.category} onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {globalSettings.categories.map((category: string) => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddBudget} className="w-full">{t('addBudgetItem')}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {data.budgetingList.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">{t('noExpenses')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                          <div className="flex items-center">
                            {t('name')}
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
                          <div className="flex items-center">
                            {t('category')}
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('allocation')}>
                          <div className="flex items-center justify-end">
                            {t('allocation')}
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('realization')}>
                          <div className="flex items-center justify-end">
                            {t('realization')}
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>{t('budgetUsage')}</TableHead>
                        <TableHead className="text-right">{t('usagePercent')}</TableHead>
                        <TableHead className="w-24">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedBudgetingList.map((budget: BudgetItem) => {
                        const percentage = budget.allocation > 0
                          ? Math.min(100, Math.round((budget.realization / budget.allocation) * 10000) / 100)
                          : 0;

                        return (
                          <TableRow key={budget.id}>
                            <TableCell className="font-medium">
                              <EditableTextField
                                value={budget.name}
                                onSave={async (value) => {
                                  await updateBudgetItemMutation.mutateAsync({
                                    id: budget.id,
                                    updates: { name: value }
                                  });
                                }}
                                placeholder="Budget name"
                              />
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary" 
                                className={`cursor-pointer ${getDefaultCategoryColor(budget.category)}`}
                                onClick={() => openChangeCategory(budget.id)}
                              >
                                {budget.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <EditableCell
                                value={budget.allocation}
                                onSave={async (value) => {
                                  await updateBudgetItemMutation.mutateAsync({
                                    id: budget.id,
                                    updates: { allocation: value }
                                  });
                                }}
                                type="currency"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <EditableCell
                                value={budget.realization}
                                onSave={async (value) => {
                                  await updateBudgetItemMutation.mutateAsync({
                                    id: budget.id,
                                    updates: { realization: value }
                                  });
                                }}
                                type="currency"
                              />
                            </TableCell>
                            <TableCell>
                              <Progress
                                value={Math.min(100, percentage)}
                                className={percentage > 100 ? "bg-red-200" : ""}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={percentage > 100 ? "text-red-600 font-bold" : ""}>
                                {percentage.toFixed(2)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditRealization(budget.id, budget.realization)}>
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    {t('editRealization')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditAllocation(budget.id, budget.allocation)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {t('editAllocation')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDeleteItem('budget', budget.id)} className="text-red-600 focus:text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('delete')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Realization Dialog */}
        <Dialog open={isEditRealizationOpen} onOpenChange={setIsEditRealizationOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('editRealization')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedBudget && (
                <div className="text-sm text-gray-600 italic">
                  Allocation: {formatCurrency(selectedBudget.allocation)}
                </div>
              )}
              <div>
                <Label htmlFor="realizationAmount">{t('realizationAmount')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="realizationAmount"
                    type="number"
                    value={newRealization}
                    onChange={(e) => setNewRealization(e.target.value)}
                    placeholder="e.g., 325000"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => selectedBudget && setNewRealization(selectedBudget.allocation.toString())}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Set to 100%
                  </Button>
                </div>
              </div>
              <Button onClick={handleEditRealization} className="w-full">{t('updateRealization')}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Allocation Dialog */}
        <Dialog open={isEditAllocationOpen} onOpenChange={setIsEditAllocationOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('editAllocation')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="allocationAmount">{t('allocationAmount')}</Label>
                <Input
                  id="allocationAmount"
                  type="number"
                  value={newAllocation}
                  onChange={(e) => setNewAllocation(e.target.value)}
                  placeholder="e.g., 325000"
                />
              </div>
              <Button onClick={handleEditAllocation} className="w-full">{t('updateAllocation')}</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isChangeCategoryOpen} onOpenChange={setIsChangeCategoryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('category')}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              {globalSettings.categories.map((category: string) => (
                <Button 
                  key={category} 
                  variant="outline" 
                  onClick={() => handleChangeCategory(category)}
                  className={`${getDefaultCategoryColor(category)} ${selectedBudget?.category === category ? "ring-2 ring-offset-2 ring-black" : "border-transparent"}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>


      </div>
    </div>
  );
};

export default Index;