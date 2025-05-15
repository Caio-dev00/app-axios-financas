import { isAxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import supabaseClient from './lib/supabase';

export type Transaction = {
	id?: string;
	title: string;
	amount: number;
	type: "income" | "expense";
	category: string;
	date: string;
	user_id?: string;
	description?: string;
	source?: string;
	notes?: string;
	is_recurring?: boolean;
};

export interface IncomeTransaction {
	id?: string;
	description: string;
	amount: number;
	source: string;
	date: string;
	is_recurring?: boolean;
	created_at?: string;
	user_id?: string;
	type: 'income';
}

export interface ExpenseTransaction {
	id?: string;
	description: string;
	amount: number;
	category: string;
	date: string;
	notes?: string;
	is_recurring?: boolean;
	created_at?: string;
	user_id?: string;
	type: 'expense';
}

export interface UserProfile {
  id: string;
  nome?: string;
  phone?: string;
  avatar_url?: string;
  is_pro?: boolean;
  created_at?: string;
  telefone?: string;
}

export const getToken = async () => {
  const token = await SecureStore.getItemAsync("supabase_token");
  if (!token) {
    throw new Error("No authentication token found");
  }
  return token;
};

export const getUserId = async (): Promise<string | null> => {
	const user = await getUser();
	return user?.id ?? null;
};

function handleTransactionError(error: unknown): never {
  console.error('Transaction error:', error);
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
    if (axiosError.response?.status === 404) {
      throw new Error('Transação não encontrada.');
    }
    if (axiosError.response?.status === 422) {
      throw new Error('Dados inválidos. Verifique os campos e tente novamente.');
    }
  }
  throw new Error('Erro ao processar a transação. Tente novamente.');
}

export const getTransacoes = async (): Promise<Transaction[]> => {
  try {
    const token = await SecureStore.getItemAsync('supabase_token');
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const user = await getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const [incomesRes, expensesRes] = await Promise.all([
      supabaseClient.get('/rest/v1/incomes', {
        params: { 
          select: '*',
          user_id: `eq.${user.id}`
        },
      }),
      supabaseClient.get('/rest/v1/expenses', {
        params: { 
          select: '*',
          user_id: `eq.${user.id}`
        },
      }),
    ]);

    const incomes = incomesRes.data.map((t: any) => ({
      ...t,
      title: t.description,
      type: 'income' as const,
    }));

    const expenses = expensesRes.data.map((t: any) => ({
      ...t,
      title: t.description,
      type: 'expense' as const,
    }));

    return [...incomes, ...expenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    handleTransactionError(error);
  }
};

export const addTransacao = async (
  transacao: Omit<Transaction, "id" | "user_id"> & {
    source?: string;
    notes?: string;
    is_recurring?: boolean;
  }
): Promise<Transaction> => {
  try {
    // Validações
    if (!transacao.title?.trim()) throw new Error("Título é obrigatório");
    if (!transacao.amount || transacao.amount <= 0) throw new Error("Valor inválido");
    if (!transacao.date?.trim()) throw new Error("Data é obrigatória");
    if (transacao.type === "income" && !transacao.source?.trim())
      throw new Error("Origem é obrigatória");
    if (transacao.type === "expense" && !transacao.category?.trim())
      throw new Error("Categoria é obrigatória");

    const table = transacao.type === "expense" ? "expenses" : "incomes";
    const payload = {
      description: transacao.title,
      amount: transacao.amount,
      date: transacao.date,
      is_recurring: transacao.is_recurring || false,
      ...(transacao.type === "expense"
        ? { category: transacao.category, notes: transacao.notes }
        : { source: transacao.source }),
    };

    const { data } = await supabaseClient.post(`/rest/v1/${table}`, [payload], {
      headers: { 'Prefer': 'return=representation' },
    });

    return {
      ...data[0],
      type: transacao.type,
      title: data[0].description,
    };
  } catch (error) {
    handleTransactionError(error);
  }
};

export const updateTransacao = async (
  id: string,
  transacao: Partial<Transaction> & {
    source?: string;
    notes?: string;
    is_recurring?: boolean;
  }
): Promise<Transaction> => {
  try {
    // Validações
    if (transacao.title !== undefined && !transacao.title.trim()) {
      throw new Error("Título é obrigatório");
    }
    if (transacao.amount !== undefined && transacao.amount <= 0) {
      throw new Error("Valor inválido");
    }
    if (transacao.date !== undefined && !transacao.date.trim()) {
      throw new Error("Data é obrigatória");
    }

    const table = transacao.type === "expense" ? "expenses" : "incomes";
    const payload = {
      ...(transacao.title && { description: transacao.title }),
      ...(transacao.amount && { amount: transacao.amount }),
      ...(transacao.date && { date: transacao.date }),
      ...(transacao.is_recurring !== undefined && { is_recurring: transacao.is_recurring }),
      ...(transacao.type === "expense"
        ? {
            ...(transacao.category && { category: transacao.category }),
            ...(transacao.notes && { notes: transacao.notes }),
          }
        : {
            ...(transacao.source && { source: transacao.source }),
          }),
    };

    const { data } = await supabaseClient.patch(`/rest/v1/${table}?id=eq.${id}`, payload, {
      headers: { 'Prefer': 'return=representation' },
    });

    return {
      ...data[0],
      type: transacao.type || (table === 'expenses' ? 'expense' : 'income'),
      title: data[0].description,
    };
  } catch (error) {
    handleTransactionError(error);
  }
};

export const deleteTransacao = async (id: string, type: "income" | "expense"): Promise<void> => {
  try {
    const table = type === "expense" ? "expenses" : "incomes";
    await supabaseClient.delete(`/rest/v1/${table}?id=eq.${id}`);
  } catch (error) {
    handleTransactionError(error);
  }
};

// Utility function to validate token
async function validateToken(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync('supabase_token');
    return !!token;
  } catch {
    return false;
  }
}

