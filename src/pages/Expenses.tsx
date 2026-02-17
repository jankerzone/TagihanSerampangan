import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from "@/lib/api";
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Loader2, 
  Search, 
  Trash2, 
  Calendar as CalendarIcon,
  Filter,
  ArrowLeft,
  Download,
  Upload
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { t } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { Badge } from "@/components/ui/badge";
import { EditableTextField } from "@/components/EditableTextField";
import { EditableCategoryCell } from "@/components/EditableCategoryCell";
import { EditableCell } from "@/components/EditableCell";

const Expenses = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    // Use the month names array from utils to match the backend format exactly
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    return `${now.getFullYear()}-${monthNames[now.getMonth()]}`;
  });

  // Fetch settings to get categories
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.getGlobal,
    initialData: { categories: ["Food", "Transport", "Utilities", "Shopping", "Entertainment", "Health", "Others"] }
  });

  // Fetch monthly data
  const { data: monthData, isLoading } = useQuery({
    queryKey: ['monthData', selectedMonth],
    queryFn: () => api.data.getMonthData(selectedMonth),
  });

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: async ({ expenseId, field, value }: { expenseId: string; field: string; value: any }) => {
      return api.request(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthData', selectedMonth] });
      showSuccess('Expense updated');
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update expense');
    }
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      // We need a specific endpoint to delete a single expense
      // Currently using a workaround or we need to add DELETE /api/expenses/:id
      // For now, let's assume we implement this endpoint in the worker
      return api.request(`/api/expenses/${expenseId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthData', selectedMonth] });
      showSuccess('Expense deleted');
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to delete expense');
    }
  });

  // Bulk save mutation (for import)
  const saveDataMutation = useMutation({
    mutationFn: (newData: any) => api.data.saveMonthData(selectedMonth, newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthData', selectedMonth] });
      showSuccess('Data imported successfully');
    },
    onError: (error: any) => {
      showError(error.message || "Failed to save data");
    }
  });

  const allExpenses = useMemo(() => {
    if (!monthData?.expenses) return [];
    
    // Sort by date (newest first)
    return [...monthData.expenses].sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [monthData]);

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((expense: any) => {
      const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allExpenses, searchQuery, categoryFilter]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0);
  }, [filteredExpenses]);

  // Export Expenses
  const handleExportExpenses = () => {
    try {
      const exportData = {
        incomeSources: monthData?.incomeSources || [],
        savingList: monthData?.savingList || [],
        budgetingList: monthData?.budgetingList || [],
        expenses: monthData?.expenses || [],
        exportDate: new Date().toISOString(),
        monthKey: selectedMonth
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `expenses-${selectedMonth}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess("Expenses exported successfully!");
    } catch (error) {
      showError("Failed to export expenses");
      console.error("Export error:", error);
    }
  };

  const handleImportExpenses = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Importing will REPLACE all data for ${selectedMonth}. Continue?`)) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);

        // Initial prep with fallback to existing data if missing in file
        const importData = {
          incomeSources: parsedData.incomeSources || monthData?.incomeSources || [],
          savingList: parsedData.savingList || monthData?.savingList || [],
          budgetingList: parsedData.budgetingList || monthData?.budgetingList || [],
          expenses: (parsedData.expenses && Array.isArray(parsedData.expenses)) 
            ? parsedData.expenses.map((item: any) => ({
                ...item,
                id: item.id || `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                month_key: selectedMonth
              }))
            : (monthData?.expenses || [])
        };

        // If the file explicitly lacks expenses but we have them, confirm with user
        if (!parsedData.expenses && monthData?.expenses?.length > 0) {
           if (!window.confirm("The imported file contains no expense data. Do you want to KEEP your existing expenses? (Cancel will DELETE them)")) {
              importData.expenses = [];
           }
        }

        saveDataMutation.mutate(importData);
      } catch (error: any) {
        showError(`Failed to read file: ${error.message}`);
        console.error("Import error:", error);
      }
    };
    
    reader.onerror = () => {
      showError("Failed to read file");
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${monthNames[d.getMonth()]}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      options.push({ value, label });
    }
    return options;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md transition-all">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t('backToDashboard')}</span>
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Daily Expenses
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExportExpenses}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportExpenses}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
            </div>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        {/* Filters & Summary */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search expenses..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {settings?.categories?.map((cat: string) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Total:</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Rp {totalFilteredAmount.toLocaleString('id-ID')}
            </span>
            <Badge variant="secondary" className="ml-2">
              {filteredExpenses.length} items
            </Badge>
          </div>
        </div>

        {/* Expenses List */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-dashed">
                <p className="text-gray-500">No expenses found for this period.</p>
              </div>
            ) : (
              <div className="rounded-md border bg-white dark:bg-gray-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                    <TableRow>
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense: any) => (
                      <TableRow key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell className="font-medium">
                          {format(new Date(expense.date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <EditableTextField
                            value={expense.description}
                            onSave={async (value) => {
                              await updateExpenseMutation.mutateAsync({
                                expenseId: expense.id,
                                field: 'description',
                                value
                              });
                            }}
                            placeholder="Enter description"
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCategoryCell
                            value={expense.category}
                            categories={settings?.categories || []}
                            onSave={async (value) => {
                              await updateExpenseMutation.mutateAsync({
                                expenseId: expense.id,
                                field: 'category',
                                value
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {expense.source === 'telegram' ? (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              Telegram
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-500">Manual</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <EditableCell
                            value={expense.amount}
                            onSave={async (value) => {
                              await updateExpenseMutation.mutateAsync({
                                expenseId: expense.id,
                                field: 'amount',
                                value
                              });
                            }}
                            type="currency"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if(window.confirm('Delete this expense?')) {
                                deleteExpenseMutation.mutate(expense.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Expenses;
