import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X } from 'lucide-react';

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
  const selectRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    if (editValue === value || !editValue) {
      setIsEditing(false);
      setEditValue(value);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      setEditValue(value); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

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
        variant="secondary"
        className={`cursor-pointer transition-colors hover:opacity-80 ${getCategoryColor(value)}`}
        onClick={() => setIsEditing(true)}
      >
        {value}
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
          ref={selectRef}
          className="h-8 text-xs"
          autoFocus
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem 
              key={category} 
              value={category}
              className={getCategoryColor(category)}
            >
              {category}
            </SelectItem>
          ))}
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
