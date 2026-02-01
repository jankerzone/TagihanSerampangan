"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Edit, Check, X, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  monthNames,
  t
} from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from "@/lib/api";

const Settings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Fetch Global Settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.getGlobal,
    initialData: {
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().toLocaleString('default', { month: 'long' }),
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

  // Mutation to save settings
  const saveSettingsMutation = useMutation({
    mutationFn: (newSettings: any) => api.settings.saveGlobal(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      showSuccess(t('saveYearMonth')); // Generic success for save
    },
    onError: (error: any) => {
      showError(error.message || "Failed to save settings");
    }
  });

  // Mutation to generate Telegram link code
  const generateCodeMutation = useMutation({
    mutationFn: api.telegram.generateLinkCode,
    onSuccess: (data: any) => {
      setTelegramCode(data.code);
      setCodeExpiresAt(data.expires_at);
      showSuccess('Link code generated!');
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to generate code');
    }
  });

  // Countdown timer for code expiration
  useEffect(() => {
    if (!codeExpiresAt) {
      setTimeRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(codeExpiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      
      setTimeRemaining(diff);
      
      if (diff === 0) {
        setTelegramCode(null);
        setCodeExpiresAt(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [codeExpiresAt]);

  // Helper to update settings
  const updateSettings = (newSettings: any) => {
    saveSettingsMutation.mutate(newSettings);
  };

  const handleSaveYearMonth = () => {
    // Already handled by onChange in inputs calling updateSettings, but we can keep the button for explicit save feel
    // or just show a toast.
    showSuccess(t('saveYearMonth'));
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      const updatedSettings = {
        ...settings,
        categories: [...settings.categories, newCategory.trim()]
      };
      updateSettings(updatedSettings);
      setNewCategory('');
      showSuccess(t('categoryAdded'));
    } else if (!newCategory.trim()) {
      showError(t('requiredFields'));
    }
  };

  const handleStartEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditCategoryValue(category);
  };

  const handleSaveEditCategory = () => {
    if (editingCategory && editCategoryValue.trim()) {
      const updatedSettings = {
        ...settings,
        categories: settings.categories.map((cat: string) =>
          cat === editingCategory ? editCategoryValue.trim() : cat
        )
      };
      updateSettings(updatedSettings);
      setEditingCategory(null);
      setEditCategoryValue('');
      showSuccess(t('categoryUpdated'));
    } else if (!editCategoryValue.trim()) {
      showError(t('requiredFields'));
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryValue('');
  };

  const handleDeleteCategory = (category: string) => {
    if (window.confirm(t('areYouSureDeleteCategory', { category }))) {
      const updatedSettings = {
        ...settings,
        categories: settings.categories.filter((cat: string) => cat !== category)
      };
      updateSettings(updatedSettings);
      showSuccess(t('categoryDeleted'));
    }
  };

  const handleLanguageChange = (lang: string) => {
    const updatedSettings = { ...settings, lang };
    updateSettings(updatedSettings);
  };

  // Simple color palette with actual color names
  const colorPalette = [
    { value: 'green-100', name: 'Green', class: 'bg-green-200' },
    { value: 'blue-100', name: 'Blue', class: 'bg-blue-200' },
    { value: 'orange-100', name: 'Orange', class: 'bg-orange-200' },
    { value: 'red-100', name: 'Red', class: 'bg-red-200' },
    { value: 'purple-100', name: 'Purple', class: 'bg-purple-200' },
    { value: 'yellow-100', name: 'Yellow', class: 'bg-yellow-200' },
    { value: 'pink-100', name: 'Pink', class: 'bg-pink-200' },
    { value: 'teal-100', name: 'Teal', class: 'bg-teal-200' },
    { value: 'indigo-100', name: 'Indigo', class: 'bg-indigo-200' },
    { value: 'cyan-100', name: 'Cyan', class: 'bg-cyan-200' },
  ];

  const colorLabels = {
    income: 'Total Income',
    savings: 'Planned Savings', 
    budgeted_expenses: 'Available to Spend',
    spending: 'Actual Spending'
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t('backToDashboard')}
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('settings')} ⚙️</h1>
          </div>
        </div>

        {/* Year & Month Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('yearMonthSettings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">{t('year')}</Label>
                <Input
                  id="year"
                  type="number"
                  value={settings.currentYear}
                  onChange={(e) => updateSettings({ ...settings, currentYear: parseInt(e.target.value) || 2025 })}
                />
              </div>
              <div>
                <Label htmlFor="month">{t('month')}</Label>
                <Select
                  value={settings.currentMonth}
                  onValueChange={(value) => updateSettings({ ...settings, currentMonth: value })}
                >
                  <SelectTrigger>
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
            {/* Removed redundant save button as we save on change now, or we can keep it but it does nothing extra */}
          </CardContent>
        </Card>

        {/* Categories Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('expenseCategories')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="newCategory">{t('addNewCategory')}</Label>
              <div className="flex gap-2">
                <Input
                  id="newCategory"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={t('enterNewCategory')}
                />
                <Button onClick={handleAddCategory}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('currentCategories')}</Label>
              {settings.categories.map((category: string) => (
                <div key={category} className="flex items-center justify-between p-2 border rounded">
                  {editingCategory === category ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editCategoryValue}
                        onChange={(e) => setEditCategoryValue(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleSaveEditCategory}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEditCategory}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span>{category}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEditCategory(category)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Telegram Bot Integration */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-300">Link Telegram Bot</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect your Telegram account to track expenses on-the-go
            </p>
          </CardHeader>
          <CardContent>
            {!telegramCode ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Generate a code to link your Telegram account with TagihanSerampangan bot.
                </p>
                <Button 
                  onClick={() => generateCodeMutation.mutate()} 
                  disabled={generateCodeMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {generateCodeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Link Code'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border-2 border-blue-300 dark:border-blue-600">
                  <div className="text-center space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Your Link Code:</div>
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                      {telegramCode}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      Expires in: <span className="font-semibold">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-100 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">How to link:</div>
                  <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                    <li>Open Telegram and search for your TagihanSerampangan bot</li>
                    <li>Send this command: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">/link {telegramCode}</code></li>
                    <li>Bot will confirm the link!</li>
                  </ol>
                </div>

                <Button 
                  variant="outline"
                  onClick={() => {
                    setTelegramCode(null);
                    setCodeExpiresAt(null);
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Colors Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('dashboardColors')}</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">Choose colors for each card in Monthly Report</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(settings.colors).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-base font-semibold">{colorLabels[key as keyof typeof colorLabels]}</Label>
                  <div className="grid grid-cols-5 gap-3">
                    {colorPalette.map(color => (
                      <button
                        key={color.value}
                        onClick={() => {
                          updateSettings({
                            ...settings,
                            colors: { ...settings.colors, [key]: color.value }
                          });
                        }}
                        className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                          value === color.value 
                            ? 'border-black dark:border-white ring-2 ring-offset-2 ring-black dark:ring-white' 
                            : 'border-gray-300 dark:border-gray-600'
                        } ${color.class}`}
                      >
                        <div className="text-xs font-medium text-gray-800 dark:text-gray-900">{color.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('language')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.lang}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('english')}</SelectItem>
                <SelectItem value="id">{t('bahasaIndonesia')}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;