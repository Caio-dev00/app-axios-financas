import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '../lib/supabase';
import supabaseClient, { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  lastAuthCheck: Date | null;
}

interface AuthContextType extends Omit<AuthState, 'lastAuthCheck'> {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  clearError: () => void;
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): string | null => {
  if (password.length < 6) {
    return 'A senha deve ter pelo menos 6 caracteres';
  }
  if (!/[A-Z]/.test(password)) {
    return 'A senha deve conter pelo menos uma letra maiúscula';
  }
  if (!/[0-9]/.test(password)) {
    return 'A senha deve conter pelo menos um número';
  }
  return null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isInitialized: false,
    error: null,
    lastAuthCheck: null
  });

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (!validateEmail(email)) {
        throw new Error('Email inválido');
      }

      const pwdError = validatePassword(password);
      if (pwdError) {
        throw new Error(pwdError);
      }

      const auth = await supabase.signIn(email.trim(), password.trim());
      
      try {
        // Buscar o perfil do usuário
        const profileResponse = await supabaseClient.get('/rest/v1/profiles?select=*', {
          params: {
            id: `eq.${auth.user.id}`,
            limit: 1
          }
        });

        if (profileResponse.data?.[0]) {
          setState(prev => ({
            ...prev,
            user: {
              ...auth.user,
              ...profileResponse.data[0]
            },
            isLoading: false,
            error: null,
            lastAuthCheck: new Date()
          }));
        } else {
          throw new Error('Perfil não encontrado');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        throw new Error('Erro ao carregar perfil do usuário');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao fazer login',
        isLoading: false
      }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.signOut();
      setState(prev => ({
        ...prev,
        user: null,
        error: null,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (!validateEmail(email)) {
        throw new Error('Email inválido');
      }

      const pwdError = validatePassword(password);
      if (pwdError) {
        throw new Error(pwdError);
      }

      const response = await supabaseClient.post('/auth/v1/signup', {
        email: email.trim(),
        password: password.trim(),
        data: metadata
      });

      if (response.status === 200) {
        // Auto login after signup
        await signIn(email, password);
      } else {
        throw new Error('Erro ao criar conta');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao criar conta',
        isLoading: false
      }));
      throw error;
    }
  }, [signIn]);

  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const { user, token } = await supabase.getSession();
      
      if (!user || !token) {
        return false;
      }

      try {
        const profileResponse = await supabaseClient.get('/rest/v1/profiles?select=*', {
          params: {
            id: `eq.${user.id}`,
            limit: 1
          }
        });

        if (profileResponse.data?.[0]) {
          setState(prev => ({
            ...prev,
            user: {
              ...user,
              ...profileResponse.data[0]
            },
            lastAuthCheck: new Date(),
            error: null
          }));
          return true;
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initial session check
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isValid = await validateSession();
        if (!isValid) {
          await signOut();
        }
        setState(prev => ({ 
          ...prev, 
          isInitialized: true, 
          isLoading: false 
        }));
      } catch (error) {
        console.error('Error initializing auth:', error);
        setState(prev => ({ 
          ...prev, 
          isInitialized: true, 
          isLoading: false 
        }));
      }
    };

    initializeAuth();
  }, [validateSession, signOut]);

  const contextValue = {
    user: state.user,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    error: state.error,
    signIn,
    signOut,
    signUp,
    clearError,
    validateSession
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
