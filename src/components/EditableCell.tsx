import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { Check, X, Loader2 } from 'lucide-react';

interface EditableCellProps {
  value: number;
  onSave: (value: number) => Promise<void>;
  formatDisplay?: (value: number) => string;
  type?: 'currency' | 'number';
  placeholder?: string;
  className?: string;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onSave,
  formatDisplay,
  type = 'currency',
  placeholder = '0',
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Update localValue when prop changes (from optimistic update)
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value.toString());
    }
  }, [value, isEditing]);

  const handleSave = async () => {
    const numValue = parseInt(localValue) || 0;
    
    // Don't save if value hasn't changed
    if (numValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(numValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      // Revert to original value on error
      setLocalValue(value.toString());
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const displayValue = formatDisplay
    ? formatDisplay(value)
    : type === 'currency'
    ? formatCurrency(value)
    : value.toString();

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Input
          ref={inputRef}
          type="number"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          className="h-8 text-right"
          disabled={isSaving}
        />
        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors ${className}`}
      title="Click to edit"
    >
      {displayValue}
    </div>
  );
};
