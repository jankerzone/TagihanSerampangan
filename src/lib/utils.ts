import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  const [year, monthNum] = key.split('-');
  const monthIndex = monthNumbers.indexOf(monthNum);
  return monthIndex >= 0 ? monthNames[monthIndex] : "January";
}

// Load global settings
export function loadGlobalSettings() {
  try {
    const settings = localStorage.getItem('tagihan_global_settings');
    return settings ? JSON.parse(settings) : {
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().toLocaleString('default', { month: 'long' }),
      categories: ["Zakat", "Pajak", "Keluarga", "Rumah", "Lainnya"],
      colors: {
        income: "green-100",
        budgeted_expenses: "green-100",
        spending: "green-100",
        savings: "green-100"
      }
    };
  } catch {
    return {
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().toLocaleString('default', { month: 'long' }),
      categories: ["Zakat", "Pajak", "Keluarga", "Rumah", "Lainnya"],
      colors: {
        income: "green-100",
        budgeted_expenses: "green-100",
        spending: "green-100",
        savings: "green-100"
      }
    };
  }
}

// Save global settings
export function saveGlobalSettings(settings: any) {
  localStorage.setItem('tagihan_global_settings', JSON.stringify(settings));
}

// Load month data
export function loadMonthData(key: string) {
  try {
    const allData = localStorage.getItem('tagihan_data');
    const data = allData ? JSON.parse(allData) : {};
    return data[key] || {
      incomeSources: [],
      savingList: [],
      budgetingList: []
    };
  } catch {
    return {
      incomeSources: [],
      savingList: [],
      budgetingList: []
    };
  }
}

// Save month data
export function saveMonthData(key: string, monthData: any) {
  try {
    const allData = localStorage.getItem('tagihan_data');
    const data = allData ? JSON.parse(allData) : {};
    data[key] = monthData;
    localStorage.setItem('tagihan_data', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving month data:', error);
  }
}

// Copy data from previous month
export function copyFromPreviousMonth(currentKey: string): boolean {
  try {
    const [currentYear, currentMonthNum] = currentKey.split('-');
    const currentYearNum = parseInt(currentYear);
    const currentMonthIndex = monthNumbers.indexOf(currentMonthNum);
    
    let prevYear = currentYearNum;
    let prevMonthIndex = currentMonthIndex - 1;
    
    if (prevMonthIndex < 0) {
      prevYear = currentYearNum - 1;
      prevMonthIndex = 11;
    }
    
    const prevKey = `${prevYear}-${monthNumbers[prevMonthIndex]}`;
    const prevData = loadMonthData(prevKey);
    
    if (prevData.incomeSources.length > 0 || prevData.savingList.length > 0 || prevData.budgetingList.length > 0) {
      // Create deep copy and reset realizations
      const newData = {
        incomeSources: JSON.parse(JSON.stringify(prevData.incomeSources)),
        savingList: JSON.parse(JSON.stringify(prevData.savingList)),
        budgetingList: prevData.budgetingList.map((item: any) => ({
          ...item,
          realization: 0
        }))
      };
      
      saveMonthData(currentKey, newData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error copying from previous month:', error);
    return false;
  }
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