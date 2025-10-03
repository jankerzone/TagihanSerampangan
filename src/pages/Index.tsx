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
import { PlusCircle, Edit3, Trash2, Settings } from 'lucide-react';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { 
  getMonthKey, 
  loadGlobalSettings, 
  saveGlobalSettings, 
  loadMonthData, 
  saveMonthData, 
  formatCurrency,
  monthNames,
  monthNumbers
} from "@/lib/utils";
import { Link } from 'react-router-dom';

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

const Index = () => {
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

  // Load data when month/year changes
  useEffect(() => {
    const currentKey = getMonthKey(globalSettings.currentYear, globalSettings.currentMonth);
    const monthData = loadMonthData(currentKey);
    setData(monthData);
  }, [globalSettings.currentYear, globalSettings.currentMonth]);

  // Save global settings when they change
  useEffect(() => {
    saveGlobalSettings(globalSettings);
  }, [globalSettings]);

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">TagihanSerampangan 💰</h1>
            <Badge variant="secondary" className="text-sm">Money Management</Badge>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700">Year:</span>
                <Input
                  type="number"
                  value={globalSettings.currentYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-20 h-8 text-sm"
                />
              </div>
              
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700">Month:</span>
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
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Monthly Report */}
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <span>Monthly Report 📊</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className={`bg-${globalSettings.colors.income} border-green-300`}>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-green-800">Total Income</div>
                  <div className="text-xl font-bold text-green-900">{formatCurrency(totalIncome)}</div>
                </CardContent>
              </Card>
              
              <Card className={`bg-${globalSettings.colors.budgeted_expenses} border-green-300`}>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-green-800">Budgeted Expenses</div>
                  <div className="text-xl font-bold text-green-900">{formatCurrency(totalBudgetedExpenses)}</div>
                </CardContent>
              </Card>
              
              <Card className={`bg-${globalSettings.colors.spending} border-green-300`}>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-green-800">{globalSettings.currentMonth} Spending</div>
                  <div className="text-xl font-bold text-green-900">{formatCurrency(totalSpending)}</div>
                </CardContent>
              </Card>
              
              <Card className={`bg-${globalSettings.colors.savings} border-green-300`}>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-green-800">{globalSettings.currentMonth} Savings</div>
                  <div className="text-xl font-bold text-green-900">{formatCurrency(savings)}</div>
                </CardContent>
              </Card>
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
                <CardTitle>Income Sources</CardTitle>
                <Dialog open={isAddIncomeOpen} onOpenChange={setIsAddIncomeOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Income Source</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="incomeName">Name</Label>
                        <Input
                          id="incomeName"
                          value={newIncome.name}
                          onChange={(e) => setNewIncome({...newIncome, name: e.target.value})}
                          placeholder="e.g., Gaji Bulanan"
                        />
                      </div>
                      <div>
                        <Label htmlFor="incomeAmount">Amount (Rp)</Label>
                        <Input
                          id="incomeAmount"
                          type="number"
                          value={newIncome.amount}
                          onChange={(e) => setNewIncome({...newIncome, amount: e.target.value})}
                          placeholder="e.g., 10000000"
                        />
                      </div>
                      <Button onClick={handleAddIncome} className="w-full">Add Income</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {data.incomeSources.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No income sources yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="w-16">Actions</TableHead>
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
                <CardTitle>Savings</CardTitle>
                <Dialog open={isAddSavingOpen} onOpenChange={setIsAddSavingOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Saving</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="savingName">Name</Label>
                        <Input
                          id="savingName"
                          value={newSaving.name}
                          onChange={(e) => setNewSaving({...newSaving, name: e.target.value})}
                          placeholder="e.g., Dana Darurat"
                        />
                      </div>
                      <div>
                        <Label htmlFor="savingAmount">Amount (Rp)</Label>
                        <Input
                          id="savingAmount"
                          type="number"
                          value={newSaving.amount}
                          onChange={(e) => setNewSaving({...newSaving, amount: e.target.value})}
                          placeholder="e.g., 2000000"
                        />
                      </div>
                      <Button onClick={handleAddSaving} className="w-full">Add Saving</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {data.savingList.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No savings yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="w-16">Actions</TableHead>
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
                <CardTitle>Expenses List</CardTitle>
                <Dialog open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Budget Item</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="budgetName">Name</Label>
                        <Input
                          id="budgetName"
                          value={newBudget.name}
                          onChange={(e) => setNewBudget({...newBudget, name: e.target.value})}
                          placeholder="e.g., Zakat Wajib"
                        />
                      </div>
                      <div>
                        <Label htmlFor="budgetAllocation">Allocation (Rp)</Label>
                        <Input
                          id="budgetAllocation"
                          type="number"
                          value={newBudget.allocation}
                          onChange={(e) => setNewBudget({...newBudget, allocation: e.target.value})}
                          placeholder="e.g., 325000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="budgetCategory">Category</Label>
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
                      <Button onClick={handleAddBudget} className="w-full">Add Budget Item</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {data.budgetingList.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No expenses yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Allocation 💰</TableHead>
                        <TableHead className="text-right">Realization 💵</TableHead>
                        <TableHead>Budget Usage</TableHead>
                        <TableHead className="text-right">% Usage</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
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
              <DialogTitle>Edit Realization</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="realizationAmount">Realization Amount (Rp)</Label>
                <Input
                  id="realizationAmount"
                  type="number"
                  value={newRealization}
                  onChange={(e) => setNewRealization(e.target.value)}
                  placeholder="e.g., 325000"
                />
              </div>
              <Button onClick={handleEditRealization} className="w-full">Update Realization</Button>
            </div>
          </DialogContent>
        </Dialog>

        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;