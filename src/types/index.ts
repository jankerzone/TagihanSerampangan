// Financial Data Types
export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
}

export interface Saving {
  id: string;
  name: string;
  amount: number;
}

export interface BudgetItem {
  id: string;
  name: string;
  allocation: number;
  realization: number;
  category: string;
}

export interface FinancialData {
  incomeSources: IncomeSource[];
  savingList: Saving[];
  budgetingList: BudgetItem[];
}

// Settings Types
export interface ColorSettings {
  income: string;
  budgeted_expenses: string;
  spending: string;
  savings: string;
}

export interface GlobalSettings {
  categories: string[];
  colors: ColorSettings;
  lang: 'en' | 'id';
}

// Savings Goal Types
export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  color?: string;
}

export interface SavingsContribution {
  id: string;
  savings_goal_id: string;
  goal_name: string;
  month_key: string;
  amount: number;
}
