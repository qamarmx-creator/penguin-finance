export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  categoryId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
  imageBase64?: string; // data URL for local storage
  createdAt: string; // ISO string
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string; // Feather icon name
  isCustom: boolean;
}

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense
  { id: 'exp_food', name: '餐饮', type: 'expense', icon: 'coffee', isCustom: false },
  { id: 'exp_transport', name: '交通', type: 'expense', icon: 'navigation', isCustom: false },
  { id: 'exp_shopping', name: '购物', type: 'expense', icon: 'shopping-bag', isCustom: false },
  { id: 'exp_fun', name: '娱乐', type: 'expense', icon: 'music', isCustom: false },
  { id: 'exp_home', name: '居住', type: 'expense', icon: 'home', isCustom: false },
  { id: 'exp_medical', name: '医疗', type: 'expense', icon: 'heart', isCustom: false },
  { id: 'exp_edu', name: '教育', type: 'expense', icon: 'book-open', isCustom: false },
  { id: 'exp_comm', name: '通讯', type: 'expense', icon: 'smartphone', isCustom: false },
  { id: 'exp_other', name: '其他', type: 'expense', icon: 'more-horizontal', isCustom: false },
  // Income
  { id: 'inc_salary', name: '工资', type: 'income', icon: 'briefcase', isCustom: false },
  { id: 'inc_parttime', name: '兼职', type: 'income', icon: 'clock', isCustom: false },
  { id: 'inc_invest', name: '理财', type: 'income', icon: 'trending-up', isCustom: false },
  { id: 'inc_other', name: '其他', type: 'income', icon: 'more-horizontal', isCustom: false },
];

export const STORAGE_KEYS = {
  TRANSACTIONS: '@finance_transactions',
  CATEGORIES: '@finance_categories',
};
