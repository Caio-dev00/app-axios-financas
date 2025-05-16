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
import { useCurrency } from '../contexts/CurrencyContext';
import { type Transaction, getTransacoes } from "../supabaseClient";

// Definindo tipos
type TimeRange = "week" | "month" | "year";

type Category = {
	id: string;
	name: string;
	amount: number;
	icon: string;
};

// Componente personalizado de gráfico de pizza
type ChartData = {
	name: string;
	value: number;
	color: string;
};

// Implementação simplificada que não usa SVG complexo
const SimplePieChart = ({ 
	data, 
	width, 
	height 
}: { 
	data: ChartData[]; 
	width: number;
	height: number;
}) => {
	// Se não há dados, retorna null
	if (!data || data.length === 0) {
		return null;
	}

	const total = data.reduce((sum, item) => sum + item.value, 0);
	if (total <= 0) return null;
	
	// Dimensões do "gráfico" - um pouco maior para melhor visualização
	const circleSize = Math.min(width * 0.48, height * 0.58);
	
	// Design mais moderno para o gráfico de pizza
	return (
		<View style={{ width, height, alignItems: 'center' }}>
			{/* Círculo colorido com design moderno e efeito visual */}
			<View style={{
				width: circleSize,
				height: circleSize,
				borderRadius: circleSize/2,
				backgroundColor: data[0].color,
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 3 },
				shadowOpacity: 0.16,
				shadowRadius: 6,
				elevation: 5,
				marginBottom: 20,
				position: 'relative',
				borderWidth: 6,
				borderColor: 'white'
			}}>
				{/* Pequeno círculo de destaque para dar um efeito visual */}
				<View style={{
					position: 'absolute',
					top: circleSize * 0.1,
					left: circleSize * 0.1,
					width: circleSize * 0.15,
					height: circleSize * 0.15,
					borderRadius: circleSize * 0.075,
					backgroundColor: 'rgba(255, 255, 255, 0.3)'
				}} />
			</View>
					{/* Legenda abaixo do gráfico - design moderno */}
			<View style={{
				flexDirection: 'row',
				flexWrap: 'wrap',
				justifyContent: 'center',
				paddingHorizontal: 10,
				width: width * 0.9,
				marginTop: 12
			}}>
				{data.map((item, index) => {
					const percentage = ((item.value / total) * 100).toFixed(1);
					return (
						<View key={`legend-${index}`} style={{
							flexDirection: 'row',
							alignItems: 'center',
							marginHorizontal: 8,
							marginBottom: 10,
							paddingVertical: 6,
							paddingHorizontal: 10,
							backgroundColor: 'rgba(245, 245, 245, 0.6)',
							borderRadius: 20,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 1 },
							shadowOpacity: 0.05,
							shadowRadius: 1,
							elevation: 1,
						}}>
							<View style={{
								width: 10,
								height: 10,
								borderRadius: 5,
								backgroundColor: item.color,
								marginRight: 6
							}} />
							<ThemedText style={{ fontSize: 13, fontWeight: '500' }}>
								{item.name} ({percentage}%)
							</ThemedText>
						</View>
					);
				})}
			</View>
		</View>
	);
};

// Definir meses como constante para garantir que sempre estará definido
const MONTHS: string[] = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

dayjs.extend(isoWeek);

const chartColors = [
	'#19C37D', '#3B82F6', '#FF5252', '#7C3AED', '#F59E42', '#F6C23E', '#4CAF50', '#888', '#0a7ea4', '#23232A'
];

