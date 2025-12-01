"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit3, Trash2, Settings, LogOut, Loader2, Download, Upload, ListPlus, CheckSquare } from 'lucide-react';
import { MadeWithDyad } from "@/components/made-with-dyad";
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
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [newIncome, setNewIncome] = useState({ name: '', amount: '' });
  const [newSaving, setNewSaving] = useState({ name: '', amount: '' });
  const [newBudget, setNewBudget] = useState({ name: '', allocation: '', category: "Lainnya" });
  const [newRealization, setNewRealization] = useState('');

  // Bulk Add State
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [bulkAddText, setBulkAddText] = useState('');

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

  // Calculations
  const totalIncome = data.incomeSources.reduce((sum: number, item: IncomeSource) => sum + item.amount, 0);
  const totalBudgetedExpenses = data.budgetingList.reduce((sum: number, item: BudgetItem) => sum + item.allocation, 0);
  const totalSpending = data.budgetingList.reduce((sum: number, item: BudgetItem) => sum + item.realization, 0);
  const savings = totalIncome - totalSpending;

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
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financial-data-${currentYear}-${currentMonth}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          throw new Error("Invalid file format");
        }

        saveDataMutation.mutate(parsedData);
        showSuccess("Data imported successfully");
      } catch (error) {
        showError("Failed to import data: Invalid file format");
      }
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
      const parts = line.split('\t');
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

  if (isSettingsLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('appName')}</h1>
            {isDataLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700">{t('year')}:</span>
                <Input
                  type="number"
                  value={currentYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-20 h-8 text-sm"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700">{t('month')}:</span>
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
        <Card className="mb-6 bg-green-50 border-green-200"> {/* This outer card's color is hardcoded, not part of the dynamic color settings */}
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <span>{t('monthlyReport')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className={`${incomeColors.bgColor} ${incomeColors.borderColor} border`}>
                <CardContent className="p-4">
                  <div className={`text-sm font-medium ${incomeColors.textColor}`}>{t('totalIncome')}</div>
                  <div className={`text-xl font-bold ${incomeColors.textColor}`}>{formatCurrency(totalIncome)}</div>
                </CardContent>
              </Card>

              <Card className={`${budgetedColors.bgColor} ${budgetedColors.borderColor} border`}>
                <CardContent className="p-4">
                  <div className={`text-sm font-medium ${budgetedColors.textColor}`}>{t('budgetedExpenses')}</div>
                  <div className={`text-xl font-bold ${budgetedColors.textColor}`}>{formatCurrency(totalBudgetedExpenses)}</div>
                </CardContent>
              </Card>

              <Card className={`${spendingColors.bgColor} ${spendingColors.borderColor} border`}>
                <CardContent className="p-4">
                  <div className={`text-sm font-medium ${spendingColors.textColor}`}>{t('spending', { month: currentMonth })}</div>
                  <div className={`text-xl font-bold ${spendingColors.textColor}`}>{formatCurrency(totalSpending)}</div>
                </CardContent>
              </Card>

              <Card className={`${savingsColors.bgColor} ${savingsColors.borderColor} border`}>
                <CardContent className="p-4">
                  <div className={`text-sm font-medium ${savingsColors.textColor}`}>{t('savings', { month: currentMonth })}</div>
                  <div className={`text-xl font-bold ${savingsColors.textColor}`}>{formatCurrency(savings)}</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Data Management - Copy from Previous Month */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">{t('dataManagement')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-4 flex-1 min-w-[200px]">
                <p className="text-sm text-gray-600">
                  {t('copyPrevMonthDesc')}
                </p>
                <Button onClick={handleCopyFromPreviousMonth} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                  {t('copyPrevMonthButton')}
                </Button>
              </div>

              <div className="space-y-4 flex-1 min-w-[200px]">
                <p className="text-sm text-gray-600">
                  Export or import data for backup purposes.
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleExportData} variant="outline" className="flex-1 sm:flex-none">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  </div>
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
                          <TableCell className="font-medium">{income.name}</TableCell>
                          <TableCell>{formatCurrency(income.amount)}</TableCell>
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

            {/* Savings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('savingsTitle')}</CardTitle>
                <Dialog open={isAddSavingOpen} onOpenChange={setIsAddSavingOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <PlusCircle className="h-4 w-4 mr-1" />
                      {t('add')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('addSaving')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="savingName">{t('name')}</Label>
                        <Input
                          id="savingName"
                          value={newSaving.name}
                          onChange={(e) => setNewSaving({ ...newSaving, name: e.target.value })}
                          placeholder="e.g., Dana Darurat"
                        />
                      </div>
                      <div>
                        <Label htmlFor="savingAmount">{t('amount')} (Rp)</Label>
                        <Input
                          id="savingAmount"
                          type="number"
                          value={newSaving.amount}
                          onChange={(e) => setNewSaving({ ...newSaving, amount: e.target.value })}
                          placeholder="e.g., 2000000"
                        />
                      </div>
                      <Button onClick={handleAddSaving} className="w-full">{t('addSaving')}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {data.savingList.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">{t('noSavings')}</p>
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
                      {data.savingList.map((saving: Saving) => (
                        <TableRow key={saving.id}>
                          <TableCell className="font-medium">{saving.name}</TableCell>
                          <TableCell>{formatCurrency(saving.amount)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem('saving', saving.id)}
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
                        <p className="text-sm text-gray-500">
                          Paste your expense data from Excel here. Each line should contain <strong>Name</strong>, <strong>Allocation</strong> (number), and <strong>Category</strong> (optional), separated by tabs.
                        </p>
                        <Textarea
                          value={bulkAddText}
                          onChange={(e) => setBulkAddText(e.target.value)}
                          placeholder={`Contoh:\nBelanja Bulanan\t2000000\tRumah\nListrik\t500000\tRumah\nPulsa\t100000\tKeluarga`}
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
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('category')}</TableHead>
                        <TableHead className="text-right">{t('allocation')}</TableHead>
                        <TableHead className="text-right">{t('realization')}</TableHead>
                        <TableHead>{t('budgetUsage')}</TableHead>
                        <TableHead className="text-right">{t('usagePercent')}</TableHead>
                        <TableHead className="w-24">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.budgetingList.map((budget: BudgetItem) => {
                        const percentage = budget.allocation > 0
                          ? Math.min(100, Math.round((budget.realization / budget.allocation) * 10000) / 100)
                          : 0;

                        return (
                          <TableRow key={budget.id}>
                            <TableCell className="font-medium">{budget.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{budget.category}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(budget.allocation)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(budget.realization)}</TableCell>
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
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditRealization(budget.id, budget.realization)}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem('budget', budget.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
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

        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;