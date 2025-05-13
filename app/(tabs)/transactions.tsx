import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
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
	updateTransacao,
} from "../supabaseClient";

const CATEGORIAS_DESPESA = [
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

const CATEGORIAS_RECEITA = [
	{ label: "Salário", value: "Salário" },
	{ label: "Freelance", value: "Freelance" },
	{ label: "Investimentos", value: "Investimentos" },
	{ label: "Prêmios", value: "Prêmios" },
	{ label: "Presentes", value: "Presentes" },
	{ label: "Outros", value: "Outros" },
];

export default function TransactionsScreen() {
	const [selectedFilter, setSelectedFilter] = useState<
		"all" | "income" | "expense"
	>("all");
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const theme = Colors[isDark ? "dark" : "light"];
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [modalVisible, setModalVisible] = useState(false);
	const [editing, setEditing] = useState<Transaction | null>(null);
	const [form, setForm] = useState<
		Omit<Transaction, "id"> & { 
			source?: string; 
			amountStr?: string;
			notes?: string;
			is_recurring?: boolean;
		}
	>({
		title: "",
		amount: 0,
		amountStr: "",
		type: "expense",
		category: "",
		date: new Date().toISOString().slice(0, 10),
		source: "",
		notes: "",
		is_recurring: false,
	});
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	useEffect(() => {
		fetchData();
	}, []);

	async function fetchData() {
		setLoading(true);
		try {
			const data = await getTransacoes();
			setTransactions(data);
		} catch (e) {
			setTransactions([]);
		}
		setLoading(false);
	}

	const filteredTransactions = transactions.filter((transaction) => {
		if (selectedFilter === "all") return true;
		return transaction.type === selectedFilter;
	});

	const openAddModal = () => {
		setEditing(null);
		setForm({
			title: "",
			amount: 0,
			amountStr: "",
			type: "expense",
			category: "",
			date: new Date().toISOString().slice(0, 10),
			source: "",
			notes: "",
			is_recurring: false,
		});
		setModalVisible(true);
	};

	const openEditModal = (tx: Transaction) => {
		setEditing(tx);
		setForm({
			title: tx.title,
			amount: tx.amount,
			amountStr: String(tx.amount).replace(".", ","),
			type: tx.type,
			category: tx.type === "income" ? tx.source || "" : tx.category,
			date: tx.date,
			source: tx.type === "income" ? tx.source || "" : "",
			notes: tx.notes || "",
			is_recurring: tx.is_recurring || false,
		});
		setModalVisible(true);
	};

	const validateForm = () => {
		if (!form.title.trim()) return 'Título obrigatório';
		const valor = Number(form.amountStr?.replace(',', '.') || '');
		if (!form.amountStr || Number.isNaN(valor) || valor <= 0) return 'Valor inválido';
		if (!form.date.trim()) return 'Data obrigatória';
		if (form.type === 'income' && !form.source?.trim()) return 'Origem obrigatória';
		if (form.type === 'expense' && !form.category?.trim()) return 'Categoria obrigatória';
		return null;
	};

	const handleSave = async () => {
		setFormError(null);
		const error = validateForm();
		if (error) {
			setFormError(error);
			setSaving(false);
			return;
		}
		setSaving(true);
		try {
			const valorFloat = form.amountStr
				? Number.parseFloat(form.amountStr.replace(",", "."))
				: 0;
			const payload = { 
				...form, 
				amount: valorFloat,
				notes: form.notes || undefined,
				is_recurring: form.is_recurring || false,
			};

			console.log('=== DADOS DO FORMULÁRIO ===');
			console.log('Tipo:', form.type);
			console.log('Título:', form.title);
			console.log('Valor:', valorFloat);
			console.log('Categoria:', form.category);
			console.log('Source:', form.source);
			console.log('Data:', form.date);
			console.log('Notas:', form.notes);
			console.log('Recorrente:', form.is_recurring);
			console.log('Payload completo:', payload);

			if (editing?.id) {
				console.log('=== EDITANDO TRANSAÇÃO ===');
				console.log('ID:', editing.id);
				console.log('Tipo original:', editing.type);
				const result = await updateTransacao(editing.id, payload);
				console.log('Resultado da atualização:', result);
			} else {
				console.log('=== NOVA TRANSAÇÃO ===');
				const result = await addTransacao(payload);
				console.log('Resultado da criação:', result);
			}
			setModalVisible(false);
			fetchData();
		} catch (e) {
			console.error('=== ERRO AO SALVAR ===');
			console.error('Erro completo:', e);
			setFormError("Não foi possível salvar a transação.");
		}
		setSaving(false);
	};

	const handleDelete = (id: string, type: "income" | "expense") => {
		Alert.alert("Excluir", "Deseja realmente excluir esta transação?", [
			{ text: "Cancelar", style: "cancel" },
			{
				text: "Excluir",
				style: "destructive",
				onPress: async () => {
					try {
						await deleteTransacao(id, type);
						fetchData();
					} catch (e) {
						Alert.alert("Erro", "Não foi possível excluir.");
					}
				},
			},
		]);
	};

	const renderTransaction = ({ item }: { item: Transaction }) => (
		<TouchableOpacity
			style={styles.transactionItem}
			onPress={() => openEditModal(item)}
			onLongPress={() => item.id && handleDelete(item.id, item.type)}
		>
			<View style={styles.transactionIcon}>
				<Ionicons
					name={item.type === "income" ? "cash-outline" : "cart-outline"}
					size={24}
					color={item.type === "income" ? "#4CAF50" : "#0a7ea4"}
				/>
			</View>
			<View style={styles.transactionInfo}>
				<ThemedText
					style={styles.transactionTitle}
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{item.title?.trim() ? item.title : "Sem título"}
				</ThemedText>
				<ThemedText
					style={styles.transactionCategory}
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{item.category?.trim() ? item.category : "Sem categoria"}
				</ThemedText>
				<ThemedText style={styles.transactionDate}>{item.date}</ThemedText>
			</View>
			<View style={styles.transactionAmount}>
				<ThemedText
					style={[
						styles.transactionValue,
						item.type === "income" ? styles.income : styles.expense,
					]}
				>
					{item.type === "income" ? "+" : "-"}R$ {item.amount.toFixed(2)}
				</ThemedText>
			</View>
			<TouchableOpacity onPress={() => openEditModal(item)} style={{ marginLeft: 8 }}>
				<Ionicons name="pencil-outline" size={20} color="#888" />
			</TouchableOpacity>
		</TouchableOpacity>
	);

	return (
		<ThemedView style={styles.container}>
			{/* Filter Buttons */}
			<View style={styles.filterContainer}>
				<TouchableOpacity
					style={[
						styles.filterButton,
						selectedFilter === "all" && { backgroundColor: theme.tint },
					]}
					onPress={() => setSelectedFilter("all")}
				>
					<ThemedText
						style={[
							styles.filterButtonText,
							selectedFilter === "all" && { color: "#fff", fontWeight: "bold" },
						]}
					>
						Todos
					</ThemedText>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.filterButton,
						selectedFilter === "income" && { backgroundColor: theme.tint },
					]}
					onPress={() => setSelectedFilter("income")}
				>
					<ThemedText
						style={[
							styles.filterButtonText,
							selectedFilter === "income" && {
								color: "#fff",
								fontWeight: "bold",
							},
						]}
					>
						Receitas
					</ThemedText>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.filterButton,
						selectedFilter === "expense" && { backgroundColor: theme.tint },
					]}
					onPress={() => setSelectedFilter("expense")}
				>
					<ThemedText
						style={[
							styles.filterButtonText,
							selectedFilter === "expense" && {
								color: "#fff",
								fontWeight: "bold",
							},
						]}
					>
						Despesas
					</ThemedText>
				</TouchableOpacity>
			</View>

			{/* Transactions List */}
			{loading ? (
				<ActivityIndicator
					size="large"
					color={theme.tint}
					style={{ marginTop: 40 }}
				/>
			) : (
				<FlatList
					data={filteredTransactions}
					renderItem={renderTransaction}
					keyExtractor={(item) => item.id ?? ""}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
				/>
			)}

			{/* Add/Edit Modal */}
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
							maxHeight: "80%",
						}}
					>
						<ScrollView>
							<ThemedText
								style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}
							>
								{editing ? "Editar" : "Nova"} Transação
							</ThemedText>

							<TextInput
								style={styles.input}
								placeholder="Título"
								value={form.title}
								onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
							/>

							{form.type === "income" ? (
								<TextInput
									style={styles.input}
									placeholder="Origem (ex: Salário, Investimentos)"
									value={form.source || ""}
									onChangeText={(v) =>
										setForm((f) => ({ ...f, source: v, category: v }))
									}
								/>
							) : (
								<Picker
									selectedValue={form.category}
									onValueChange={(v: string) =>
										setForm((f) => ({ ...f, category: v }))
									}
									style={{ marginBottom: 16 }}
								>
									<Picker.Item label="Selecione uma categoria" value="" />
									{CATEGORIAS_DESPESA.map((cat) => (
										<Picker.Item
											key={cat.value}
											label={cat.label}
											value={cat.value}
										/>
									))}
								</Picker>
							)}

							<TextInput
								style={styles.input}
								placeholder="Valor"
								value={form.amountStr ?? ""}
								onChangeText={(v) => {
									let valor = v.replace(/[^0-9.,]/g, "");
									const match = valor.match(/^(\d*)([.,]?(\d{0,2})?)?/);
									if (match) valor = match[1] + (match[2] || "");
									setForm((f) => ({ ...f, amountStr: valor }));
								}}
								keyboardType="decimal-pad"
							/>

							<TextInput
								style={styles.input}
								placeholder="Data (YYYY-MM-DD)"
								value={form.date}
								onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
							/>

							{form.type === "expense" && (
								<TextInput
									style={styles.input}
									placeholder="Observações (opcional)"
									value={form.notes || ""}
									onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
									multiline
									numberOfLines={3}
								/>
							)}

							<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
								<TouchableOpacity
									style={[
										styles.checkbox,
										form.is_recurring && { backgroundColor: theme.tint },
									]}
									onPress={() =>
										setForm((f) => ({ ...f, is_recurring: !f.is_recurring }))
									}
								>
									{form.is_recurring && (
										<Ionicons name="checkmark" size={16} color="#fff" />
									)}
								</TouchableOpacity>
								<ThemedText style={{ marginLeft: 8 }}>Transação recorrente</ThemedText>
							</View>

							<View style={{ flexDirection: "row", marginVertical: 8 }}>
								<TouchableOpacity
									style={[
										styles.typeButton,
										form.type === "income" && { backgroundColor: theme.tint },
									]}
									onPress={() => setForm((f) => ({ ...f, type: "income" }))}
								>
									<ThemedText
										style={[
											styles.typeButtonText,
											form.type === "income" && { color: "#fff" },
										]}
									>
										Receita
									</ThemedText>
								</TouchableOpacity>
								<TouchableOpacity
									style={[
										styles.typeButton,
										form.type === "expense" && { backgroundColor: theme.tint },
									]}
									onPress={() => setForm((f) => ({ ...f, type: "expense" }))}
								>
									<ThemedText
										style={[
											styles.typeButtonText,
											form.type === "expense" && { color: "#fff" },
										]}
									>
										Despesa
									</ThemedText>
								</TouchableOpacity>
							</View>

							{formError && (
								<ThemedText style={{ color: "red", marginBottom: 16 }}>
									{formError}
								</ThemedText>
							)}

							<View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
								<TouchableOpacity
									style={[styles.button, { backgroundColor: "#ccc" }]}
									onPress={() => setModalVisible(false)}
								>
									<ThemedText style={{ color: "#fff" }}>Cancelar</ThemedText>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.button, { backgroundColor: theme.tint }]}
									onPress={handleSave}
									disabled={saving}
								>
									{saving ? (
										<ActivityIndicator color="#fff" />
									) : (
										<ThemedText style={{ color: "#fff" }}>Salvar</ThemedText>
									)}
								</TouchableOpacity>
							</View>
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Botão flutuante para adicionar */}
			<TouchableOpacity
				style={{
					position: "absolute",
					bottom: 32,
					right: 32,
					backgroundColor: theme.tint,
					width: 56,
					height: 56,
					borderRadius: 28,
					alignItems: "center",
					justifyContent: "center",
					elevation: 4,
				}}
				onPress={openAddModal}
			>
				<Ionicons name="add" size={32} color="#fff" />
			</TouchableOpacity>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	filterContainer: {
		flexDirection: "row",
		padding: 16,
		gap: 8,
	},
	filterButton: {
		flex: 1,
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
		backgroundColor: "#f5f5f5",
		alignItems: "center",
	},
	filterButtonActive: {
		backgroundColor: "#0a7ea4",
	},
	filterButtonText: {
		fontSize: 14,
		color: "#666",
	},
	filterButtonTextActive: {
		color: "#fff",
		fontWeight: "500",
	},
	listContent: {
		padding: 16,
	},
	transactionItem: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f5f5f5",
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
	},
	transactionIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#fff",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	transactionInfo: {
		flex: 1,
	},
	transactionTitle: {
		fontSize: 16,
		fontWeight: "500",
	},
	transactionCategory: {
		fontSize: 14,
		opacity: 0.6,
		marginTop: 2,
	},
	transactionAmount: {
		alignItems: "flex-end",
	},
	transactionValue: {
		fontSize: 16,
		fontWeight: "bold",
	},
	transactionDate: {
		fontSize: 12,
		opacity: 0.6,
		marginTop: 2,
	},
	income: {
		color: "#4CAF50",
	},
	expense: {
		color: "#FF5252",
	},
	input: {
		borderWidth: 1,
		borderColor: "#ccc",
		padding: 12,
		borderRadius: 8,
		marginBottom: 16,
	},
	typeButton: {
		flex: 1,
		padding: 12,
		borderRadius: 8,
		backgroundColor: "#f5f5f5",
		alignItems: "center",
	},
	typeButtonText: {
		fontSize: 14,
		fontWeight: "bold",
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 4,
		borderWidth: 2,
		borderColor: "#ccc",
		justifyContent: "center",
		alignItems: "center",
	},
	button: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
		minWidth: 80,
		alignItems: "center",
	},
});