export default function ReportsScreen() {
	const [selectedRange, setSelectedRange] = useState<TimeRange>("month");
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const theme = Colors[isDark ? "dark" : "light"];
	const { currency, formatCurrency, convertAmount } = useCurrency();

	const [categories, setCategories] = useState<Category[]>([]);
	const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
	const [convertedValues, setConvertedValues] = useState({
		totalIncome: 0,
		totalExpense: 0,
		balance: 0
	});

	const today = new Date();
	const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
	const [selectedYear, setSelectedYear] = useState(today.getFullYear());
	const [showMonthPicker, setShowMonthPicker] = useState(false);

	// Função para filtrar por semana do mês
	function filterByWeek(transactions: Transaction[], year: number, month: number) {
		const today = dayjs();
		const currentWeek = today.isoWeek();
		return transactions.filter((tx) => {
			const date = dayjs(tx.date);
			return date.year() === year && date.month() === month && date.isoWeek() === currentWeek;
		});
	}
	// Buscar e processar transações
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

				// Agrupar por categoria e calcular totais em BRL
				const catMap: Record<string, { name: string; amount: number; icon: string }> = {};
				let totalIncome = 0;
				let totalExpense = 0;				// Mapeamento de categorias para ícones
				const categoryIcons = {
					"Alimentação": "fast-food-outline",
					"Transporte": "car-outline",
					"Moradia": "home-outline",
					"Entretenimento": "film-outline",
					"Saúde": "medical-outline",
					"Educação": "school-outline",
					"Compras": "cart-outline", 
					"Viagens": "airplane-outline",
					"Serviços": "construct-outline",
					"Outros": "pricetag-outline"
				};
				
				for (const tx of filtered) {
					if (tx.type === "income") {
						totalIncome += tx.amount || 0;
					}
					if (tx.type === "expense") {
						totalExpense += tx.amount || 0;
						const cat = tx.category || "Outros";
						if (!catMap[cat]) {
							// Usar o ícone mapeado ou um padrão se não existir
							const icon = categoryIcons[cat as keyof typeof categoryIcons] || "pricetag-outline";
							catMap[cat] = { name: cat, amount: 0, icon: icon };
						}
						catMap[cat].amount += tx.amount || 0;
					}
				}

				const catArr = Object.entries(catMap).map(([id, v]) => ({ id, ...v }));
				const total = totalIncome - totalExpense;

				// Atualizar estados com valores em BRL
				setCategories(catArr);
				setSummary({
					income: totalIncome,
					expense: totalExpense,
					balance: total,
				});
			} catch (error) {
				console.error('Error fetching transactions:', error);
				setCategories([]);
				setSummary({ income: 0, expense: 0, balance: 0 });
			}
		}		fetchData();
	}, [selectedMonth, selectedYear, selectedRange]);
	
	// Função para converter um valor com tratamento robusto de erros
	const safeConvert = React.useCallback(async (value: number, fromCurrency: any, toCurrency: any): Promise<number> => {
		if (value === 0) return 0;
		if (!value || isNaN(value)) return 0;
		if (fromCurrency === toCurrency) return value;
		
		try {
			const converted = await convertAmount(value, fromCurrency, toCurrency);
			return typeof converted === 'number' && !isNaN(converted) ? converted : value;
		} catch (e) {
			console.error(`Erro na conversão de moeda (${fromCurrency} → ${toCurrency}):`, e);
			return value; // Em caso de erro retorna o valor original
		}
	}, [convertAmount]);
	
	// Função para atualizar os totais convertidos
	const updateTotals = React.useCallback(async () => {
		try {
			if (!summary) {
				setConvertedValues({ totalIncome: 0, totalExpense: 0, balance: 0 });
				return;
			}
			
			// Valores padrão seguros
			const income = typeof summary.income === 'number' ? summary.income : 0;
			const expense = typeof summary.expense === 'number' ? summary.expense : 0;

			// Conversões seguras
			const totalIncome = await safeConvert(income, 'BRL', currency);
			const totalExpense = await safeConvert(expense, 'BRL', currency);
			const balance = totalIncome - totalExpense;
			
			setConvertedValues({
				totalIncome,
				totalExpense,
				balance
			});

			// Atualizar categorias apenas se houver categorias válidas
			if (Array.isArray(categories) && categories.length > 0) {
				try {
					// Criamos uma nova cópia do array para evitar modificar o original
					const updatedCategories = await Promise.all(
						categories.map(async (cat) => {
							if (!cat || typeof cat !== 'object') {
								return { id: 'unknown', name: 'Desconhecido', amount: 0, icon: 'help-outline' };
							}
							
							// Valor seguro para conversão
							const safeAmount = typeof cat.amount === 'number' && !isNaN(cat.amount) ? cat.amount : 0;
							const convertedAmount = await safeConvert(safeAmount, 'BRL', currency);
							
							return {
								...cat,
								amount: convertedAmount
							};
						})
					);
					
					setCategories(updatedCategories);
				} catch (e) {
					console.error("Erro ao processar categorias:", e);
					// Em caso de erro nas conversões, não modificamos as categorias
				}
			}
		} catch (error) {
			console.error("Erro ao converter valores:", error);
			// Valores padrão em caso de erro geral
			setConvertedValues({
				totalIncome: summary?.income || 0,
				totalExpense: summary?.expense || 0,
				balance: (summary?.income || 0) - (summary?.expense || 0)
			});
		}
	}, [summary, currency, categories, safeConvert]);

	useEffect(() => {
		updateTotals();
	}, [updateTotals]);
	const renderTimeRangeSelector = () => (
		<View style={[styles.timeRangeContainer, { backgroundColor: isDark ? theme.background : '#f5f5f5' }]}>
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
						{ color: isDark ? theme.text : '#666' },
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
						{ color: isDark ? theme.text : '#666' },
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
						{ color: isDark ? theme.text : '#666' },
						selectedRange === "year" && { color: "#fff", fontWeight: "bold" },
					]}
				>
					Ano
				</ThemedText>
			</TouchableOpacity>
		</View>
	);
	
	const renderSummaryCard = () => (
		<View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
			<ThemedText style={[styles.summaryTitle, { color: theme.text }]}>Resumo</ThemedText>
			<View style={styles.summaryContent}>
				<View style={styles.summaryItem}>
					<ThemedText style={[styles.summaryLabel, { color: theme.text }]}>Receitas</ThemedText>
					<ThemedText style={[styles.summaryValue, { color: theme.tint }]}>
						{formatCurrency(convertedValues.totalIncome)}
					</ThemedText>
				</View>
				<View style={styles.summaryItem}>
					<ThemedText style={[styles.summaryLabel, { color: theme.text }]}>Despesas</ThemedText>
					<ThemedText style={[styles.summaryValue, { color: theme.error }]}>
						{formatCurrency(convertedValues.totalExpense)}
					</ThemedText>
				</View>
				<View style={styles.summaryItem}>
					<ThemedText style={[styles.summaryLabel, { color: theme.text }]}>Saldo</ThemedText>
					<ThemedText 
						style={[
							styles.summaryValue, 
							{ color: convertedValues.balance >= 0 ? theme.tint : theme.error }
						]}					>
						{formatCurrency(convertedValues.balance)}
					</ThemedText>
				</View>
			</View>
		</View>
	);
	
	const renderCategoryBreakdown = () => {
		// Garantir que categories está definido antes de tudo
		if (!categories || categories.length === 0 || categories.every(cat => !cat || cat.amount <= 0)) {
			return (
				<View style={[styles.categoryCard, { backgroundColor: theme.card }]}>
					<ThemedText style={[styles.categoryTitle, { color: theme.text }]}>
						Despesas por Categoria
					</ThemedText>
					<ThemedText style={[styles.emptyMessage, { color: theme.gray }]}>
						Nenhuma despesa registrada no período
					</ThemedText>
				</View>
			);
		}
				// Garantir que todas as operações são seguras com valores definidos
		const safeCategories = categories || [];
		const validCategories = safeCategories.filter(cat => cat && typeof cat.amount === 'number' && cat.amount > 0);
		
		// Ordenar categorias pelo valor (do maior para o menor) para mostrar na ordem correta
		const sortedCategories = [...validCategories].sort((a, b) => (b.amount || 0) - (a.amount || 0));
		
		const total = sortedCategories.reduce((sum, cat) => sum + Math.max(0, cat.amount || 0), 0);
		
		// Preparar os dados do gráfico com validação completa
		const chartData = sortedCategories.length > 0 
			? sortedCategories.map((cat, index) => {
				// Garantir que nome é string e valor é número positivo
				const catName = cat && cat.name ? String(cat.name) : "Categoria";
				const catAmount = cat && typeof cat.amount === 'number' ? Math.max(0.01, cat.amount) : 0.01;
				
				return {
					name: catName,
					value: catAmount,
					color: chartColors[index % chartColors.length],
				};
			}) 
			: [];

		return (
			<View style={[styles.categoryCard, { backgroundColor: theme.card }]}>
				<ThemedText style={[styles.categoryTitle, { color: theme.text }]}>
					Despesas por Categoria
				</ThemedText>
				
				{total > 0 && chartData.length > 0 && (
					<View style={styles.chartContainer}>
						{/* Versão moderna com design atraente */}
						<SimplePieChart
							data={chartData}
							width={Dimensions.get('window').width - 60}
							height={220}
						/>
					</View>
				)}
				
				<ThemedText style={[styles.sectionTitle, { color: theme.text, marginTop: 5 }]}>
					Detalhamento por Categoria
				</ThemedText>
						<View style={styles.categoryList}>
					{sortedCategories.length > 0 ? (
						// Só processar o map se sortedCategories tiver pelo menos 1 item
						sortedCategories.map((category, index) => {
							// Garantia adicional contra valores indefinidos
							if (!category) return null;
							
							// Valores seguros para cálculos
							const safeAmount = Math.max(category.amount || 0, 0.01);
							const percentage = total > 0 ? ((safeAmount / total) * 100).toFixed(1) : "0.0";
							const safeIcon = category.icon && typeof category.icon === 'string' 
								? category.icon 
								: "pricetag-outline";
							
							return (
								<View key={category.id || `cat-${index}`} style={styles.categoryItem}>
									<View style={styles.categoryInfo}>
										<View 
											style={[
												styles.categoryIcon, 
												{ backgroundColor: chartColors[index % chartColors.length] }
											]}
										>
											<Ionicons 
												name={safeIcon as keyof typeof Ionicons.glyphMap} 
												size={20} 
												color="#fff" 
											/>
										</View>
										<View>
											<ThemedText style={[styles.categoryName, { color: theme.text }]}>
												{category.name || "Categoria"}
											</ThemedText>
											<ThemedText style={[styles.categoryPercentage, { color: theme.gray }]}>
												{percentage}%
											</ThemedText>
										</View>
									</View>
									<ThemedText style={[styles.categoryAmount, { color: theme.text }]}>
										{formatCurrency(safeAmount)}
									</ThemedText>
								</View>
							);
							})
					) : (
						<ThemedText style={[styles.emptyMessage, { color: theme.gray }]}>
							Nenhuma categoria com gastos registrados
						</ThemedText>
					)}
					
					{validCategories.length > 0 && (
						<View style={[styles.totalRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
							<ThemedText style={[styles.totalLabel, { color: theme.text }]}>
								Total de Despesas
							</ThemedText>
							<ThemedText style={[styles.totalAmount, { color: theme.error }]}>
								{formatCurrency(total)}
							</ThemedText>
						</View>
					)}
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom', 'left', 'right']}>
			<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 2 }}>
				<TouchableOpacity
					style={[styles.monthPickerButton, { backgroundColor: theme.tint }]}
					onPress={() => setShowMonthPicker(true)}
					activeOpacity={0.85}
				>
					<Ionicons name="calendar-outline" size={18} color={theme.text} style={{ marginRight: 8 }} />
					<ThemedText style={[styles.monthText, { color: theme.text }]}>
						{MONTHS && selectedMonth >= 0 && selectedMonth < MONTHS.length 
							? MONTHS[selectedMonth] 
							: 'MÊS'} {selectedYear}
					</ThemedText>
					<Ionicons name="chevron-down" size={18} color={theme.text} style={{ marginLeft: 8 }} />
				</TouchableOpacity>
			</View>
			
			<Modal visible={showMonthPicker} animationType="fade" transparent>
				<View style={styles.modalContainer}>
					<View style={[styles.modalContent, { backgroundColor: theme.card }]}>
						<View style={[styles.modalHeader, { backgroundColor: theme.tint }]}>
							<TouchableOpacity onPress={() => setSelectedYear(y => y - 1)}>
								<Ionicons name="chevron-back" size={26} color={theme.text} />
							</TouchableOpacity>
							<ThemedText style={[styles.modalHeaderText, { color: theme.text }]}>{selectedYear}</ThemedText>
							<TouchableOpacity onPress={() => setSelectedYear(y => y + 1)}>
								<Ionicons name="chevron-forward" size={26} color={theme.text} />
							</TouchableOpacity>
						</View>
						
						<View style={[styles.modalGrid, { backgroundColor: isDark ? theme.background : '#f6f6f7' }]}>
							{(MONTHS || []).map((m, idx) => (
								<TouchableOpacity
									key={m || `month-${idx}`}
									style={[
										styles.modalGridItem,
										{
											backgroundColor: idx === selectedMonth ? theme.tint : theme.card,
											shadowColor: idx === selectedMonth ? theme.tint : 'transparent',
											shadowOpacity: idx === selectedMonth ? 0.12 : 0,
											shadowRadius: 6,
											elevation: idx === selectedMonth ? 2 : 0
										}
									]}
									onPress={() => { setSelectedMonth(idx); setShowMonthPicker(false); }}
									activeOpacity={0.85}
								>
									<ThemedText style={{ color: idx === selectedMonth ? theme.text : theme.text, fontWeight: idx === selectedMonth ? 'bold' : 'normal', fontSize: 15 }}>
										{m || ''}
									</ThemedText>
								</TouchableOpacity>
							))}
						</View>
						
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

			<ScrollView 
				style={[styles.container, { backgroundColor: theme.background }]}
				showsVerticalScrollIndicator={false}
			>
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
