import React, { createContext, useCallback, useContext, useState } from 'react';
import { type Transaction, addTransacao, deleteTransacao, getTransacoes, updateTransacao } from './supabaseClient';

interface TransactionsContextProps {
  transactions: Transaction[];
  loading: boolean;
  fetchTransactions: () => Promise<void>;
  add: (data: any) => Promise<void>;
  edit: (id: string, data: any) => Promise<void>;
  remove: (id: string, type: 'income' | 'expense') => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextProps | undefined>(undefined);

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTransacoes();
      setTransactions(data);
    } catch {
      setTransactions([]);
    }
    setLoading(false);
  }, []);

  const add = async (data: any) => {
    await addTransacao(data);
    await fetchTransactions();
  };
  const edit = async (id: string, data: any) => {
    await updateTransacao(id, data);
    await fetchTransactions();
  };
  const remove = async (id: string, type: 'income' | 'expense') => {
    await deleteTransacao(id, type);
    await fetchTransactions();
  };

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <TransactionsContext.Provider value={{ transactions, loading, fetchTransactions, add, edit, remove }}>
      {children}
    </TransactionsContext.Provider>
  );
};

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions must be used within a TransactionsProvider');
  return ctx;
} 