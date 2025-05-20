// @ts-ignore
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import SimplePieChart from '../components/SimplePieChart';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTransactions } from "../TransactionsContext";

// Definindo tipos
type TimeRange = "week" | "month" | "year";

type Category = {
	id: string;
	name: string;
	amount: number;
	icon: string;
};

// Definir meses como constante para garantir que sempre estará definido
const MONTHS: string[] = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

dayjs.extend(isoWeek);

const chartColors = [
	'#19C37D', '#3B82F6', '#FF5252', '#7C3AED', '#F59E42', '#F6C23E', '#4CAF50', '#888', '#0a7ea4', '#23232A'
];

export default function ReportsScreen() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('month');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];
  const { currency, formatCurrency, convertAmount } = useCurrency();
  const { transactions } = useTransactions(); // removed 'loading' as it's unused

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Helper: filter transactions by selected period
  const getFilteredTransactions = React.useCallback(() => {
    if (!Array.isArray(transactions)) return [];
    if (selectedRange === 'month') {
      return transactions.filter((tx) => {
        const date = dayjs(tx.date);
        return date.year() === selectedYear && date.month() === selectedMonth;
      });
    } else if (selectedRange === 'year') {
      return transactions.filter((tx) => dayjs(tx.date).year() === selectedYear);
    } else if (selectedRange === 'week') {
      const currentWeek = dayjs().isoWeek();
      return transactions.filter((tx) => {
        const date = dayjs(tx.date);
        return date.year() === selectedYear && date.month() === selectedMonth && date.isoWeek() === currentWeek;
      });
    }
    return transactions;
  }, [transactions, selectedRange, selectedMonth, selectedYear]);

  // Derived state: categories, summary, converted values
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [convertedValues, setConvertedValues] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  // Recalculate on every relevant change
  useEffect(() => {
    const filtered = getFilteredTransactions();
    // Group by category and calculate totals in BRL
    const catMap: Record<string, { name: string; amount: number; icon: string }> = {};
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryIcons = {
      Alimentação: 'fast-food-outline',
      Transporte: 'car-outline',
      Moradia: 'home-outline',
      Entretenimento: 'film-outline',
      Saúde: 'medical-outline',
      Educação: 'school-outline',
      Compras: 'cart-outline',
      Viagens: 'airplane-outline',
      Serviços: 'construct-outline',
      Outros: 'pricetag-outline',
    };
    for (const tx of filtered) {
      if (tx.type === 'income') {
        totalIncome += tx.amount || 0;
      }
      if (tx.type === 'expense') {
        totalExpense += tx.amount || 0;
        const cat = tx.category || 'Outros';
        if (!catMap[cat]) {
          const icon = categoryIcons[cat as keyof typeof categoryIcons] || 'pricetag-outline';
          catMap[cat] = { name: cat, amount: 0, icon };
        }
        catMap[cat].amount += tx.amount || 0;
      }
    }
    const catArr = Object.entries(catMap).map(([id, v]) => ({ id, ...v }));
    // O resumo agora reflete apenas o período filtrado (mês, semana ou ano)
    const total = totalIncome - totalExpense;
    setCategories(catArr);
    setSummary({ income: totalIncome, expense: totalExpense, balance: total });
  }, [getFilteredTransactions]);

  // Convert values to selected currency
  useEffect(() => {
    let isMounted = true;
    async function updateTotals() {
      const income = typeof summary.income === 'number' ? summary.income : 0;
      const expense = typeof summary.expense === 'number' ? summary.expense : 0;
      const totalIncome = await convertAmount(income, 'BRL', currency);
      const totalExpense = await convertAmount(expense, 'BRL', currency);
      const balance = totalIncome - totalExpense;
      if (isMounted) setConvertedValues({ totalIncome, totalExpense, balance });
      // Corrige: cria um novo array convertido para não sobrescrever o array base
      if (Array.isArray(categories) && categories.length > 0) {
        const updatedCategories = await Promise.all(
          categories.map(async (cat) => {
            const safeAmount = typeof cat.amount === 'number' && !isNaN(cat.amount) ? cat.amount : 0;
            const convertedAmount = await convertAmount(safeAmount, 'BRL', currency);
            return { ...cat, amount: convertedAmount };
          })
        );
        if (isMounted) setCategories(updatedCategories);
      }
    }
    updateTotals();
    return () => { isMounted = false; };
  }, [summary, currency, categories, convertAmount]);

  // Renderizadores auxiliares
  const renderTimeRangeSelector = () => (
    <View style={[styles.timeRangeContainer, { backgroundColor: isDark ? theme.background : '#f5f5f5' }]}> 
      {(['week', 'month', 'year'] as TimeRange[]).map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            selectedRange === range && { backgroundColor: theme.tint },
          ]}
          onPress={() => setSelectedRange(range)}
        >
          <ThemedText
            style={[
              styles.timeRangeText,
              { color: isDark ? theme.text : '#666' },
              selectedRange === range && { color: '#fff', fontWeight: 'bold' },
            ]}
          >
            {range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : 'Ano'}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSummaryCard = () => (
    <View style={[styles.summaryCard, { backgroundColor: theme.card }]}> 
      <ThemedText style={[styles.summaryTitle, { color: theme.text }]}>Resumo</ThemedText>
      <View style={styles.summaryContent}>
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryLabel, { color: theme.text }]}>Receitas</ThemedText>
          <ThemedText style={[styles.summaryValue, { color: theme.tint }]}>{formatCurrency(convertedValues.totalIncome)}</ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryLabel, { color: theme.text }]}>Despesas</ThemedText>
          <ThemedText style={[styles.summaryValue, { color: theme.error }]}>{formatCurrency(convertedValues.totalExpense)}</ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryLabel, { color: theme.text }]}>Saldo</ThemedText>
          <ThemedText
            style={[
              styles.summaryValue,
              { color: convertedValues.balance >= 0 ? theme.tint : theme.error },
            ]}
          >
            {formatCurrency(convertedValues.balance)}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderCategoryBreakdown = () => {
    // Use sempre os dados filtrados do período selecionado
    const filtered = getFilteredTransactions();
    // Agrupa as despesas por categoria do período filtrado
    const catMap: Record<string, { name: string; amount: number; icon: string }> = {};
    const categoryIcons = {
      Alimentação: 'fast-food-outline',
      Transporte: 'car-outline',
      Moradia: 'home-outline',
      Entretenimento: 'film-outline',
      Saúde: 'medical-outline',
      Educação: 'school-outline',
      Compras: 'cart-outline',
      Viagens: 'airplane-outline',
      Serviços: 'construct-outline',
      Outros: 'pricetag-outline',
    };
    for (const tx of filtered) {
      if (tx.type === 'expense') {
        const cat = tx.category || 'Outros';
        if (!catMap[cat]) {
          const icon = categoryIcons[cat as keyof typeof categoryIcons] || 'pricetag-outline';
          catMap[cat] = { name: cat, amount: 0, icon };
        }
        catMap[cat].amount += tx.amount || 0;
      }
    }
    const validCategories = Object.entries(catMap)
      .map(([id, v]) => ({ id, ...v }))
      .filter((cat) => cat && typeof cat.amount === 'number' && cat.amount > 0);
    const sortedCategories = [...validCategories].sort((a, b) => (b.amount || 0) - (a.amount || 0));
    const total = sortedCategories.reduce((sum, cat) => sum + Math.max(0, cat.amount || 0), 0);
    const chartData = sortedCategories.map((cat, index) => ({
      name: cat.name || 'Categoria',
      value: Math.max(0.01, cat.amount),
      color: chartColors[index % chartColors.length],
    }));
    if (sortedCategories.length === 0 || total === 0) {
      return (
        <View style={[styles.categoryCard, { backgroundColor: theme.card }]}> 
          <ThemedText style={[styles.categoryTitle, { color: theme.text }]}>Despesas por Categoria</ThemedText>
          <ThemedText style={[styles.emptyMessage, { color: theme.gray }]}>Nenhuma despesa registrada no período</ThemedText>
        </View>
      );
    }
    return (
      <View style={[styles.categoryCard, { backgroundColor: theme.card }]}> 
        <ThemedText style={[styles.categoryTitle, { color: theme.text }]}>Despesas por Categoria</ThemedText>
        {total > 0 && chartData.length > 0 && (
          <View style={styles.chartContainer}>
            <SimplePieChart data={chartData} width={Dimensions.get('window').width - 60} height={220} />
          </View>
        )}
        <ThemedText style={[styles.sectionTitle, { color: theme.text, marginTop: 5 }]}>Detalhamento por Categoria</ThemedText>
        <View style={styles.categoryList}>
          {sortedCategories.map((category, index) => {
            const safeAmount = Math.max(category.amount || 0, 0.01);
            const percentage = total > 0 ? ((safeAmount / total) * 100).toFixed(1) : '0.0';
            const safeIcon = category.icon && typeof category.icon === 'string' ? category.icon : 'pricetag-outline';
            return (
              <View key={category.id || `cat-${index}`} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryIcon, { backgroundColor: chartColors[index % chartColors.length] }]}> 
                    <Ionicons name={safeIcon as keyof typeof Ionicons.glyphMap} size={20} color="#fff" />
                  </View>
                  <View>
                    <ThemedText style={[styles.categoryName, { color: theme.text }]}>{category.name || 'Categoria'}</ThemedText>
                    <ThemedText style={[styles.categoryPercentage, { color: theme.gray }]}>{percentage}%</ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.categoryAmount, { color: theme.text }]}>{formatCurrency(safeAmount)}</ThemedText>
              </View>
            );
          })}
          <View style={[styles.totalRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}> 
            <ThemedText style={[styles.totalLabel, { color: theme.text }]}>Total de Despesas</ThemedText>
            <ThemedText style={[styles.totalAmount, { color: theme.error }]}>{formatCurrency(total)}</ThemedText>
          </View>
        </View>
      </View>
    );
  };

  // Render principal
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 2 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.tint, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 8 }}
          onPress={() => setShowMonthPicker(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{MONTHS[selectedMonth]} {selectedYear}</ThemedText>
          <Ionicons name="chevron-down" size={18} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
      <Modal visible={showMonthPicker} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, width: '90%', maxWidth: 400, paddingBottom: 18, overflow: 'hidden' }}>
            {/* Header de navegação de ano */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.tint, paddingVertical: 18, paddingHorizontal: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              <TouchableOpacity onPress={() => setSelectedYear((y) => y - 1)}>
                <Ionicons name="chevron-back" size={26} color="#fff" />
              </TouchableOpacity>
              <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{selectedYear}</ThemedText>
              <TouchableOpacity onPress={() => setSelectedYear((y) => y + 1)}>
                <Ionicons name="chevron-forward" size={26} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* Grid de meses */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 18, backgroundColor: '#f6f6f7' }}>
              {MONTHS.map((m, idx) => (
                <TouchableOpacity
                  key={m}
                  style={{ width: '30%', marginVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: idx === selectedMonth ? theme.tint : '#fff', paddingVertical: 12, shadowColor: idx === selectedMonth ? theme.tint : 'transparent', shadowOpacity: idx === selectedMonth ? 0.12 : 0, shadowRadius: 6, elevation: idx === selectedMonth ? 2 : 0 }}
                  onPress={() => { setSelectedMonth(idx); setShowMonthPicker(false); }}
                  activeOpacity={0.85}
                >
                  <ThemedText style={{ color: idx === selectedMonth ? '#fff' : theme.text, fontWeight: idx === selectedMonth ? 'bold' : 'normal', fontSize: 15 }}>{m}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            {/* Ações */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginTop: 2 }}>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <ThemedText style={{ color: theme.tint, fontWeight: 'bold', fontSize: 15, paddingVertical: 10 }}>CANCELAR</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSelectedMonth(today.getMonth()); setSelectedYear(today.getFullYear()); setShowMonthPicker(false); }}>
                <ThemedText style={{ color: theme.tint, fontWeight: 'bold', fontSize: 15, paddingVertical: 10 }}>MÊS ATUAL</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.content}>
          {renderTimeRangeSelector()}
          {renderSummaryCard()}
          {convertedValues.totalExpense > 0 ? renderCategoryBreakdown() : null}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	emptyMessage: {
		textAlign: 'center',
		fontSize: 16,
		opacity: 0.7,
		marginTop: 20,
		marginBottom: 20,
	},
	chartContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: 20,
		paddingHorizontal: 0,
		marginBottom: 20,
		width: '100%',
		minHeight: 240,
		paddingTop: 10
	},
	customLegend: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 8,
		marginBottom: 8,
	},
	legendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 12,
		marginBottom: 8,
	},	legendColor: {
		width: 10,
		height: 10,
		borderRadius: 5,
		marginRight: 5,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 12,
	},
	totalExpenseLabel: {
		fontSize: 16,
		fontWeight: 'bold',
		textAlign: 'center',
		marginTop: 16,
		marginBottom: 8,
		opacity: 0.8,
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingTop: 16,
		marginTop: 16,
		borderTopWidth: 1,
		borderTopColor: 'rgba(0,0,0,0.1)',
	},
	totalLabel: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	totalAmount: {
		fontSize: 18,
		fontWeight: 'bold',
	},	timeRangeContainer: {
		flexDirection: "row",
		borderRadius: 12,
		padding: 4,
		marginBottom: 16,
	},
	timeRangeButton: {
		flex: 1,
		paddingVertical: 8,
		alignItems: "center",
		borderRadius: 8,
	},
	timeRangeText: {
		fontSize: 14,
		color: "#666",
	},
	summaryCard: {
		backgroundColor: "#f5f5f5",
		borderRadius: 16,
		padding: 20,
		marginBottom: 16,
	},
	summaryTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 16,
	},
	summaryContent: {
		gap: 12,
	},
	summaryItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	summaryLabel: {
		fontSize: 16,
		opacity: 0.7,
	},
	summaryValue: {
		fontSize: 16,
		fontWeight: "bold",
	},
	income: {
		color: "#4CAF50",
	},
	expense: {
		color: "#FF5252",
	},
	balance: {
		color: "#0a7ea4",
	},
	categoryCard: {
		backgroundColor: "#f5f5f5",
		borderRadius: 16,
		padding: 20,
	},
	categoryTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 16,
	},
	categoryList: {
		gap: 16,
	},
	categoryItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	categoryInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},	categoryIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#25C16F",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 10,
	},
	categoryName: {
		fontSize: 16,
		fontWeight: "500",
	},
	categoryPercentage: {
		fontSize: 14,
		opacity: 0.6,
	},
	categoryAmount: {
		fontSize: 16,
		fontWeight: "500",
	},
	monthPickerButton: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 18,
		paddingHorizontal: 18,
		paddingVertical: 8
	},
	monthText: {
		fontWeight: 'bold',
		fontSize: 16
	},
	modalContainer: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.35)',
		justifyContent: 'center',
		alignItems: 'center'
	},
	modalContent: {
		borderRadius: 24,
		width: '90%',
		maxWidth: 400,
		paddingBottom: 18,
		overflow: 'hidden'
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 18,
		paddingHorizontal: 24,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24
	},
	modalHeaderText: {
		fontWeight: 'bold',
		fontSize: 18
	},
	modalGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		padding: 18
	},
	modalGridItem: {
		width: '30%',
		marginVertical: 8,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderRadius: 12
	}
});
