import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, getSubscription, updateProfile, type UserProfile } from '../supabaseClient';

export default function ProfileScreen() {
  const { user: authUser, signOut, validateSession } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: '',
    phone: '',
  });
  const [subscription, setSubscription] = useState<{
    isPro: boolean;
    daysLeft: number | null;
  }>({
    isPro: false,
    daysLeft: null
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkAuth = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('supabase_token');
      if (!token) {
        console.error('No token found');
        throw new Error('Usuário não autenticado');
      }
      
      const isValid = await validateSession();
      if (!isValid) {
        throw new Error('Sessão inválida');
      }
      return true;
    } catch (error: any) {
      console.error('Auth check failed:', error.message);
      await signOut();
      router.replace('/auth/login');
      return false;
    }
  }, [validateSession, signOut]);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setFormError(null);

      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        return;
      }

      const [profileData, subscriptionData] = await Promise.all([
        getProfile(),
        getSubscription()
      ]);

      if (!profileData) {
        throw new Error('Perfil não encontrado');
      }

      setProfile(profileData);
      setSubscription(subscriptionData);
      setEditForm({
        nome: profileData.nome || '',
        phone: profileData.phone || '',
      });
    } catch (error: any) {
      console.error('Failed to fetch user data:', error.message);
      setFormError(error.message);
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchUserData();
        }, 1000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  }, [checkAuth, retryCount]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleEditProfile = async () => {
    try {
      setSaving(true);
      setFormError(null);

      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) return;

      if (!editForm.nome.trim()) {
        setFormError('Nome é obrigatório');
        return;
      }

      await updateProfile({
        nome: editForm.nome.trim(),
        phone: editForm.phone.trim(),
      });

      await fetchUserData();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setFormError(error instanceof Error ? error.message : 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
          <ThemedText style={styles.loadingText}>Carregando perfil...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.tint }]}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
          </View>

          <ThemedText style={styles.name}>{profile?.nome || 'Usuário'}</ThemedText>
          <ThemedText style={styles.email}>{authUser.email}</ThemedText>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Tipo de Conta</ThemedText>
            <ThemedText style={[styles.infoValue, subscription.isPro && { color: theme.tint, fontWeight: 'bold' }]}>
              {subscription.isPro ? 'PRO' : 'Free'}
            </ThemedText>
          </View>          {/* Removido contador de dias restantes */}
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Telefone</ThemedText>
            <ThemedText style={styles.infoValue}>{profile?.phone || 'Não informado'}</ThemedText>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.tint }]}
          onPress={() => {
            setEditForm({
              nome: profile?.nome || '',
              phone: profile?.phone || '',
            });
            setShowEditModal(true);
          }}
        >
          <ThemedText style={styles.editButtonText}>Editar Perfil</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.error }]}
          onPress={handleLogout}
        >
          <ThemedText style={styles.logoutButtonText}>Sair</ThemedText>
        </TouchableOpacity>

        {showEditModal && (
          <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Editar Perfil</ThemedText>

              {formError && (
                <ThemedText style={[styles.errorText, { color: theme.error }]}>
                  {formError}
                </ThemedText>
              )}

              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                placeholder="Nome"
                value={editForm.nome}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, nome: text }))}
                placeholderTextColor={theme.gray}
                editable={!saving}
              />

              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                placeholder="Telefone"
                value={editForm.phone}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, phone: text }))}
                placeholderTextColor={theme.gray}
                keyboardType="phone-pad"
                editable={!saving}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  <ThemedText style={[styles.modalButtonText, { color: theme.error }]}>Cancelar</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.tint }]}
                  onPress={handleEditProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <ThemedText style={[styles.modalButtonText, { color: '#fff' }]}>Salvar</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    opacity: 0.7,
  },
  infoSection: {
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    opacity: 0.7,
  },
  editButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 20,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  errorText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  saveButton: {
    marginLeft: 10,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});