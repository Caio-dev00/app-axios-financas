import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { useCurrency } from '../contexts/CurrencyContext';
import type { Transaction } from '../supabaseClient';

type TransactionCardProps = {
  transaction: Transaction;
  theme: {
    tint: string;
    error: string;
    card: string;
    text: string;
  };
};

export const TransactionCard = ({ transaction: tx, theme }: TransactionCardProps) => {
  const { currency, formatCurrency, convertAmount } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState(tx.amount);

  useEffect(() => {
    const updateAmount = async () => {
      const converted = await convertAmount(tx.amount, 'BRL', currency);
      setConvertedAmount(converted);
    };
    updateAmount();
  }, [tx.amount, currency, convertAmount]);

  // Garantir que todos os textos são strings seguras
  const safeTitle = tx.title?.trim() ? String(tx.title) : 'Sem título';
  const safeCategory = tx.type === 'income'
    ? (tx.source?.trim() ? String(tx.source) : 'Sem categoria')
    : (tx.category?.trim() ? String(tx.category) : 'Sem categoria');
  const safeDate = tx.date ? String(tx.date) : '';

  return (
    <View
      style={[
        styles.transactionCard,
        { backgroundColor: theme.card },
      ]}
    >
      <View style={styles.cardIconWrap}>
        <Ionicons
          name={tx.type === "income" ? "cash-outline" : "cart-outline"}
          size={28}
          color={tx.type === "income" ? theme.tint : theme.error}
        />
      </View>
      <View style={styles.cardInfo}>
        <ThemedText style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
          {safeTitle}
        </ThemedText>
        <ThemedText style={styles.cardCategory} numberOfLines={1} ellipsizeMode="tail">
          {safeCategory}
        </ThemedText>
        <ThemedText style={styles.cardDate}>{safeDate}</ThemedText>
      </View>
      <ThemedText
        style={[
          styles.cardValue,
          tx.type === "income" ? { color: '#4CAF50' } : { color: '#FF5252' },
        ]}
      >
        {tx.type === "income" ? "+" : "-"}{formatCurrency(convertedAmount)}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f6f6f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  cardCategory: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    color: '#bbb',
  },
  cardValue: {
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default TransactionCard;
