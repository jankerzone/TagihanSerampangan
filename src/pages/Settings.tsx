"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Edit, Check, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  loadGlobalSettings, 
  saveGlobalSettings, 
  getMonthKey,
  monthNames,
  monthNumbers,
  t
} from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(loadGlobalSettings());
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');

  // Save settings when they change
  useEffect(() => {
    saveGlobalSettings(settings);
  }, [settings]);

  const handleSaveYearMonth = () => {
    saveGlobalSettings(settings);
    showSuccess(t('saveYearMonth'));
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      setSettings(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }));
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
      setSettings(prev => ({
        ...prev,
        categories: prev.categories.map(cat => 
          cat === editingCategory ? editCategoryValue.trim() : cat
        )
      }));
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
      setSettings(prev => ({
        ...prev,
        categories: prev.categories.filter(cat => cat !== category)
      }));
      showSuccess(t('categoryDeleted'));
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSettings(prev => ({ ...prev, lang }));
    // No need to redirect, useEffect will save and dashboard will re-render
  };

  const colorOptions = [
    "green-100", "orange-100", "red-100", "blue-100",
    "green-200", "orange-200", "red-200", "blue-200",
    "purple-100", "yellow-100", "pink-100", "teal-100",
    "purple-200", "yellow-200", "pink-200", "teal-200",
  ];

  // Helper to get base color for text class
  const getBaseColor = (colorClass: string) => colorClass.split('-')[0];

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
                  onChange={(e) => setSettings(prev => ({ ...prev, currentYear: parseInt(e.target.value) || 2025 }))}
                />
              </div>
              <div>
                <Label htmlFor="month">{t('month')}</Label>
                <Select
                  value={settings.currentMonth}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, currentMonth: value }))}
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
            <Button onClick={handleSaveYearMonth} className="mt-4">
              {t('saveYearMonth')}
            </Button>
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
              {settings.categories.map((category) => (
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

        {/* Colors Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('dashboardColors')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(settings.colors).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={key}>{key.replace('_', ' ').toUpperCase()}</Label>
                  <Select
                    value={value}
                    onValueChange={(newValue) => setSettings(prev => ({
                      ...prev,
                      colors: { ...prev.colors, [key]: newValue }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(color => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded bg-${color}`}></div>
                            {color}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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