import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { getProfile, updateProfile } from '../supabaseClient';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { currency, setCurrency, exchangeRate } = useCurrency();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [showEditModal, setShowEditModal] = useState(false);
  const [nome, setNome] = useState('');
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (showEditModal) {
      loadProfile();
    }
  }, [showEditModal]);

  const loadProfile = async () => {
    try {
      const profile = await getProfile();
      if (profile) {
        setNome(profile.nome || '');
        setPhone(profile.phone || '');
        setOccupation(profile.occupation || '');
        if (profile.currency_preference && ['BRL', 'USD', 'EUR'].includes(profile.currency_preference)) {
          setSelectedCurrency(profile.currency_preference as 'BRL' | 'USD' | 'EUR');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };
  const handleUpdateProfile = async () => {
    if (loading) return;
    if (!nome.trim()) {
      setError('O nome é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Primeiro atualiza o perfil
      await updateProfile({
        nome: nome.trim(),
        phone: phone.trim(),
        occupation: occupation.trim(),
        currency_preference: selectedCurrency,
      });

      // Depois atualiza a moeda no contexto
      await setCurrency(selectedCurrency);
      
      setShowEditModal(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.container}>
        {/* Perfil Header */}
        <View style={[styles.header, { backgroundColor: theme.tint }]}>
          <ThemedText style={styles.headerTitle}>Meu Perfil</ThemedText>
        </View>

        {/* Informações do Perfil */}
        <View style={styles.content}>
          <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: theme.tint }]}>
                <ThemedText style={styles.avatarText}>{user?.email?.[0].toUpperCase()}</ThemedText>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <ThemedText style={[styles.emailText, { color: theme.text }]}>
                {user?.email ? String(user.email) : ''}
              </ThemedText>
              <ThemedText style={[styles.infoText, { color: theme.text }]}>
                Moeda atual: {typeof currency === 'string' ? currency : ''}
              </ThemedText>
              {exchangeRate !== 1 && (
                <ThemedText style={[styles.infoText, { color: theme.text }]}>
                  Taxa de conversão: 1 {currency} = {exchangeRate.toFixed(2)} BRL
                </ThemedText>
              )}
            </View>

            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: theme.tint }]}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="create-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <ThemedText style={styles.buttonText}>Editar Perfil</ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.signOutButton, { backgroundColor: theme.error }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <ThemedText style={styles.buttonText}>Sair da Conta</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de Edição */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
              Editar Perfil
            </ThemedText>
            
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
              placeholder="Seu nome"
              placeholderTextColor={theme.gray}
              value={nome}
              onChangeText={setNome}
              editable={!loading}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
              placeholder="Telefone"
              placeholderTextColor={theme.gray}
              value={phone}
              onChangeText={setPhone}
              editable={!loading}
              keyboardType="phone-pad"
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
              placeholder="Ocupação"
              placeholderTextColor={theme.gray}
              value={occupation}
              onChangeText={setOccupation}
              editable={!loading}
            />

            <View style={styles.preferencesContainer}>
              <ThemedText style={[styles.preferencesTitle, { color: theme.text }]}>
                Moeda Principal
              </ThemedText>
              <View style={styles.radioGroup}>
                {(['BRL', 'USD', 'EUR'] as const).map((currencyOption) => (
                  <TouchableOpacity
                    key={currencyOption}
                    style={[
                      styles.radioButton,
                      { borderColor: theme.tint },
                      selectedCurrency === currencyOption && { backgroundColor: theme.tint }
                    ]}
                    onPress={() => setSelectedCurrency(currencyOption)}
                    disabled={loading}
                  >
                    <ThemedText style={[
                      styles.radioText,
                      { color: selectedCurrency === currencyOption ? '#fff' : theme.text }
                    ]}>
                      {currencyOption}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {error && (
              <ThemedText style={[styles.errorText, { color: theme.error }]}>
                {error ? String(error) : ''}
              </ThemedText>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.gray }]}
                onPress={() => setShowEditModal(false)}
                disabled={loading}
              >
                <ThemedText style={styles.buttonText}>Cancelar</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.tint }]}
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>Salvar</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  preferencesContainer: {
    marginTop: 16,
  },
  preferencesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  radioText: {
    fontSize: 14,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emailText: {
    fontSize: 16,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
});
