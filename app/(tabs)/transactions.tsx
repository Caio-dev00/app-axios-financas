import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import Feather from '@expo/vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from "../TransactionsContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { currencyFormats } from "../services/currencyService";
import type { Transaction } from "../supabaseClient";

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
	filterButtonText: {
		fontSize: 14,
		color: "#666",
	},
	listContent: {
		padding: 16,
	},
	transactionCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 18,
		paddingVertical: 18,
		paddingHorizontal: 20,
		marginBottom: 18,
		shadowColor: '#000',
		shadowOpacity: 0.07,
		shadowRadius: 8,
		elevation: 2,
		gap: 12,
		minHeight: 90,
	},
	cardLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1.5,
		minWidth: 0,
	},
	cardRight: {
		flex: 1,
		alignItems: 'flex-end',
		justifyContent: 'center',
		minWidth: 0,
	},
	cardIconWrap: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: '#f6f6f7',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
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
	cardActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginTop: 8,
	},
	actionBtn: {
		padding: 8,
		borderRadius: 8,
		backgroundColor: '#f6f6f7',
		marginHorizontal: 2,
	},
	cardValue: {
		fontSize: 17,
		fontWeight: 'bold',
		marginBottom: 2,
	},
	incomeValue: {
		color: '#4CAF50',
	},
	expenseValue: {
		color: '#FF5252',
	},
	input: {
		borderWidth: 1,
		borderColor: "#ccc",
		padding: 12,
		borderRadius: 8,
		marginBottom: 16,
	},
	inputModern: {
		backgroundColor: '#f6f6f7',
		borderWidth: 0,
		borderRadius: 12,
		fontSize: 15,
		color: '#222',
		marginBottom: 18,
		paddingHorizontal: 10,
		paddingVertical: 14,
		shadowColor: '#000',
		shadowOpacity: 0.03,
		shadowRadius: 2,
		elevation: 1,
	},
	pickerWrapper: {
		backgroundColor: '#f6f6f7',
		borderRadius: 12,
		marginBottom: 18,
		paddingHorizontal: 4,
		paddingVertical: 2,
	},
	typeButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 14,
		borderRadius: 10,
		backgroundColor: '#f6f6f7',
		marginHorizontal: 2,
	},
	typeButtonText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	checkbox: {
		width: 22,
		height: 22,
		borderWidth: 2,
		borderColor: '#ccc',
		borderRadius: 6,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
		marginRight: 2,
	},
	button: {
		paddingVertical: 14,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		marginHorizontal: 2,
	},
});

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const getMonthYear = (dateStr: string) => {
	const [year, month] = dateStr.split('-');
	return { year: Number(year), month: Number(month) - 1 };
};

