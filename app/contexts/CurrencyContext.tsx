import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
    CurrencyCode,
    fetchExchangeRates,
    formatCurrency as formatCurrencyUtil,
    getActiveCurrency
} from '../services/currencyService';
import { getProfile } from '../supabaseClient';

interface CurrencyContextData {
  /** Moeda atual selecionada pelo usuário */
  currency: CurrencyCode;
  /** Taxa de câmbio atual em relação ao BRL */
  exchangeRate: number;
  /** Atualiza a moeda preferida do usuário */
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  /** 
   * Converte um valor entre moedas
   * @param amount - Valor a ser convertido
   * @param fromCurrency - Moeda de origem (padrão: BRL)
   * @param toCurrency - Moeda de destino (padrão: moeda atual do usuário)
   * @returns Valor convertido
   */
  convertAmount: (amount: number, fromCurrency?: CurrencyCode, toCurrency?: CurrencyCode) => Promise<number>;
  /**
   * Formata um valor monetário de acordo com a moeda especificada
   * @param amount - Valor a ser formatado
   * @param currencyCode - Código da moeda (opcional, usa a moeda atual se não especificado)
   */
  formatCurrency: (amount: number, currencyCode?: CurrencyCode) => string;
}

export const CurrencyContext = createContext<CurrencyContextData>({
  currency: 'BRL',
  exchangeRate: 1,
  setCurrency: async () => {},
  convertAmount: async (amount) => amount,
  formatCurrency: (amount) => formatCurrencyUtil(amount, 'BRL'),
});

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('BRL');
  const [exchangeRates, setExchangeRates] = useState<Record<CurrencyCode, number>>({ BRL: 1, USD: 0.20, EUR: 0.19 });

  const updateRates = useCallback(async () => {
    const rates = await fetchExchangeRates('BRL');
    setExchangeRates(rates);
  }, []);

  const updateCurrency = useCallback(async (newCurrency: CurrencyCode) => {
    try {
      await updateRates();
      setCurrencyState(newCurrency);
    } catch (error) {
      console.debug('Erro ao atualizar moeda:', error);
    }
  }, [updateRates]);

  const loadUserCurrency = useCallback(async () => {
    try {
      const profile = await getProfile();
      const preferredCurrency = getActiveCurrency(profile?.currency_preference);
      await updateCurrency(preferredCurrency);
    } catch (error) {
      console.debug('Usando moeda padrão (BRL):', error);
    }
  }, [updateCurrency]);

  useEffect(() => {
    loadUserCurrency();
    
    // Atualiza as taxas a cada 6 horas
    const interval = setInterval(async () => {
      try {
        await updateRates();
      } catch (error) {
        console.debug('Erro ao atualizar taxas de câmbio:', error);
      }
    }, 6 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadUserCurrency, updateRates]);

  const setCurrency = async (newCurrency: CurrencyCode) => {
    await updateCurrency(newCurrency);
  };

  const convertAmount = async (
    amount: number,
    fromCurrency: CurrencyCode = 'BRL',
    toCurrency: CurrencyCode = currency
  ): Promise<number> => {
    try {
      if (fromCurrency === toCurrency) {
        return amount;
      }

      const fromRate = exchangeRates[fromCurrency];
      const toRate = exchangeRates[toCurrency];

      if (!fromRate || !toRate) {
        await updateRates();
        return convertAmount(amount, fromCurrency, toCurrency);
      }

      // Converte para BRL primeiro (se necessário) e depois para a moeda alvo
      const valueInBRL = fromCurrency === 'BRL' ? amount : amount / fromRate;
      return toCurrency === 'BRL' ? valueInBRL : valueInBRL * toRate;
    } catch (error) {
      console.debug('Erro na conversão:', error);
      return amount; // Retorna o valor original em caso de erro
    }
  };

  const formatCurrency = (amount: number, currencyCode?: CurrencyCode) => {
    return formatCurrencyUtil(amount, currencyCode || currency);
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      exchangeRate: exchangeRates[currency] || 1,
      setCurrency,
      convertAmount,
      formatCurrency,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);

export default CurrencyProvider;
