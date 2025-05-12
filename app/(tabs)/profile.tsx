import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { getUser } from '../supabaseClient';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  is_pro: boolean;
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const authUser = await getUser();
      if (!authUser) {
        router.replace('/auth/login');
        return;
      }

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || '',
        avatar_url: authUser.user_metadata?.avatar_url || '',
        is_pro: false
      });

      const token = await SecureStore.getItemAsync('supabase_token');
      const supabaseUrl = 'https://yascliotrmqhvqbvrhsc.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc2NsaW90cm1xaHZxYnZyaHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTA3NjksImV4cCI6MjA2MTUyNjc2OX0.Yh2Ebi1n6CPx2mVERHfA7G5w_kaF6_p7OImAF3qRj8o';
      const { data } = await axios.get(`${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${authUser.id}&plan_type=eq.pro&is_active=eq.true`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${token}`,
        },
      });
      setIsPro(Array.isArray(data) && data.length > 0);
    } catch (error) {
      console.error('Error fetching user profile or subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('supabase_token');
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedText>Carregando...</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <Image
            source={{ uri: user?.avatar_url || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <ThemedText style={[styles.name, { color: theme.text }]}>{user?.full_name || 'Usuário'}</ThemedText>
          <ThemedText style={[styles.email, { color: theme.gray }]}>{user?.email}</ThemedText>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]}>
            <Ionicons name="person-outline" size={24} color={theme.tint} />
            <ThemedText style={[styles.menuText, { color: theme.text }]}>Editar Perfil</ThemedText>
            <Ionicons name="chevron-forward" size={24} color={theme.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]}>
            <Ionicons name="notifications-outline" size={24} color={theme.tint} />
            <ThemedText style={[styles.menuText, { color: theme.text }]}>Notificações</ThemedText>
            <Ionicons name="chevron-forward" size={24} color={theme.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]}>
            <Ionicons name="lock-closed-outline" size={24} color={theme.tint} />
            <ThemedText style={[styles.menuText, { color: theme.text }]}>Segurança</ThemedText>
            <Ionicons name="chevron-forward" size={24} color={theme.gray} />
          </TouchableOpacity>
        </View>

        {/* PRO Card - Only show if user is not PRO */}
        {!isPro && (
          <View style={[styles.proCard, { backgroundColor: theme.tint }]}>
            <Ionicons name="star" size={32} color="#fff" />
            <ThemedText style={styles.proTitle}>Desbloqueie Recursos Exclusivos</ThemedText>
            <ThemedText style={styles.proDescription}>
              Assine o plano PRO e tenha acesso a recursos avançados de gestão financeira
            </ThemedText>
            <TouchableOpacity style={styles.proButton}>
              <ThemedText style={styles.proButtonText}>Assinar Agora</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: theme.error }]} 
          onPress={handleLogout}
        >
          <ThemedText style={styles.logoutText}>Sair</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
  },
  menuSection: {
    gap: 12,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  proCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  proTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  proDescription: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  proButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  proButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 