export default function TransactionsScreen() {
	const [selectedFilter, setSelectedFilter] = useState<
		"all" | "income" | "expense"
	>("all");
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const theme = Colors[isDark ? "dark" : "light"];

	const { transactions, loading, edit, remove, add } = useTransactions();
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
	const [showDatePicker, setShowDatePicker] = useState(false);
	const today = new Date();
	const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
	const [selectedYear, setSelectedYear] = useState(today.getFullYear());
	const [showMonthPicker, setShowMonthPicker] = useState(false);

	// Filtro de mês/ano nas transações
	const filteredTransactions = transactions.filter((transaction) => {
		const { year, month } = getMonthYear(transaction.date);
		return year === selectedYear && month === selectedMonth && (selectedFilter === 'all' || transaction.type === selectedFilter);
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
		if (!form.title.trim()) return "Título obrigatório";
		const valor = Number(form.amountStr?.replace(",", ".") || "");
		if (!form.amountStr || Number.isNaN(valor) || valor <= 0)
			return "Valor inválido";
		if (!form.date.trim()) return "Data obrigatória";
		if (form.type === "income" && !form.source?.trim())
			return "Origem obrigatória";
		if (form.type === "expense" && !form.category?.trim())
			return "Categoria obrigatória";
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
			let valorFloat = form.amountStr
				? Number.parseFloat(form.amountStr.replace(",", "."))
				: 0;
			
			// Se a moeda atual não for BRL, converte o valor para BRL antes de salvar
			if (currency !== 'BRL') {
				valorFloat = await convertAmount(valorFloat, currency, 'BRL');
			}

			const payload = {
				...form,
				amount: valorFloat,
				notes: form.notes || undefined,
				is_recurring: form.is_recurring || false,
			};if (editing?.id) {
				await edit(editing.id, payload);
			} else {
				await add(payload);
			}
			setModalVisible(false);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (e) {
			setFormError("Não foi possível salvar a transação.");
		}
		setSaving(false);
	};
	const handleDelete = (id: string, type: "income" | "expense") => {
		if (!id) {
			Alert.alert("Erro", "ID da transação inválido.");
			return;
		}

		Alert.alert(
			"Excluir transação",
			"Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.",
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Excluir",
					style: "destructive",
					onPress: async () => {
						try {
							await remove(id, type);
							Alert.alert("Sucesso", "Transação excluída com sucesso!");
						} catch (e) {
							const errorMessage = e instanceof Error ? e.message : "Não foi possível excluir a transação.";
							Alert.alert("Erro", errorMessage);
						}
					},
				},
			]
		);
	};
	const { currency, formatCurrency, convertAmount } = useCurrency();

	const TransactionItem = ({ item }: { item: Transaction }) => {
		const [convertedAmount, setConvertedAmount] = React.useState<number>(item.amount);

		React.useEffect(() => {
			const updateAmount = async () => {
				const converted = await convertAmount(item.amount, 'BRL', currency);
				setConvertedAmount(converted);
			};
			updateAmount();
		}, [item.amount]);

		return (
			<View style={styles.transactionCard}>
				<View style={styles.cardLeft}>
					<View style={styles.cardIconWrap}>
						<Ionicons
							name={item.type === "income" ? "cash-outline" : "cart-outline"}
							size={28}
							color={item.type === "income" ? theme.tint : theme.error}
						/>
					</View>
					<View style={styles.cardInfo}>
						<ThemedText style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
							{item.title?.trim() ? item.title : "Sem título"}
						</ThemedText>
						<ThemedText style={styles.cardCategory} numberOfLines={1} ellipsizeMode="tail">
							{item.type === "income"
								? (item.source?.trim() ? item.source : "Sem categoria")
								: (item.category?.trim() ? item.category : "Sem categoria")}
						</ThemedText>
						<ThemedText style={styles.cardDate} numberOfLines={1} ellipsizeMode="tail">{item.date}</ThemedText>
					</View>
				</View>
				<View style={styles.cardRight}>
					<ThemedText
						style={[
							styles.cardValue,
							item.type === "income" ? styles.incomeValue : styles.expenseValue,
						]}
						numberOfLines={1}
						ellipsizeMode="tail"
					>
						{item.type === "income" ? "+" : "-"}{formatCurrency(convertedAmount)}
					</ThemedText>
					<View style={styles.cardActions}>
						<TouchableOpacity
							onPress={() => item.id && handleDelete(item.id, item.type)}
							style={styles.actionBtn}
							activeOpacity={0.7}
						>
							<Feather name="trash-2" size={20} color={theme.error} />
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => openEditModal(item)}
							style={styles.actionBtn}
							activeOpacity={0.7}
						>
							<Feather name="edit-3" size={20} color={theme.tint} />
						</TouchableOpacity>
					</View>
				</View>
			</View>
		);
	};

	const renderTransaction = ({ item }: { item: Transaction }) => <TransactionItem item={item} />;

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom', 'left', 'right']}>
			<ThemedView style={styles.container}>
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
								borderRadius: 20,
								padding: 28,
								width: "96%",
								maxHeight: "85%",
								shadowColor: theme.tint,
								shadowOpacity: 0.08,
								shadowRadius: 16,
								elevation: 8,
							}}
						>
							<ScrollView showsVerticalScrollIndicator={false}>
								<ThemedText
									style={{ fontSize: 22, fontWeight: "bold", marginBottom: 24, textAlign: "center", color: theme.text }}
								>
									{editing ? "Editar Transação" : "Nova Transação"}
								</ThemedText>

								<TextInput
									style={[styles.input, styles.inputModern]}
									placeholder="Título"
									placeholderTextColor={theme.gray}
									value={form.title}
									onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
									numberOfLines={1}
									textAlignVertical="center"
								/>

								{form.type === "income" ? (
									<TextInput
										style={[styles.input, styles.inputModern]}
										placeholder="Origem (ex: Salário, Investimentos)"
										placeholderTextColor={theme.gray}
										value={form.source || ""}
										onChangeText={(v) => setForm((f) => ({ ...f, source: v, category: v }))}
										numberOfLines={1}
										textAlignVertical="center"
									/>
								) : (
									<View style={styles.pickerWrapper}>
										<Picker
											selectedValue={form.category}
											onValueChange={(v: string) => setForm((f) => ({ ...f, category: v }))}
											style={{ color: form.category ? theme.text : theme.gray }}
										>
											<Picker.Item label="Selecione uma categoria" value="" color={theme.gray} />
											{CATEGORIAS_DESPESA.map((cat) => (
												<Picker.Item
													key={cat.value}
													label={cat.label}
													value={cat.value}
												/>
											))}
										</Picker>
									</View>
								)}								<View style={[styles.inputModern, { flexDirection: 'row', alignItems: 'center' }]}>
									<ThemedText style={{ marginRight: 8, fontSize: 15, color: theme.text }}>
										{currencyFormats[currency].symbol}
									</ThemedText>
									<TextInput
										style={[styles.input, { flex: 1, borderWidth: 0, padding: 0, margin: 0, backgroundColor: 'transparent' }]}
										placeholder="0,00"
										placeholderTextColor={theme.gray}
										value={form.amountStr ?? ""}
										onChangeText={(v) => {
											let valor = v.replace(/[^0-9.,]/g, "");
											const match = valor.match(/^(\d*)([.,]?(\d{0,2})?)?/);
											if (match) valor = match[1] + (match[2] || "");
											setForm((f) => ({ ...f, amountStr: valor }));
										}}
										keyboardType="decimal-pad"
										numberOfLines={1}
										textAlignVertical="center"
									/>
								</View>

								<TouchableOpacity
									style={[styles.input, styles.inputModern, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
									onPress={() => setShowDatePicker(true)}
									activeOpacity={0.8}
								>
									<ThemedText style={{ color: form.date ? theme.text : theme.gray, fontSize: 15 }}>
										{form.date ? form.date.split('-').reverse().join('/') : 'Selecione a data'}
									</ThemedText>
									<Ionicons name="calendar-outline" size={20} color={theme.tint} />
								</TouchableOpacity>

								{showDatePicker && (
									<DateTimePicker
										value={form.date ? new Date(form.date) : new Date()}
										mode="date"
										display="default"
										onChange={(_, selectedDate) => {
											setShowDatePicker(false);
											if (selectedDate) {
												const yyyy = selectedDate.getFullYear();
												const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
												const dd = String(selectedDate.getDate()).padStart(2, '0');
												setForm((f) => ({ ...f, date: `${yyyy}-${mm}-${dd}` }));
											}
										}}
										maximumDate={new Date(2100, 11, 31)}
										minimumDate={new Date(2000, 0, 1)}
									/>
								)}

								{form.type === "expense" && (
									<TextInput
										style={[styles.input, styles.inputModern]}
										placeholder="Observações (opcional)"
										placeholderTextColor={theme.gray}
										value={form.notes || ""}
										onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
										multiline
										numberOfLines={3}
										textAlignVertical="top"
									/>
								)}

								<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, marginTop: 4 }}>
									<TouchableOpacity
										style={[
											styles.checkbox,
											form.is_recurring && { backgroundColor: theme.tint, borderColor: theme.tint },
										]}
										onPress={() => setForm((f) => ({ ...f, is_recurring: !f.is_recurring }))}
										activeOpacity={0.7}
									>
										{form.is_recurring && (
											<Ionicons name="checkmark" size={18} color="#fff" />
										)}
									</TouchableOpacity>
									<ThemedText style={{ marginLeft: 10, color: theme.text, fontSize: 15 }}>
										Transação recorrente
									</ThemedText>
								</View>

								<View style={{ flexDirection: "row", marginVertical: 10, gap: 10 }}>
									<TouchableOpacity
										style={[
											styles.typeButton,
											form.type === "income" && { backgroundColor: theme.tint, shadowColor: theme.tint, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
										]}
										onPress={() => setForm((f) => ({ ...f, type: "income" }))}
										activeOpacity={0.85}
									>
										<Ionicons name="cash-outline" size={18} color={form.type === "income" ? "#fff" : theme.text} style={{ marginRight: 6 }} />
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
											form.type === "expense" && { backgroundColor: theme.error, shadowColor: theme.error, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
										]}
										onPress={() => setForm((f) => ({ ...f, type: "expense" }))}
										activeOpacity={0.85}
									>
										<Ionicons name="cart-outline" size={18} color={form.type === "expense" ? "#fff" : theme.text} style={{ marginRight: 6 }} />
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
									<ThemedText style={{ color: theme.error, marginBottom: 16, textAlign: "center" }}>
										{formError ? String(formError) : ''}
									</ThemedText>
								)}

								<View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
									<TouchableOpacity
										style={[styles.button, { backgroundColor: theme.gray, minWidth: 100, alignItems: "center", shadowColor: theme.gray, shadowOpacity: 0.10, shadowRadius: 6, elevation: 1 }]}
										onPress={() => setModalVisible(false)}
										activeOpacity={0.8}
									>
										<ThemedText style={{ color: "#fff", fontWeight: "bold" }}>Cancelar</ThemedText>
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.button, { backgroundColor: theme.tint, minWidth: 100, alignItems: "center", shadowColor: theme.tint, shadowOpacity: 0.15, shadowRadius: 8, elevation: 2 }]}
										onPress={handleSave}
										disabled={saving}
										activeOpacity={0.8}
									>
										{saving ? (
											<ActivityIndicator color="#fff" />
										) : (
											<ThemedText style={{ color: "#fff", fontWeight: "bold" }}>Salvar</ThemedText>
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
								</TouchableOpacity>							</View>						</View>
					</View>
				</Modal>
			</ThemedView>
		</SafeAreaView>
	);
}
