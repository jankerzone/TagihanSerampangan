import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, AlertCircle } from 'lucide-react';

interface EditableCategoryCellProps {
  value: string;
  categories: string[];
  onSave: (value: string) => Promise<void>;
  getCategoryColor?: (category: string) => string;
}

export const EditableCategoryCell = ({
  value,
  categories,
  onSave,
  getCategoryColor = () => ''
}: EditableCategoryCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  // Check if category is uncategorized or doesn't exist in the categories list
  const isUncategorized = !value ||
                          value === '' ||
                          value.toLowerCase() === 'uncategorized' ||
                          value.toLowerCase() === 'others' ||
                          !categories.includes(value); // Category doesn't exist in valid list

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <Badge
        variant={isUncategorized ? "destructive" : "secondary"}
        className={`cursor-pointer transition-colors hover:opacity-80 gap-1 ${
          isUncategorized
            ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
            : getCategoryColor(value)
        }`}
        onClick={() => setIsEditing(true)}
      >
        {isUncategorized && <AlertCircle className="h-3 w-3" />}
        {value || 'Uncategorized'}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1" onKeyDown={handleKeyDown}>
      <Select 
        value={editValue} 
        onValueChange={(newValue) => {
          setEditValue(newValue);
          // Auto-save on select (immediate feedback)
          setIsSaving(true);
          onSave(newValue)
            .then(() => setIsEditing(false))
            .catch(() => setEditValue(value))
            .finally(() => setIsSaving(false));
        }}
        disabled={isSaving}
      >
        <SelectTrigger 
          className="h-8 text-xs"
          autoFocus
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-gray-500">
              No categories available
            </div>
          ) : (
            categories.map((category) => (
              <SelectItem
                key={category}
                value={category}
                className={getCategoryColor(category)}
              >
                {category}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      <button
        onClick={handleCancel}
        disabled={isSaving}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
        title="Cancel (ESC)"
      >
        <X className="h-3 w-3 text-gray-500" />
      </button>
    </div>
  );
};
