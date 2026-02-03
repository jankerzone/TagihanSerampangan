import { useState, useEffect, useRef, useCallback } from 'react';

interface UseEditableFieldOptions<T> {
  value: T;
  onSave: (value: T) => Promise<void>;
  parseValue?: (input: string) => T;
  formatValue?: (value: T) => string;
  validateBeforeSave?: (value: T, originalValue: T) => boolean;
}

interface UseEditableFieldReturn<T> {
  isEditing: boolean;
  localValue: string;
  isSaving: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  setLocalValue: (value: string) => void;
  startEditing: () => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * A reusable hook for editable field logic.
 * Handles editing state, local value, save/cancel, and keyboard events.
 */
export function useEditableField<T>({
  value,
  onSave,
  parseValue = (input) => input as unknown as T,
  formatValue = (val) => String(val),
  validateBeforeSave = (newVal, oldVal) => newVal !== oldVal,
}: UseEditableFieldOptions<T>): UseEditableFieldReturn<T> {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(formatValue(value));
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus and select on edit start
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync local value when prop changes (from optimistic updates)
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(formatValue(value));
    }
  }, [value, isEditing, formatValue]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(async () => {
    const parsedValue = parseValue(localValue);

    // Don't save if validation fails (e.g., value unchanged)
    if (!validateBeforeSave(parsedValue, value)) {
      setLocalValue(formatValue(value));
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(parsedValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      // Revert to original value on error
      setLocalValue(formatValue(value));
    } finally {
      setIsSaving(false);
    }
  }, [localValue, value, onSave, parseValue, formatValue, validateBeforeSave]);

  const handleCancel = useCallback(() => {
    setLocalValue(formatValue(value));
    setIsEditing(false);
  }, [value, formatValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  return {
    isEditing,
    localValue,
    isSaving,
    inputRef,
    setLocalValue,
    startEditing,
    handleSave,
    handleCancel,
    handleKeyDown,
  };
}
