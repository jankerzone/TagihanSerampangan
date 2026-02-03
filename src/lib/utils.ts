import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { translations } from './translations';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Month mapping
export const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const monthNumbers = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

// Get month key from year and month name
export function getMonthKey(year: number, monthName: string): string {
  const monthIndex = monthNames.indexOf(monthName);
  const monthNum = monthIndex >= 0 ? monthNumbers[monthIndex] : "01";
  return `${year}-${monthNum}`;
}

// Get month name from key
export function getMonthNameFromKey(key: string): string {
  const [, monthNum] = key.split('-');
  const monthIndex = monthNumbers.indexOf(monthNum);
  return monthIndex >= 0 ? monthNames[monthIndex] : "January";
}

// Format currency
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Translation helper
export function t(key: keyof typeof translations.en, vars?: { [key: string]: string | number }): string {
  // Try to get language from localStorage settings
  let lang = 'en';
  try {
    const settings = localStorage.getItem('settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      lang = parsed.lang || 'en';
    }
  } catch {
    // Default to English
  }
  
  let text = translations[lang as keyof typeof translations]?.[key] || translations.en[key] || key;

  if (vars) {
    for (const [varKey, varValue] of Object.entries(vars)) {
      text = text.replace(`{${varKey}}`, String(varValue));
    }
  }
  return text;
}
