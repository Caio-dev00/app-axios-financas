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
import { PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Transaction, getTransacoes } from "../supabaseClient";

type TimeRange = "week" | "month" | "year";

type Category = {
	id: string;
	name: string;
	amount: number;
	icon: string;
};

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const getMonthYear = (dateStr: string) => {
	const [year, month] = dateStr.split('-');
	return { year: Number(year), month: Number(month) - 1 };
};

dayjs.extend(isoWeek);

const chartColors = [
	'#19C37D', '#3B82F6', '#FF5252', '#7C3AED', '#F59E42', '#F6C23E', '#4CAF50', '#888', '#0a7ea4', '#23232A'
];

export default function ReportsScreen() {
	const [selectedRange, setSelectedRange] = useState<TimeRange>("month");
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const theme = Colors[isDark ? "dark" : "light"];

	const [categories, setCategories] = useState<Category[]>([]);
	const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

	const today = new Date();
	const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
	const [selectedYear, setSelectedYear] = useState(today.getFullYear());
	const [showMonthPicker, setShowMonthPicker] = useState(false);

	// Filtrar transações por mês/ano
	const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

	// Função para filtrar por semana do mês
	function filterByWeek(transactions: Transaction[], year: number, month: number) {
		const today = dayjs();
		const currentWeek = today.isoWeek();
		return transactions.filter((tx) => {
			const date = dayjs(tx.date);
			return date.year() === year && date.month() === month && date.isoWeek() === currentWeek;
		});
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		async function fetchData() {
			try {
				const transacoes: Transaction[] = await getTransacoes();
				let filtered: Transaction[] = [];
				if (selectedRange === 'month') {
					filtered = transacoes.filter((tx) => {
						const date = dayjs(tx.date);
						return date.year() === selectedYear && date.month() === selectedMonth;
					});
				} else if (selectedRange === 'year') {
					filtered = transacoes.filter((tx) => {
						const date = dayjs(tx.date);
						return date.year() === selectedYear;
					});
				} else if (selectedRange === 'week') {
					filtered = filterByWeek(transacoes, selectedYear, selectedMonth);
				}
				setFilteredTransactions(filtered);
				// Agrupar por categoria e calcular totais
				const catMap: Record<
					string,
					{ name: string; amount: number; icon: string }
				> = {};
				let totalIncome = 0;
				let totalExpense = 0;
				for (const tx of filtered) {
					if (tx.type === "income") totalIncome += tx.amount || 0;
					if (tx.type === "expense") {
						totalExpense += tx.amount || 0;
						const cat = tx.category || "Outros";
						if (!catMap[cat])
							catMap[cat] = { name: cat, amount: 0, icon: "pricetag-outline" };
						catMap[cat].amount += tx.amount || 0;
					}
				}
				const catArr = Object.entries(catMap).map(([id, v]) => ({ id, ...v }));
				const total = totalIncome - totalExpense;
				setCategories(catArr);
				setSummary({
					income: totalIncome,
					expense: totalExpense,
					balance: total,
				});
			} catch (e) {
				setFilteredTransactions([]);
				setCategories([]);
				setSummary({ income: 0, expense: 0, balance: 0 });
			}
		}
		fetchData();
	}, [selectedMonth, selectedYear, selectedRange]);

	const renderTimeRangeSelector = () => (
		<View style={styles.timeRangeContainer}>
			<TouchableOpacity
				style={[
					styles.timeRangeButton,
					selectedRange === "week" && { backgroundColor: theme.tint },
				]}
				onPress={() => setSelectedRange("week")}
			>
				<ThemedText
					style={[
						styles.timeRangeText,
						selectedRange === "week" && { color: "#fff", fontWeight: "bold" },
					]}
				>
					Semana
				</ThemedText>
			</TouchableOpacity>
			<TouchableOpacity
				style={[
					styles.timeRangeButton,
					selectedRange === "month" && { backgroundColor: theme.tint },
				]}
				onPress={() => setSelectedRange("month")}
			>
				<ThemedText
					style={[
						styles.timeRangeText,
						selectedRange === "month" && { color: "#fff", fontWeight: "bold" },
					]}
				>
					Mês
				</ThemedText>
			</TouchableOpacity>
			<TouchableOpacity
				style={[
					styles.timeRangeButton,
					selectedRange === "year" && { backgroundColor: theme.tint },
				]}
				onPress={() => setSelectedRange("year")}
			>
				<ThemedText
					style={[
						styles.timeRangeText,
						selectedRange === "year" && { color: "#fff", fontWeight: "bold" },
					]}
				>
					Ano
				</ThemedText>
			</TouchableOpacity>
		</View>
	);

	const renderSummaryCard = () => (
		<View style={styles.summaryCard}>
			<ThemedText style={styles.summaryTitle}>Resumo</ThemedText>
			<View style={styles.summaryContent}>
				<View style={styles.summaryItem}>
					<ThemedText style={styles.summaryLabel}>Receitas</ThemedText>
					<ThemedText style={[styles.summaryValue, styles.income]}>
						R$ {summary.income.toFixed(2)}
					</ThemedText>
				</View>
				<View style={styles.summaryItem}>
					<ThemedText style={styles.summaryLabel}>Despesas</ThemedText>
					<ThemedText style={[styles.summaryValue, styles.expense]}>
						R$ {summary.expense.toFixed(2)}
					</ThemedText>
				</View>
				<View style={styles.summaryItem}>
					<ThemedText style={styles.summaryLabel}>Saldo</ThemedText>
					<ThemedText style={[styles.summaryValue, styles.balance]}>
						R$ {summary.balance.toFixed(2)}
					</ThemedText>
				</View>
			</View>
		</View>
	);

	const renderCategoryBreakdown = () => {
		const totalExpense = summary.expense;
		const pieData = categories
			.filter((cat) => cat.amount > 0)
			.map((cat, idx) => ({
				name: cat.name,
				amount: cat.amount,
				color: chartColors[idx % chartColors.length],
				legendFontColor: '#222',
				legendFontSize: 13,
			}));
		return (
			<View style={styles.categoryCard}>
				<ThemedText style={styles.categoryTitle}>Despesas por Categoria</ThemedText>
				{pieData.length > 0 && (
					<PieChart
						data={pieData.map(d => ({
							name: d.name,
							population: d.amount,
							color: d.color,
							legendFontColor: d.legendFontColor,
							legendFontSize: d.legendFontSize,
						}))}
						width={Dimensions.get('window').width - 40}
						height={180}
						chartConfig={{
							color: () => '#888',
							labelColor: () => '#222',
							backgroundColor: '#fff',
							backgroundGradientFrom: '#fff',
							backgroundGradientTo: '#fff',
							decimalPlaces: 2,
						}}
						accessor="population"
						backgroundColor="transparent"
						paddingLeft="10"
						absolute
					/>
				)}
				<View style={styles.categoryList}>
					{categories.map((category: Category) => {
						const percentage = totalExpense > 0 ? Math.round((category.amount / totalExpense) * 100) : 0;
						return (
							<View key={category.id} style={styles.categoryItem}>
								<View style={styles.categoryInfo}>
									<View style={[styles.categoryIcon, { backgroundColor: chartColors[categories.indexOf(category) % chartColors.length] }] }>
										<Ionicons name={category.icon as keyof typeof Ionicons.glyphMap} size={20} color="#fff" />
									</View>
									<View>
										<ThemedText style={styles.categoryName}>{category.name}</ThemedText>
										<ThemedText style={styles.categoryPercentage}>{percentage}%</ThemedText>
									</View>
								</View>
								<ThemedText style={styles.categoryAmount}>R$ {category.amount.toFixed(2)}</ThemedText>
							</View>
						);
					})}
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom', 'left', 'right']}>
			{/* Filtro de mês/ano */}
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
			{/* Modal de seleção de mês/ano */}
			<Modal visible={showMonthPicker} animationType="fade" transparent>
				<View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
					<View style={{ backgroundColor: '#fff', borderRadius: 24, width: '90%', maxWidth: 400, paddingBottom: 18, overflow: 'hidden' }}>
						{/* Header de navegação de ano */}
						<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.tint, paddingVertical: 18, paddingHorizontal: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
							<TouchableOpacity onPress={() => setSelectedYear(y => y - 1)}>
								<Ionicons name="chevron-back" size={26} color="#fff" />
							</TouchableOpacity>
							<ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{selectedYear}</ThemedText>
							<TouchableOpacity onPress={() => setSelectedYear(y => y + 1)}>
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
			<ScrollView style={styles.container}>
				<ThemedView style={styles.content}>
					{renderTimeRangeSelector()}
					{renderSummaryCard()}
					{renderCategoryBreakdown()}
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
	timeRangeContainer: {
		flexDirection: "row",
		backgroundColor: "#f5f5f5",
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
	},
	categoryIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#fff",
		justifyContent: "center",
		alignItems: "center",
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
});
