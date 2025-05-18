import AsyncStorage from '@react-native-async-storage/async-storage';

export type CurrencyCode = 'BRL' | 'USD' | 'EUR';

export interface CurrencyFormat {
  code: CurrencyCode;
  symbol: string;
  decimalSeparator: string;
  thousandsSeparator: string;
  decimalPlaces: number;
}

export const currencyFormats: Record<CurrencyCode, CurrencyFormat> = {
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    decimalPlaces: 2
  },
  USD: {
    code: 'USD',
    symbol: '$',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    decimalPlaces: 2
  }
};

const EXCHANGE_RATES_KEY = '@exchange_rates';
const CACHE_EXPIRY = 6 * 60 * 60 * 1000; // 6 horas

interface ExchangeRateCache {
  timestamp: number;
  rates: Record<CurrencyCode, number>;
}

export const fetchExchangeRates = async (baseCurrency: CurrencyCode = 'BRL'): Promise<Record<CurrencyCode, number>> => {
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    if (!response.ok) {
      throw new Error('Falha ao buscar taxas de câmbio');
    }
    const data = await response.json();
    if (!data.rates) {
      throw new Error('Dados de taxas de câmbio inválidos');
    }
    
    // Filtra apenas as moedas que suportamos
    const supportedRates: Record<CurrencyCode, number> = {
      BRL: data.rates.BRL || 1,
      USD: data.rates.USD,
      EUR: data.rates.EUR
    };

    // Armazena em cache
    await cacheExchangeRates(supportedRates);
    return supportedRates;
  } catch (error) {
    console.debug('Erro ao buscar taxas de câmbio:', error);
    // Tenta usar o cache em caso de erro
    const cached = await getCachedRates();
    if (cached) {
      return cached;
    }
    // Retorna taxas padrão em último caso
    return { BRL: 1, USD: 0.20, EUR: 0.19 };
  }
};

export const cacheExchangeRates = async (rates: Record<CurrencyCode, number>) => {
  try {
    const cache: ExchangeRateCache = {
      timestamp: Date.now(),
      rates
    };
    await AsyncStorage.setItem(EXCHANGE_RATES_KEY, JSON.stringify(cache));
  } catch (error) {
    console.debug('Erro ao cachear taxas de câmbio:', error);
  }
};

export const getCachedRates = async (): Promise<Record<CurrencyCode, number> | null> => {
  try {
    const cached = await AsyncStorage.getItem(EXCHANGE_RATES_KEY);
    if (!cached) return null;

    const { timestamp, rates } = JSON.parse(cached) as ExchangeRateCache;
    if (Date.now() - timestamp > CACHE_EXPIRY) return null;

    return rates;
  } catch (error) {
    console.debug('Erro ao ler cache de taxas:', error);
    return null;
  }
};

export const formatCurrency = (
  amount: number,
  currencyCode: CurrencyCode = 'BRL'
): string => {
  const format = currencyFormats[currencyCode];
  
  const formattedNumber = Math.abs(amount)
    .toFixed(format.decimalPlaces)
    .replace('.', format.decimalSeparator)
    .replace(/\B(?=(\d{3})+(?!\d))/g, format.thousandsSeparator);
  
  return `${amount < 0 ? '-' : ''}${format.symbol} ${formattedNumber}`;
};

export const getActiveCurrency = (preference?: string | null): CurrencyCode => {
  if (preference && preference in currencyFormats) {
    return preference as CurrencyCode;
  }
  return 'BRL';
};

export default currencyFormats;
