import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import type { Transaction } from './supabaseClient';
import { addTransacao, deleteTransacao, getTransacoes, updateTransacao } from './supabaseClient';

interface TransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  lastSuccessfulFetch: Date | null;
}

interface TransactionsContextProps extends Omit<TransactionsState, 'lastSuccessfulFetch'> {
  fetchTransactions: () => Promise<void>;
  add: (data: Omit<Transaction, "id" | "user_id">) => Promise<void>;
  edit: (id: string, data: Partial<Transaction>) => Promise<void>;
  remove: (id: string, type: 'income' | 'expense') => Promise<void>;
  clearError: () => void;
}

const TransactionsContext = createContext<TransactionsContextProps | undefined>(undefined);

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<TransactionsState>({
    transactions: [],
    loading: false,
    error: null,
    lastSuccessfulFetch: null
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, transactions: [], loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await getTransacoes();
      setState(prev => ({ 
        ...prev, 
        transactions: data, 
        loading: false,
        lastSuccessfulFetch: new Date(),
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar transações'
      }));
    }
  }, [user]);

  // Recarrega os dados quando o usuário muda
  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setState(prev => ({ ...prev, transactions: [], loading: false }));
    }
  }, [user, fetchTransactions]);

  // Recarrega os dados a cada 5 minutos se houver um usuário logado
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(fetchTransactions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, fetchTransactions]);

  const add = useCallback(async (data: Omit<Transaction, "id" | "user_id">) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await addTransacao(data);
      await fetchTransactions();
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao adicionar transação'
      }));
      throw error;
    }
  }, [fetchTransactions]);

  const edit = useCallback(async (id: string, data: Partial<Transaction>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await updateTransacao(id, data);
      await fetchTransactions();
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar transação'
      }));
      throw error;
    }
  }, [fetchTransactions]);

  const remove = useCallback(async (id: string, type: 'income' | 'expense') => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await deleteTransacao(id, type);
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id),
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao excluir transação'
      }));
      throw error;
    }
  }, []);

  const value = {
    transactions: state.transactions,
    loading: state.loading,
    error: state.error,
    fetchTransactions,
    add,
    edit,
    remove,
    clearError
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
};

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
}