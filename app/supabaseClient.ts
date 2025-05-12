import axios from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

const supabaseUrl = "https://yascliotrmqhvqbvrhsc.supabase.co";
const supabaseAnonKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc2NsaW90cm1xaHZxYnZyaHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTA3NjksImV4cCI6MjA2MTUyNjc2OX0.Yh2Ebi1n6CPx2mVERHfA7G5w_kaF6_p7OImAF3qRj8o";
export type Transaction = {
	id?: string;
	title: string;
	amount: number;
	type: "income" | "expense";
	category: string;
	date: string;
	user_id?: string;
};

export const getToken = async () => {
	return await SecureStore.getItemAsync("supabase_token");
};

export const getUserId = async (): Promise<string | null> => {
	const user = await getUser();
	return user?.id ?? null;
};

export const getTransacoes = async (): Promise<Transaction[]> => {
	const token = await getToken();
	const userId = await getUserId();
	if (!userId) return [];
	// Buscar receitas e despesas separadamente e unir os resultados
	const [incomesRes, expensesRes] = await Promise.all([
		axios.get(`${supabaseUrl}/rest/v1/incomes?user_id=eq.${userId}`, {
			headers: {
				apikey: supabaseAnonKey,
				Authorization: `Bearer ${token}`,
			},
		}),
		axios.get(`${supabaseUrl}/rest/v1/expenses?user_id=eq.${userId}`, {
			headers: {
				apikey: supabaseAnonKey,
				Authorization: `Bearer ${token}`,
			},
		}),
	]);
	const incomes = incomesRes.data.map(
		(t: { description: string } & Partial<Transaction>) => ({
			...t,
			title: t.description,
			type: "income",
		}),
	);
	const expenses = expensesRes.data.map(
		(t: { description: string } & Partial<Transaction>) => ({
			...t,
			title: t.description,
			type: "expense",
		}),
	);
	return [...incomes, ...expenses].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);
};

export const addTransacao = async (
	transacao: Omit<Transaction, "id" | "user_id"> & {
		notes?: string;
		source?: string;
		is_recurring?: boolean;
	},
): Promise<Transaction> => {
	const token = await getToken();
	const userId = await getUserId();
	if (!userId) throw new Error("Usuário não autenticado");
	try {
		const table = transacao.type === "expense" ? "expenses" : "incomes";
		// Monta o objeto a ser enviado
		const payload: Record<string, unknown> = {
			user_id: userId,
			description: transacao.title,
			amount: Number.parseFloat(String(transacao.amount)),
			date: transacao.date,
		};
		if (transacao.type === "expense") {
			payload.category = transacao.category;
		}
		if (transacao.type === "income" && transacao.source) {
			payload.source = transacao.source;
		}
		if (transacao.notes) {
			payload.notes = transacao.notes;
		}
		if ('is_recurring' in transacao && typeof transacao.is_recurring !== "undefined") {
			payload.is_recurring = transacao.is_recurring;
		}
		const { data } = await axios.post(
			`${supabaseUrl}/rest/v1/${table}`,
			[payload],
			{
				headers: {
					apikey: supabaseAnonKey,
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
					Prefer: "return=representation",
				},
			},
		);
		return { ...data[0], type: transacao.type };
	} catch (error: unknown) {
		if (error && typeof error === "object" && "response" in error) {
			const axiosError = error as {
				response?: { data?: { message?: string } };
			};
			throw new Error(
				axiosError.response?.data?.message || "Erro ao salvar transação",
			);
		}
		throw new Error("Erro ao salvar transação");
	}
};

export const updateTransacao = async (
	id: string,
	transacao: Partial<Transaction> & { source?: string; notes?: string; amountStr?: string }
): Promise<Transaction> => {
	const token = await getToken();
	const userId = await getUserId();
	if (!userId) throw new Error("Usuário não autenticado");
	const table = transacao.type === "expense" ? "expenses" : "incomes";
	// Monta o objeto a ser enviado
	const payload: Record<string, unknown> = {
		description: transacao.title,
		amount: transacao.amountStr
			? Number.parseFloat(transacao.amountStr.replace(",", "."))
			: Number.parseFloat(String(transacao.amount)),
		date: transacao.date,
		user_id: userId,
	};
	if (transacao.type === "expense") {
		payload.category = transacao.category;
		if (transacao.notes) payload.notes = transacao.notes;
	}
	if (transacao.type === "income" && transacao.source) {
		payload.source = transacao.source;
		// Para receitas, garantir que category seja igual a source
		payload.category = transacao.source;
	}
	if ('is_recurring' in transacao && typeof transacao.is_recurring !== "undefined") {
		payload.is_recurring = transacao.is_recurring;
	}
	const { data } = await axios.patch(
		`${supabaseUrl}/rest/v1/${table}?id=eq.${id}&user_id=eq.${userId}`,
		payload,
		{
			headers: {
				apikey: supabaseAnonKey,
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
				Prefer: "return=representation",
			},
		}
	);
	return { ...data[0], type: transacao.type };
};

export const deleteTransacao = async (
	id: string,
	type: "income" | "expense",
): Promise<void> => {
	const token = await getToken();
	const table = type === "expense" ? "expenses" : "incomes";
	await axios.delete(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
		headers: {
			apikey: supabaseAnonKey,
			Authorization: `Bearer ${token}`,
		},
	});
};

export const getDespesas = async (): Promise<Transaction[]> => {
	const token = await getToken();
	const userId = await getUserId();
	if (!userId) return [];
	const { data } = await axios.get(
		`${supabaseUrl}/rest/v1/expenses?user_id=eq.${userId}`,
		{
			headers: {
				apikey: supabaseAnonKey,
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return data.map((t: Transaction) => ({ ...t, type: "expense" }));
};

export const getReceitas = async (): Promise<Transaction[]> => {
	const token = await getToken();
	const userId = await getUserId();
	if (!userId) return [];
	const { data } = await axios.get(
		`${supabaseUrl}/rest/v1/incomes?user_id=eq.${userId}`,
		{
			headers: {
				apikey: supabaseAnonKey,
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return data.map((t: Transaction) => ({ ...t, type: "income" }));
};

export const getUser = async () => {
	const token = await getToken();
	const { data } = await axios.get(`${supabaseUrl}/auth/v1/user`, {
		headers: {
			apikey: supabaseAnonKey,
			Authorization: `Bearer ${token}`,
		},
	});
	return data;
};

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (
			error.response &&
			(error.response.status === 401 || error.response.status === 403)
		) {
			await SecureStore.deleteItemAsync("supabase_token");
			router.replace("/auth/login");
		}
		return Promise.reject(error);
	},
);
