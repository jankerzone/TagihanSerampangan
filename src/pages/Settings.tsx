import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Edit, Check, X, Loader2, Copy, Unlink, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  monthNames,
  t
} from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
  const queryClient = useQueryClient();
  const { currentUser, updateUser, refreshUser } = useAuth();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

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

  // Mutation to unlink Telegram account
  const unlinkTelegramMutation = useMutation({
    mutationFn: (telegramId: number) => api.telegram.unlinkAccount(telegramId),
    onSuccess: () => {
      refreshUser(); // Refresh user data to update the list
      showSuccess('Device unlinked!');
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to unlink account');
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

  // Modern color palette with gradients and better organization
  const colorPalette = [
    { value: 'green-100', name: 'Emerald', from: 'from-emerald-400', to: 'to-green-600', preview: 'bg-gradient-to-br from-emerald-50 to-green-100' },
    { value: 'blue-100', name: 'Sky', from: 'from-blue-400', to: 'to-cyan-600', preview: 'bg-gradient-to-br from-blue-50 to-cyan-100' },
    { value: 'purple-100', name: 'Purple', from: 'from-purple-400', to: 'to-indigo-600', preview: 'bg-gradient-to-br from-purple-50 to-indigo-100' },
    { value: 'orange-100', name: 'Orange', from: 'from-orange-400', to: 'to-amber-600', preview: 'bg-gradient-to-br from-orange-50 to-amber-100' },
    { value: 'red-100', name: 'Rose', from: 'from-red-400', to: 'to-rose-600', preview: 'bg-gradient-to-br from-red-50 to-rose-100' },
    { value: 'pink-100', name: 'Pink', from: 'from-pink-400', to: 'to-fuchsia-600', preview: 'bg-gradient-to-br from-pink-50 to-fuchsia-100' },
    { value: 'yellow-100', name: 'Amber', from: 'from-yellow-400', to: 'to-amber-500', preview: 'bg-gradient-to-br from-yellow-50 to-amber-100' },
    { value: 'teal-100', name: 'Teal', from: 'from-teal-400', to: 'to-cyan-600', preview: 'bg-gradient-to-br from-teal-50 to-cyan-100' },
    { value: 'indigo-100', name: 'Indigo', from: 'from-indigo-400', to: 'to-blue-600', preview: 'bg-gradient-to-br from-indigo-50 to-blue-100' },
    { value: 'cyan-100', name: 'Cyan', from: 'from-cyan-400', to: 'to-teal-500', preview: 'bg-gradient-to-br from-cyan-50 to-teal-100' },
  ];

  const colorLabels = {
    income: 'Total Income',
    savings: 'Planned Savings', 
    budgeted_expenses: 'Available to Spend',
    spending: 'Total Spending'
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md transition-all">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t('backToDashboard')}</span>
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('settings')}
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-8">

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
            {/* Linked Devices List */}
            {currentUser?.linkedDevices && currentUser.linkedDevices.length > 0 && (
              <div className="mb-6 bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Telegram ID</TableHead>
                      <TableHead>Linked Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentUser.linkedDevices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell>
                          <div className="font-medium">{device.first_name || 'Unknown'}</div>
                          {device.telegram_username && (
                            <div className="text-xs text-gray-500">@{device.telegram_username}</div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{device.telegram_user_id}</TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {new Date(device.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to unlink this device?')) {
                                unlinkTelegramMutation.mutate(device.id);
                              }
                            }}
                            disabled={unlinkTelegramMutation.isPending}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
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

            {!telegramCode ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Generate a code to link a new Telegram account. You can link multiple accounts.
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
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Link Code
                    </>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`/link ${telegramCode}`);
                        showSuccess('Copied /link command to clipboard!');
                      }}
                      className="mt-2"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy /link {telegramCode}
                    </Button>
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

        {/* Colors Settings - Modern Color Picker */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('dashboardColors')}</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">Choose colors for each card in Monthly Report</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {Object.entries(settings.colors).map(([key, value]) => (
                <div key={key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">{colorLabels[key as keyof typeof colorLabels]}</Label>
                    <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{colorPalette.find(c => c.value === value)?.name || value}</span>
                  </div>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                    {colorPalette.map(color => (
                      <button
                        key={color.value}
                        onClick={() => {
                          updateSettings({
                            ...settings,
                            colors: { ...settings.colors, [key]: color.value }
                          });
                        }}
                        className={`group relative aspect-square rounded-xl transition-all duration-300 ${color.preview} ${
                          value === color.value 
                            ? 'ring-4 ring-gray-900 dark:ring-white ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900 scale-110 shadow-xl' 
                            : 'hover:scale-105 hover:shadow-lg'
                        }`}
                        title={color.name}
                      >
                        {value === color.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="h-5 w-5 text-gray-900 dark:text-white drop-shadow-lg" />
                          </div>
                        )}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium whitespace-nowrap bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-2 py-1 rounded">
                          {color.name}
                        </div>
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