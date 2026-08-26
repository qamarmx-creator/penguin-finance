import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { type Transaction, type Category, DEFAULT_CATEGORIES, STORAGE_KEYS } from '@/types/finance';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  isLoading: boolean;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (c: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}

/** Convert image URI to base64 data URL for local persistence */
async function imageToBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }
  const base64 = await (FileSystem as any).readAsStringAsync(uri, { encoding: 'base64' });
  return `data:image/jpeg;base64,${base64}`;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const [txData, catData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
          AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES),
        ]);
        if (txData) setTransactions(JSON.parse(txData));
        if (catData) {
          const parsed = JSON.parse(catData) as Category[];
          // Merge with defaults: keep custom + ensure all defaults exist
          const defaultIds = DEFAULT_CATEGORIES.map(c => c.id);
          const merged = [...DEFAULT_CATEGORIES, ...parsed.filter(c => c.isCustom && !defaultIds.includes(c.id))];
          setCategories(merged);
        }
      } catch (e) {
        console.error('Failed to load finance data', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Persist transactions
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }
  }, [transactions, isLoading]);

  // Persist categories
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    }
  }, [categories, isLoading]);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    let imageBase64 = t.imageBase64;
    // If imageBase64 is actually a file URI (not a data URL), convert it
    if (imageBase64 && !imageBase64.startsWith('data:')) {
      imageBase64 = await imageToBase64(imageBase64);
    }
    const newTx: Transaction = {
      ...t,
      imageBase64,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setTransactions(prev => [newTx, ...prev]);
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    if (updates.imageBase64 && !updates.imageBase64.startsWith('data:')) {
      updates = { ...updates, imageBase64: await imageToBase64(updates.imageBase64) };
    }
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }, []);

  const addCategory = useCallback(async (c: Omit<Category, 'id'>) => {
    const newCat: Category = { ...c, id: `${c.type}_custom_${generateId()}` };
    setCategories(prev => [...prev, newCat]);
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, isLoading,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, deleteCategory,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}
