// @ts-ignore
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { type Transaction, getTransacoes } from "../supabaseClient";

type TimeRange = "week" | "month" | "year";

type Category = {
	id: string;
	name: string;
	amount: number;
	icon: string;
};

export default function ReportsScreen() {
	const [selectedRange, setSelectedRange] = useState<TimeRange>("month");
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const theme = Colors[isDark ? "dark" : "light"];

	const [categories, setCategories] = useState<Category[]>([]);
	const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		async function fetchData() {
			try {
				const transacoes: Transaction[] = await getTransacoes();
				// Agrupar por categoria e calcular totais
				const catMap: Record<
					string,
					{ name: string; amount: number; icon: string }
				> = {};
				let totalIncome = 0;
				let totalExpense = 0;
				for (const tx of transacoes) {
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
				setCategories([]);
				setSummary({ income: 0, expense: 0, balance: 0 });
			}
		}
		fetchData();
	}, [selectedRange]);

	const renderTimeRangeSelector = () => (
		<View style={styles.timeRangeContainer}>
			<TouchableOpacity
				style={[
					styles.timeRangeButton,
					selectedRange === "week" && { backgroundColor: theme.tint },
				]}
				onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					setSelectedRange("week");
				}}
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
				onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					setSelectedRange("month");
				}}
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
				onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					setSelectedRange("year");
				}}
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
		return (
			<View style={styles.categoryCard}>
				<ThemedText style={styles.categoryTitle}>Despesas por Categoria</ThemedText>
				<View style={styles.categoryList}>
					{categories.map((category: Category) => {
						const percentage = totalExpense > 0 ? Math.round((category.amount / totalExpense) * 100) : 0;
						return (
							<View key={category.id} style={styles.categoryItem}>
								<View style={styles.categoryInfo}>
									<View style={styles.categoryIcon}>
										<Ionicons name={category.icon as keyof typeof Ionicons.glyphMap} size={20} color="#0a7ea4" />
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
		<ScrollView style={styles.container}>
			<ThemedView style={styles.content}>
				{renderTimeRangeSelector()}
				{renderSummaryCard()}
				{renderCategoryBreakdown()}
			</ThemedView>
		</ScrollView>
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
