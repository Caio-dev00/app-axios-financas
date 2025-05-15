import axios, { AxiosError, isAxiosError } from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export const SUPABASE_URL = 'https://yascliotrmqhvqbvrhsc.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc2NsaW90cm1xaHZxYnZyaHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTA3NjksImV4cCI6MjA2MTUyNjc2OX0.Yh2Ebi1n6CPx2mVERHfA7G5w_kaF6_p7OImAF3qRj8o';

// Lista de rotas que não precisam de token de autenticação
const publicRoutes = [
  '/auth/v1/token',
  '/auth/v1/signup',
  '/auth/v1/recover'
];

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  created_at?: string;
}

const supabaseClient = axios.create({
  baseURL: SUPABASE_URL,
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token de autenticação
supabaseClient.interceptors.request.use(async (config) => {
  config.headers['apikey'] = SUPABASE_ANON_KEY;
  
  if (config.url && publicRoutes.some(route => config.url?.includes(route))) {
    return config;
  }

  try {
    const token = await SecureStore.getItemAsync('supabase_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      throw new Error('Usuário não autenticado');
    }
    return config;
  } catch (error) {
    return Promise.reject(error);
  }
});

// Interceptor para tratar erros de autenticação
supabaseClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      await Promise.all([
        SecureStore.deleteItemAsync('supabase_token'),
        SecureStore.deleteItemAsync('supabase_refresh_token')
      ]);

      const isPublicRoute = error.config?.url && publicRoutes.some(route => error.config?.url?.includes(route));
      if (!isPublicRoute) {
        router.replace('/auth/login');
      }
    }
    return Promise.reject(error);
  }
);

export class SupabaseAuth {
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await supabaseClient.post<AuthResponse>('/auth/v1/token?grant_type=password', {
        email,
        password,
      });

      if (!response.data?.access_token || !response.data?.user) {
        throw new Error('Resposta inválida do servidor');
      }

      await SecureStore.setItemAsync('supabase_token', response.data.access_token);
      if (response.data.refresh_token) {
        await SecureStore.setItemAsync('supabase_refresh_token', response.data.refresh_token);
      }

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          throw new Error('Email ou senha inválidos');
        }
        throw new Error(error.response?.data?.error_description || 'Erro ao fazer login');
      }
      throw error;
    }
  }

  async signOut() {
    await Promise.all([
      SecureStore.deleteItemAsync('supabase_token'),
      SecureStore.deleteItemAsync('supabase_refresh_token')
    ]);
  }

  async getSession(): Promise<{ user: User | null; token: string | null }> {
    try {
      const token = await SecureStore.getItemAsync('supabase_token');
      if (!token) {
        return { user: null, token: null };
      }

      const response = await supabaseClient.get('/auth/v1/user', {
        headers: { Authorization: `Bearer ${token}` }
      });

      return {
        user: response.data,
        token
      };
    } catch (error) {
      return { user: null, token: null };
    }
  }
}

export const supabase = new SupabaseAuth();
export default supabaseClient;
