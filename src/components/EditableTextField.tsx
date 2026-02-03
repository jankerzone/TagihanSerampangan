import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useEditableField } from '@/hooks/use-editable-field';

interface EditableTextFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  displayClassName?: string;
}

export const EditableTextField = ({
  value,
  onSave,
  placeholder = 'Enter text',
  className = '',
  displayClassName = '',
}: EditableTextFieldProps) => {
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
    parseValue: (input) => input.trim(),
    formatValue: (val) => val,
    validateBeforeSave: (newVal, oldVal) => newVal !== oldVal && newVal !== '',
  });

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          className="h-8"
          disabled={isSaving}
        />
        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
      </div>
    );
  }

  return (
    <div
      onClick={startEditing}
      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors ${displayClassName}`}
      title="Click to edit"
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </div>
  );
};
