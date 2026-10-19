// Category color mapping
export const categoryColors: Record<string, string> = {
  'Zakat': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
  'Pajak': 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  'Keluarga': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  'Rumah': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
  'Tagihan': 'bg-rose-100 text-rose-800 hover:bg-rose-200',
  'Lainnya': 'bg-slate-100 text-slate-800 hover:bg-slate-200',
};

export const getDefaultCategoryColor = (category: string) => {
  return categoryColors[category] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
};

// Default settings
export const DEFAULT_SETTINGS = {
  categories: ["Zakat", "Pajak", "Keluarga", "Rumah", "Lainnya"],
  colors: {
    income: "green-100",
    budgeted_expenses: "orange-100",
    spending: "red-100",
    savings: "blue-100"
  },
  lang: "en" as const
};

// Default financial data
export const DEFAULT_FINANCIAL_DATA = {
  incomeSources: [],
  savingList: [],
  budgetingList: []
};
