import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import Feather from '@expo/vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from "@react-native-picker/picker";
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Linking,
	Modal,
	ScrollView,
	StatusBar,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
	useColorScheme
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '../TransactionsContext';
import { getUser } from '../supabaseClient';

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

	const { transactions, loading, add } = useTransactions();
	const [fabMenuVisible, setFabMenuVisible] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [form, setForm] = useState<{
		title: string;
		amount: number;
		type: "income" | "expense";
		category: string;
		date: string;
		source?: string;
		amountStr?: string;
		is_recurring: boolean;
		notes?: string;
	}>(
		{
			title: "",
			amount: 0,
			amountStr: "",
			type: "expense",
			category: "",
			date: new Date().toISOString().slice(0, 10),
			source: "",
			is_recurring: false,
		}
	);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [userName, setUserName] = useState<string>('');
	const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
	const [isPro, setIsPro] = useState(false);
	const [daysLeft, setDaysLeft] = useState<number | null>(null);

	useEffect(() => {
		async function fetchUserName() {
			try {
				const user = await getUser();
				if (user?.id) {
					const supabaseUrl = 'https://yascliotrmqhvqbvrhsc.supabase.co';
					const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc2NsaW90cm1xaHZxYnZyaHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTA3NjksImV4cCI6MjA2MTUyNjc2OX0.Yh2Ebi1n6CPx2mVERHfA7G5w_kaF6_p7OImAF3qRj8o';
					const token = await SecureStore.getItemAsync('supabase_token');
					const { data } = await axios.get(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`, {
						headers: {
							apikey: supabaseAnonKey,
							Authorization: `Bearer ${token}`,
						},
					});
					if (Array.isArray(data) && data[0]?.nome) {
						const firstName = data[0].nome.split(' ')[0];
						setUserName(firstName);
					}
				}
			} catch {}
		}
		fetchUserName();
	}, []);

	// Buscar status da assinatura
	useEffect(() => {
		async function fetchSubscription() {
			try {
				const user = await getUser();
				if (user?.id) {
					const supabaseUrl = 'https://yascliotrmqhvqbvrhsc.supabase.co';
					const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc2NsaW90cm1xaHZxYnZyaHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTA3NjksImV4cCI6MjA2MTUyNjc2OX0.Yh2Ebi1n6CPx2mVERHfA7G5w_kaF6_p7OImAF3qRj8o';
					const token = await SecureStore.getItemAsync('supabase_token');
					const { data } = await axios.get(`${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${user.id}&is_active=eq.true`, {
						headers: {
							apikey: supabaseAnonKey,
							Authorization: `Bearer ${token}`,
						},
					});
					if (Array.isArray(data) && data.length > 0 && data[0].plan_type === 'pro') {
						setIsPro(true);
						if (data[0].expires_at) {
							const expires = new Date(data[0].expires_at);
							const now = new Date();
							const diff = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
							setDaysLeft(diff > 0 ? diff : 0);
						}
					} else {
						setIsPro(false);
						setDaysLeft(null);
					}
				}
			} catch {
				setIsPro(false);
				setDaysLeft(null);
			}
		}
		fetchSubscription();
	}, []);

	const openAddModal = (type: "income" | "expense") => {
		setForm({
			title: "",
			amount: 0,
			type,
			category: "",
			date: new Date().toISOString().slice(0, 10),
			source: "",
			amountStr: "",
			is_recurring: false,
		});
		setModalVisible(true);
		setFabMenuVisible(false);
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
				title: form.title,
				amount: valorFloat,
				type: form.type,
				date: form.date,
				category: form.type === "expense" ? form.category : "",
				source: form.type === "income" ? form.source : undefined,
				is_recurring: form.is_recurring,
				notes: form.notes,
			};
			await add(payload);
			setModalVisible(false);
		} catch (e: unknown) {
			if (e && typeof e === "object" && "message" in e) {
				setFormError((e as { message?: string }).message || "Erro ao salvar transação.");
			} else {
				setFormError("Erro ao salvar transação.");
			}
		}
		setSaving(false);
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
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom', 'left', 'right']}>
			<StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.tint} />
			<View style={[styles.container, { backgroundColor: theme.background }]}>
				{/* Top Bar */}
				<View style={styles.topBar}>
					<ThemedText style={[styles.topBarTitle, { color: theme.text }]}>Bem-vindo{userName ? `, ${userName}` : ''}</ThemedText>
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
						<TouchableOpacity style={styles.topBarIconBtn} onPress={() => setShowSubscriptionModal(true)}>
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
								<View style={styles.loadingContainer}>
									<Feather name="loader" size={36} color={theme.tint} style={{ opacity: 0.7, transform: [{ rotate: '0deg' }] }} />
								</View>
							) : transactions.length === 0 ? (
								<ThemedText>Nenhuma transação encontrada.</ThemedText>
							) : (
								transactions.slice(0, 5).map((tx) => (
									<View
										key={tx.id}
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
												{tx.title?.trim() ? tx.title : "Sem título"}
											</ThemedText>
											<ThemedText style={styles.cardCategory} numberOfLines={1} ellipsizeMode="tail">
												{tx.type === "income"
													? (tx.source?.trim() ? tx.source : "Sem categoria")
													: (tx.category?.trim() ? tx.category : "Sem categoria")}
											</ThemedText>
											<ThemedText style={styles.cardDate}>{tx.date}</ThemedText>
										</View>
										<ThemedText
											style={[
												styles.cardValue,
												tx.type === "income" ? { color: '#4CAF50' } : { color: '#FF5252' },
											]}
										>
											{tx.type === "income" ? "+" : "-"}R$ {tx.amount.toFixed(2)}
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
									{form.type === "income" ? "Nova Receita" : "Nova Despesa"}
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
											{CATEGORIAS_PADRAO.map((cat) => (
												<Picker.Item
													key={cat.value}
													label={cat.label}
													value={cat.value}
												/>
											))}
										</Picker>
									</View>
								)}
								<TextInput
									style={[styles.input, styles.inputModern]}
									placeholder="Valor"
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
									<ThemedText style={{ marginLeft: 10, color: theme.text, fontSize: 15 }}>Transação recorrente</ThemedText>
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
										{formError}
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
				<Modal visible={showSubscriptionModal} animationType="slide" transparent>
					<View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
						<View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '92%', maxWidth: 400, alignItems: 'center', shadowColor: theme.tint, shadowOpacity: 0.10, shadowRadius: 16, elevation: 8 }}>
							<ThemedText style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>Gerenciar Assinatura</ThemedText>
							<Ionicons name={isPro ? 'star' : 'star-outline'} size={38} color={isPro ? theme.tint : '#888'} style={{ marginBottom: 10 }} />
							<ThemedText style={{ fontSize: 17, color: theme.text, marginBottom: 8 }}>
								Plano atual: <ThemedText style={{ fontWeight: 'bold', color: isPro ? theme.tint : '#888' }}>{isPro ? 'PRO' : 'Free'}</ThemedText>
							</ThemedText>
							{isPro && (
								<ThemedText style={{ color: theme.text, marginBottom: 8 }}>Dias restantes: <ThemedText style={{ fontWeight: 'bold', color: theme.tint }}>{daysLeft ?? '--'}</ThemedText></ThemedText>
							)}
							{!isPro && (
								<>
									<ThemedText style={{ color: theme.text, marginBottom: 16, textAlign: 'center' }}>Desbloqueie recursos avançados e tenha uma experiência completa:</ThemedText>
									<View style={{ alignItems: 'flex-start', marginBottom: 16 }}>
										<ThemedText style={{ color: theme.tint, fontWeight: 'bold', marginBottom: 4 }}>• Exportação de relatórios</ThemedText>
										<ThemedText style={{ color: theme.tint, fontWeight: 'bold', marginBottom: 4 }}>• Categorias ilimitadas</ThemedText>
										<ThemedText style={{ color: theme.tint, fontWeight: 'bold', marginBottom: 4 }}>• Suporte prioritário</ThemedText>
										<ThemedText style={{ color: theme.tint, fontWeight: 'bold', marginBottom: 4 }}>• E muito mais!</ThemedText>
									</View>
									<TouchableOpacity style={{ backgroundColor: theme.tint, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 10 }} onPress={() => Linking.openURL('https://pay.cakto.com.br/3bnjhuj_366904')}>
										<ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Assinar PRO</ThemedText>
									</TouchableOpacity>
								</>
							)}
							{isPro && (
								<ThemedText style={{ color: theme.tint, fontWeight: 'bold', marginTop: 10 }}>Obrigado por ser PRO!</ThemedText>
							)}
							<TouchableOpacity style={{ marginTop: 18 }} onPress={() => setShowSubscriptionModal(false)}>
								<ThemedText style={{ color: theme.error, fontWeight: 'bold', fontSize: 15 }}>Fechar</ThemedText>
							</TouchableOpacity>
						</View>
					</View>
				</Modal>
			</View>
		</SafeAreaView>
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
		gap: 12,
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
		borderColor: "gray",
		borderWidth: 1,
		marginBottom: 12,
		padding: 11,
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
	button: {
		paddingVertical: 14,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		marginHorizontal: 2,
	},
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40,
	},
});
