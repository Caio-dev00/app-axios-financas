import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
	Modal,
	ScrollView,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
	useColorScheme,
} from "react-native";
import {
	type Transaction,
	addTransacao,
	deleteTransacao,
	getTransacoes,
} from "../supabaseClient";

const CATEGORIAS_PADRAO = [
	{ label: "Alimentação", value: "Alimentação" },
	{ label: "Moradia", value: "Moradia" },
	{ label: "Transporte", value: "Transporte" },
	{ label: "Saúde", value: "Saúde" },
	{ label: "Educação", value: "Educação" },
	{ label: "Lazer", value: "Lazer" },
	{ label: "Vestuário", value: "Vestuário" },
	{ label: "Serviços", value: "Serviços" },
	{ label: "Outros", value: "Outros" },
];

export default function DashboardScreen() {
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const theme = Colors[isDark ? "dark" : "light"];

	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [fabMenuVisible, setFabMenuVisible] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [form, setForm] = useState<{
		title: string;
		amount: number;
		type: "income" | "expense";
		category: string;
		date: string;
	}>({
		title: "",
		amount: 0,
		type: "expense",
		category: "",
		date: new Date().toISOString().slice(0, 10),
	});
	const [saving, setSaving] = useState(false);

	const fetchTransactions = async () => {
		setLoading(true);
		try {
			const data = await getTransacoes();
			setTransactions(data as Transaction[]);
		} catch (error) {
			setTransactions([]);
			console.log(error);
		}
		setLoading(false);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		fetchTransactions();
	}, []);

	const openAddModal = (type: "income" | "expense") => {
		setForm({
			title: "",
			amount: 0,
			type,
			category: "",
			date: new Date().toISOString().slice(0, 10),
		});
		setModalVisible(true);
		setFabMenuVisible(false);
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			await addTransacao({
				title: form.title,
				type: form.type,
				category: form.category,
				date: form.date,
				amount: form.amount,
			});
			setModalVisible(false);
			fetchTransactions();
		} catch (e: unknown) {
			if (e && typeof e === "object" && "message" in e) {
				alert(
					(e as { message?: string }).message || "Erro ao salvar transação.",
				);
			} else {
				alert("Erro ao salvar transação.");
			}
		}
		setSaving(false);
	};

	const handleDelete = async (id: string, type: "income" | "expense") => {
		try {
			await deleteTransacao(id, type);
			fetchTransactions();
		} catch (e) {
			alert("Erro ao excluir transação.");
		}
	};

	// Calcular receitas, despesas e saldo dinamicamente
	const totalIncome = transactions
		.filter((t) => t.type === "income")
		.reduce((sum, t) => sum + (t.amount || 0), 0);
	const totalExpense = transactions
		.filter((t) => t.type === "expense")
		.reduce((sum, t) => sum + (t.amount || 0), 0);
	const balance = totalIncome - totalExpense;

	return (
		<View style={[styles.container, { backgroundColor: theme.background }]}>
			{/* Top Bar */}
			<View style={styles.topBar}>
				<ThemedText style={[styles.topBarTitle, { color: theme.text }]}>
					Principal
				</ThemedText>
				<View style={styles.topBarIcons}>
					<TouchableOpacity style={styles.topBarIconBtn}>
						<Ionicons
							name="notifications-outline"
							size={22}
							color={theme.tint}
						/>
						<View
							style={[
								styles.notificationBadge,
								{ backgroundColor: theme.tint },
							]}
						>
							<ThemedText style={styles.badgeText}>1</ThemedText>
						</View>
					</TouchableOpacity>
					<TouchableOpacity style={styles.topBarIconBtn}>
						<Ionicons name="settings-outline" size={22} color={theme.tint} />
					</TouchableOpacity>
				</View>
			</View>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Card de Saldo */}
				<View style={[styles.balanceCard, { backgroundColor: theme.card }]}>
					<ThemedText style={[styles.balanceLabel, { color: theme.gray }]}>
						Saldo em contas
					</ThemedText>
					<ThemedText style={[styles.balanceValue, { color: theme.text }]}>
						R$ {balance.toFixed(2)}
					</ThemedText>
					<View style={styles.balanceRow}>
						<View style={styles.balanceItem}>
							<Ionicons
								name="arrow-up-circle-outline"
								size={20}
								color={theme.tint}
							/>
							<ThemedText style={[styles.incomeLabel, { color: theme.gray }]}>
								Receitas
							</ThemedText>
							<ThemedText style={[styles.incomeValue, { color: theme.tint }]}>
								R$ {totalIncome.toFixed(2)}
							</ThemedText>
						</View>
						<View style={styles.balanceItem}>
							<Ionicons
								name="arrow-down-circle-outline"
								size={20}
								color={theme.error}
							/>
							<ThemedText style={[styles.expenseLabel, { color: theme.gray }]}>
								Despesas
							</ThemedText>
							<ThemedText style={[styles.expenseValue, { color: theme.error }]}>
								R$ {totalExpense.toFixed(2)}
							</ThemedText>
						</View>
					</View>
				</View>
				{/* Lista de transações recentes */}
				<View style={styles.section}>
					<ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
						Transações Recentes
					</ThemedText>
					<View style={styles.transactionList}>
						{loading ? (
							<ThemedText>Carregando...</ThemedText>
						) : transactions.length === 0 ? (
							<ThemedText>Nenhuma transação encontrada.</ThemedText>
						) : (
							transactions.map((tx) => (
								<View
									key={tx.id}
									style={[
										styles.transactionItem,
										{ backgroundColor: theme.card },
									]}
								>
									<Ionicons
										name={
											tx.type === "income" ? "cash-outline" : "cart-outline"
										}
										size={22}
										color={theme.tint}
										style={styles.transactionIcon}
									/>
									<View style={styles.transactionInfo}>
										<ThemedText
											style={[styles.transactionTitle, { color: theme.text }]}
											numberOfLines={1}
											ellipsizeMode="tail"
										>
											{tx.title?.trim() ? tx.title : "Sem título"}
										</ThemedText>
										<ThemedText
											style={{ color: theme.gray, fontSize: 13, marginTop: 2 }}
											numberOfLines={1}
											ellipsizeMode="tail"
										>
											{tx.category?.trim() ? tx.category : "Sem categoria"}
										</ThemedText>
										<ThemedText
											style={[styles.transactionDate, { color: theme.gray }]}
										>
											{tx.date}
										</ThemedText>
									</View>
									<TouchableOpacity
										onPress={() => handleDelete(tx.id || "", tx.type)}
									>
										<Ionicons
											name="trash-outline"
											size={20}
											color={theme.error}
										/>
									</TouchableOpacity>
									<ThemedText
										style={[
											tx.type === "income"
												? styles.incomeValue
												: styles.expenseValue,
											{
												color: tx.type === "income" ? theme.tint : theme.error,
											},
										]}
									>
										R$ {tx.amount}
									</ThemedText>
								</View>
							))
						)}
					</View>
				</View>
			</ScrollView>
			{/* Botão flutuante de ação */}
			<TouchableOpacity
				style={[styles.fab, { backgroundColor: theme.tint }]}
				onPress={() => setFabMenuVisible(true)}
			>
				<Ionicons name="add" size={32} color="#fff" />
			</TouchableOpacity>
			{/* Menu do FAB */}
			<Modal visible={fabMenuVisible} animationType="fade" transparent>
				<View
					style={{
						flex: 1,
						backgroundColor: "rgba(0,0,0,0.2)",
						justifyContent: "flex-end",
					}}
				>
					<View
						style={{
							backgroundColor: "#fff",
							borderTopLeftRadius: 20,
							borderTopRightRadius: 20,
							padding: 24,
						}}
					>
						<TouchableOpacity
							style={{
								flexDirection: "row",
								alignItems: "center",
								marginBottom: 24,
							}}
							onPress={() => openAddModal("income")}
						>
							<Ionicons
								name="add-circle-outline"
								size={28}
								color={theme.tint}
								style={{ marginRight: 12 }}
							/>
							<ThemedText style={{ fontSize: 18, color: theme.tint }}>
								Adicionar Receita
							</ThemedText>
						</TouchableOpacity>
						<TouchableOpacity
							style={{ flexDirection: "row", alignItems: "center" }}
							onPress={() => openAddModal("expense")}
						>
							<Ionicons
								name="remove-circle-outline"
								size={28}
								color={theme.error}
								style={{ marginRight: 12 }}
							/>
							<ThemedText style={{ fontSize: 18, color: theme.error }}>
								Adicionar Despesa
							</ThemedText>
						</TouchableOpacity>
						<TouchableOpacity
							style={{ alignItems: "center", marginTop: 24 }}
							onPress={() => setFabMenuVisible(false)}
						>
							<ThemedText style={{ color: theme.error }}>Cancelar</ThemedText>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
			{/* Modal de adicionar transação */}
			<Modal visible={modalVisible} animationType="slide" transparent>
				<View
					style={{
						flex: 1,
						backgroundColor: "rgba(0,0,0,0.2)",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<View
						style={{
							backgroundColor: "#fff",
							borderRadius: 16,
							padding: 24,
							width: "90%",
						}}
					>
						<ThemedText
							style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}
						>
							{form.type === "income" ? "Nova Receita" : "Nova Despesa"}
						</ThemedText>
						<TextInput
							style={styles.input}
							placeholder="Título"
							value={form.title}
							onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
						/>
						<Picker
							selectedValue={form.category}
							onValueChange={(v: string) =>
								setForm((f) => ({ ...f, category: v }))
							}
							style={{ marginBottom: 16 }}
						>
							<Picker.Item label="Selecione uma categoria" value="" />
							{CATEGORIAS_PADRAO.map((cat) => (
								<Picker.Item
									key={cat.value}
									label={cat.label}
									value={cat.value}
								/>
							))}
						</Picker>
						<TextInput
							style={styles.input}
							placeholder="Valor"
							value={form.amount ? String(form.amount) : ""}
							onChangeText={(v) => {
								const valor = v.replace(",", ".");
								setForm((f) => ({
									...f,
									amount: Number.parseFloat(valor) || 0,
								}));
							}}
							keyboardType="decimal-pad"
						/>
						<TextInput
							style={styles.input}
							placeholder="Data (YYYY-MM-DD)"
							value={form.date}
							onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
						/>
						<View
							style={{
								flexDirection: "row",
								justifyContent: "flex-end",
								marginTop: 16,
							}}
						>
							<TouchableOpacity
								onPress={() => setModalVisible(false)}
								style={{ marginRight: 16 }}
							>
								<ThemedText style={{ color: theme.error }}>Cancelar</ThemedText>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleSave}
								disabled={saving}
								style={{
									backgroundColor: theme.tint,
									borderRadius: 8,
									paddingHorizontal: 18,
									paddingVertical: 8,
								}}
							>
								<ThemedText style={{ color: "#fff", fontWeight: "bold" }}>
									{saving ? "Salvando..." : "Salvar"}
								</ThemedText>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	topBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingTop: 18,
		paddingBottom: 10,
	},
	topBarTitle: {
		fontSize: 22,
		fontWeight: "bold",
	},
	topBarIcons: {
		flexDirection: "row",
		alignItems: "center",
	},
	topBarIconBtn: {
		marginLeft: 16,
		position: "relative",
	},
	notificationBadge: {
		position: "absolute",
		top: -6,
		right: -6,
		borderRadius: 8,
		minWidth: 16,
		height: 16,
		alignItems: "center",
		justifyContent: "center",
		zIndex: 2,
	},
	badgeText: {
		color: "#fff",
		fontSize: 10,
		fontWeight: "bold",
	},
	scrollContent: {
		padding: 20,
		paddingBottom: 100,
	},
	balanceCard: {
		borderRadius: 18,
		padding: 22,
		marginBottom: 24,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 2,
	},
	balanceLabel: {
		fontSize: 15,
		opacity: 0.8,
	},
	balanceValue: {
		fontSize: 32,
		fontWeight: "bold",
		marginTop: 8,
		marginBottom: 12,
	},
	balanceRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 8,
	},
	balanceItem: {
		flex: 1,
		alignItems: "center",
	},
	incomeLabel: {
		fontSize: 13,
		marginTop: 2,
	},
	incomeValue: {
		fontWeight: "bold",
		fontSize: 15,
		marginTop: 2,
	},
	expenseLabel: {
		fontSize: 13,
		marginTop: 2,
	},
	expenseValue: {
		fontWeight: "bold",
		fontSize: 15,
		marginTop: 2,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 12,
	},
	transactionList: {
		gap: 12,
	},
	transactionItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		borderRadius: 12,
		marginBottom: 8,
	},
	transactionIcon: {
		marginRight: 12,
	},
	transactionInfo: {
		flex: 1,
	},
	transactionTitle: {
		fontSize: 16,
		fontWeight: "500",
	},
	transactionDate: {
		fontSize: 13,
		opacity: 0.6,
		marginTop: 2,
	},
	fab: {
		position: "absolute",
		bottom: 28,
		alignSelf: "center",
		width: 64,
		height: 64,
		borderRadius: 32,
		alignItems: "center",
		justifyContent: "center",
		elevation: 6,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.18,
		shadowRadius: 8,
	},
	input: {
		height: 40,
		borderColor: "gray",
		borderWidth: 1,
		marginBottom: 12,
		padding: 10,
	},
});
