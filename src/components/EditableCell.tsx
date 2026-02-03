import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useEditableField } from '@/hooks/use-editable-field';

interface EditableCellProps {
  value: number;
  onSave: (value: number) => Promise<void>;
  formatDisplay?: (value: number) => string;
  type?: 'currency' | 'number';
  placeholder?: string;
  className?: string;
}

export const EditableCell = ({
  value,
  onSave,
  formatDisplay,
  type = 'currency',
  placeholder = '0',
  className = '',
}: EditableCellProps) => {
  const {
    isEditing,
    localValue,
    isSaving,
    inputRef,
    setLocalValue,
    startEditing,
    handleSave,
    handleKeyDown,
  } = useEditableField({
    value,
    onSave,
    parseValue: (input) => parseInt(input) || 0,
    formatValue: (val) => String(val),
    validateBeforeSave: (newVal, oldVal) => newVal !== oldVal,
  });

  const displayValue = formatDisplay
    ? formatDisplay(value)
    : type === 'currency'
    ? formatCurrency(value)
    : value.toString();

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
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
      onClick={startEditing}
      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors ${className}`}
      title="Click to edit"
    >
      {displayValue}
    </div>
  );
};
