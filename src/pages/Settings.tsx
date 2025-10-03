"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Edit, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  loadGlobalSettings, 
  saveGlobalSettings, 
  copyFromPreviousMonth, 
  getMonthKey,
  monthNames,
  monthNumbers
} from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";

const Settings = () => {
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
    showSuccess('Year and month settings saved!');
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      setSettings(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }));
      setNewCategory('');
      showSuccess('Category added!');
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
      showSuccess('Category updated!');
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryValue('');
  };

  const handleDeleteCategory = (category: string) => {
    if (window.confirm(`Are you sure you want to delete the category "${category}"?`)) {
      setSettings(prev => ({
        ...prev,
        categories: prev.categories.filter(cat => cat !== category)
      }));
      showSuccess('Category deleted!');
    }
  };

  const handleCopyFromPreviousMonth = () => {
    const currentKey = getMonthKey(settings.currentYear, settings.currentMonth);
    const success = copyFromPreviousMonth(currentKey);
    
    if (success) {
      showSuccess('Data copied from previous month successfully!');
    } else {
      showError('No data found in previous month.');
    }
  };

  const colorOptions = [
    "green-100", "green-200", "green-300",
    "blue-100", "blue-200", "blue-300",
    "red-100", "red-200", "red-300",
    "orange-100", "orange-200", "orange-300",
    "purple-100", "purple-200", "purple-300",
    "yellow-100", "yellow-200", "yellow-300"
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings ⚙️</h1>
          </div>
        </div>

        {/* Year & Month Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Year & Month Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={settings.currentYear}
                  onChange={(e) => setSettings(prev => ({ ...prev, currentYear: parseInt(e.target.value) || 2025 }))}
                />
              </div>
              <div>
                <Label htmlFor="month">Month</Label>
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
              Save Year & Month
            </Button>
          </CardContent>
        </Card>

        {/* Categories Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="newCategory">Add New Category</Label>
              <div className="flex gap-2">
                <Input
                  id="newCategory"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter new category"
                />
                <Button onClick={handleAddCategory}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Current Categories</Label>
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
            <CardTitle>Dashboard Colors</CardTitle>
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

        {/* Copy from Previous Month */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Copy data from the previous month to the current month. This will reset all realization amounts to 0.
              </p>
              <Button onClick={handleCopyFromPreviousMonth} variant="outline">
                Copy Data from Previous Month
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;