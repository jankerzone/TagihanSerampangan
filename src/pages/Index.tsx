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
import { PlusCircle, Edit3, Trash2, Settings, LogOut } from 'lucide-react';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { 
  getMonthKey, 
  loadGlobalSettings, 
  saveGlobalSettings, 
  loadMonthData, 
  saveMonthData, 
  formatCurrency,
  monthNames,
  monthNumbers,
  copyFromPreviousMonth,
  t,
  getPrefixedKey
} from "@/lib/utils";
import { Link, useNavigate } from 'react-router-dom';
import { showSuccess, showError } from "@/utils/toast";

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
  // State
  const [globalSettings, setGlobalSettings] = useState(loadGlobalSettings());
  const [data, setData] = useState<FinancialData>({
    incomeSources: [],
    savingList: [],
    budgetingList: []
  });
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isAddSavingOpen, setIsAddSavingOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isEditRealizationOpen, setIsEditRealizationOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [newIncome, setNewIncome] = useState({ name: '', amount: '' });
  const [newSaving, setNewSaving] = useState({ name: '', amount: '' });
  const [newBudget, setNewBudget] = useState({ name: '', allocation: '', category: globalSettings.categories[0] || "Lainnya" });
  const [newRealization, setNewRealization] = useState('');

  // Load data when month/year or global settings (e.g., language) changes
  useEffect(() => {
    const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
    const monthData = loadMonthData(currentKey);
    setData(monthData);
  }, [globalSettings.currentYear, globalSettings.currentMonth, globalSettings.lang]); // Re-render on lang change

  // Save global settings when they change
  useEffect(() => {
    saveGlobalSettings(globalSettings);
  }, [globalSettings]);

  // Effect to listen for storage changes (for live color updates from settings page)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Only update if the global settings key for the current user has changed
      if (event.key === getPrefixedKey('tagihan_global_settings')) {
        setGlobalSettings(loadGlobalSettings());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Calculations
  const totalIncome = data.incomeSources.reduce((sum, item) => sum + item.amount, 0);
  const totalBudgetedExpenses = data.budgetingList.reduce((sum, item) => sum + item.allocation, 0);
  const totalSpending = data.budgetingList.reduce((sum, item) => sum + item.realization, 0);
  const savings = totalIncome - totalSpending;

  // Handlers
  const handleAddIncome = () => {
    if (newIncome.name && newIncome.amount) {
      const newIncomeItem: IncomeSource = {
        id: Date.now().toString(),
        name: newIncome.name,
        amount: parseInt(newIncome.amount)
      };
      
      const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
      const updatedData = {
        ...data,
        incomeSources: [...data.incomeSources, newIncomeItem]
      };
      
      saveMonthData(currentKey, updatedData);
      setData(updatedData);
      
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
      
      const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
      const updatedData = {
        ...data,
        savingList: [...data.savingList, newSavingItem]
      };
      
      saveMonthData(currentKey, updatedData);
      setData(updatedData);
      
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
      
      const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
      const updatedData = {
        ...data,
        budgetingList: [...data.budgetingList, newBudgetItem]
      };
      
      saveMonthData(currentKey, updatedData);
      setData(updatedData);
      
      setNewBudget({ name: '', allocation: '', category: globalSettings.categories[0] || "Lainnya" });
      setIsAddBudgetOpen(false);
    } else {
      showError(t('requiredFields'));
    }
  };

  const handleEditRealization = () => {
    if (selectedBudgetId && newRealization) {
      const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
      const updatedData = {
        ...data,
        budgetingList: data.budgetingList.map(item => 
          item.id === selectedBudgetId 
            ? { ...item, realization: parseInt(newRealization) } 
            : item
        )
      };
      
      saveMonthData(currentKey, updatedData);
      setData(updatedData);
      
      setNewRealization('');
      setSelectedBudgetId(null);
      setIsEditRealizationOpen(false);
    } else {
      showError(t('requiredFields'));
    }
  };

  const handleDeleteItem = (type: 'income' | 'saving' | 'budget', id: string) => {
    const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
    let updatedData;
    
    switch (type) {
      case 'income':
        updatedData = { ...data, incomeSources: data.incomeSources.filter(item => item.id !== id) };
        break;
      case 'saving':
        updatedData = { ...data, savingList: data.savingList.filter(item => item.id !== id) };
        break;
      case 'budget':
        updatedData = { ...data, budgetingList: data.budgetingList.filter(item => item.id !== id) };
        break;
      default:
        return;
    }
    
    saveMonthData(currentKey, updatedData);
    setData(updatedData);
  };

  const handleMonthChange = (month: string) => {
    setGlobalSettings(prev => ({ ...prev, currentMonth: month }));
  };

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);
    if (!isNaN(yearNum)) {
      setGlobalSettings(prev => ({ ...prev, currentYear: yearNum }));
    }
  };

  const openEditRealization = (id: string, currentRealization: number) => {
    setSelectedBudgetId(id);
    setNewRealization(currentRealization.toString());
    setIsEditRealizationOpen(true);
  };

  const handleCopyFromPreviousMonth = () => {
    const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
    const success = copyFromPreviousMonth(currentKey);
    
    if (success) {
      showSuccess(t('copySuccess'));
      // Reload data for the current month after copying
      const monthData = loadMonthData(currentKey);
      setData(monthData);
    } else {
      showError(t('copyError'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser'); // Keep this for now, as the previous fix was to remove it.
    navigate('/login');
  };

  const selectedBudget = data.budgetingList.find(item => item.id === selectedBudgetId);

  // Derived color classes for each panel
  const incomeColors = getDerivedColorClasses(globalSettings.colors.income || "green-100");
  const budgetedColors = getDerivedColorClasses(globalSettings.colors.budgeted_expenses || "orange-100");
  const spendingColors = getDerivedColorClasses(globalSettings.colors.spending || "red-100");
  const savingsColors = getDerivedColorClasses(globalSettings.colors.savings || "blue-100");

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('appName')}</h1>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700">{t('year')}:</span>
                <Input
                  type="number"
                  value={globalSettings.currentYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-20 h-8 text-sm"
                />
              </div>
              
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700">{t('month')}:</span>
                <Select value={globalSettings.currentMonth} onValueChange={handleMonthChange}>
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
                  <div className={`text-sm font-medium ${spendingColors.textColor}`}>{t('spending', { month: globalSettings.currentMonth })}</div>
                  <div className={`text-xl font-bold ${spendingColors.textColor}`}>{formatCurrency(totalSpending)}</div>
                </CardContent>
              </Card>
              
              <Card className={`${savingsColors.bgColor} ${savingsColors.borderColor} border`}>
                <CardContent className="p-4">
                  <div className={`text-sm font-medium ${savingsColors.textColor}`}>{t('savings', { month: globalSettings.currentMonth })}</div>
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
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {t('copyPrevMonthDesc')}
              </p>
              <Button onClick={handleCopyFromPreviousMonth} className="bg-blue-600 hover:bg-blue-700 text-white">
                {t('copyPrevMonthButton')}
              </Button>
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
                          onChange={(e) => setNewIncome({...newIncome, name: e.target.value})}
                          placeholder="e.g., Gaji Bulanan"
                        />
                      </div>
                      <div>
                        <Label htmlFor="incomeAmount">{t('amount')} (Rp)</Label>
                        <Input
                          id="incomeAmount"
                          type="number"
                          value={newIncome.amount}
                          onChange={(e) => setNewIncome({...newIncome, amount: e.target.value})}
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
                      {data.incomeSources.map((income) => (
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
                          onChange={(e) => setNewSaving({...newSaving, name: e.target.value})}
                          placeholder="e.g., Dana Darurat"
                        />
                      </div>
                      <div>
                        <Label htmlFor="savingAmount">{t('amount')} (Rp)</Label>
                        <Input
                          id="savingAmount"
                          type="number"
                          value={newSaving.amount}
                          onChange={(e) => setNewSaving({...newSaving, amount: e.target.value})}
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
                      {data.savingList.map((saving) => (
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('expensesList')}</CardTitle>
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
                          onChange={(e) => setNewBudget({...newBudget, name: e.target.value})}
                          placeholder="e.g., Zakat Wajib"
                        />
                      </div>
                      <div>
                        <Label htmlFor="budgetAllocation">{t('allocation')} (Rp)</Label>
                        <Input
                          id="budgetAllocation"
                          type="number"
                          value={newBudget.allocation}
                          onChange={(e) => setNewBudget({...newBudget, allocation: e.target.value})}
                          placeholder="e.g., 325000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="budgetCategory">{t('category')}</Label>
                        <Select value={newBudget.category} onValueChange={(value) => setNewBudget({...newBudget, category: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {globalSettings.categories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddBudget} className="w-full">{t('addBudgetItem')}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
                      {data.budgetingList.map((budget) => {
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