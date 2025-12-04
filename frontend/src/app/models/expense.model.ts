export interface Expense {
  id?: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_method?: string;
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export const EXPENSE_CATEGORIES = [
  'Rent',
  'Utilities',
  'Salaries',
  'Inventory Purchase',
  'Transportation',
  'Marketing',
  'Maintenance',
  'Office Supplies',
  'Taxes',
  'Insurance',
  'Miscellaneous'
];