export async function getUser() {
  try {
    const hasToken = await validateToken();
    if (!hasToken) {
      throw new Error('Usuário não autenticado');
    }

    const { data } = await supabaseClient.get('/auth/v1/user');
    if (!data) {
      throw new Error('Usuário não encontrado');
    }
    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        await Promise.all([
          SecureStore.deleteItemAsync('supabase_token'),
          SecureStore.deleteItemAsync('supabase_refresh_token')
        ]);
      }
    }
    throw new Error('Usuário não autenticado');
  }
}

export const getProfile = async (): Promise<UserProfile | null> => {
  try {
    const user = await getUser();
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const response = await supabaseClient.get(`/rest/v1/profiles`, {
      params: {
        select: '*',
        id: `eq.${user.id}`
      }
    });

    if (response.data?.[0]) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw new Error('Erro ao buscar perfil');
  }
};

export const updateProfile = async (profile: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const user = await getUser();
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const response = await supabaseClient.patch(`/rest/v1/profiles`, profile, {
      params: {
        id: `eq.${user.id}`
      }
    });

    if (response.data?.[0]) {
      return response.data[0];
    }
    throw new Error('Erro ao atualizar perfil');
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Erro ao atualizar perfil');
  }
};

export const getSubscription = async (): Promise<{isPro: boolean, daysLeft: number | null}> => {
  try {
    const user = await getUser();
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const response = await supabaseClient.get(`/rest/v1/user_subscriptions`, {
      params: {
        select: '*',
        user_id: `eq.${user.id}`,
        is_active: 'eq.true'
      }
    });

    if (response.data?.[0]) {
      const subscription = response.data[0];
      const endDate = new Date(subscription.end_date);
      const now = new Date();
      const diffTime = Math.abs(endDate.getTime() - now.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        isPro: subscription.plan_type === 'pro',
        daysLeft: diffDays
      };
    }

    return {
      isPro: false,
      daysLeft: null
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return {
      isPro: false,
      daysLeft: null
    };
  }
};
