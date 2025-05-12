import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const supabaseUrl = 'https://yascliotrmqhvqbvrhsc.supabase.co';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetting, setResetting] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleLogin = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { data } = await axios.post(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          email,
          password,
        },
        {
          headers: {
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc2NsaW90cm1xaHZxYnZyaHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTA3NjksImV4cCI6MjA2MTUyNjc2OX0.Yh2Ebi1n6CPx2mVERHfA7G5w_kaF6_p7OImAF3qRj8o',
            'Content-Type': 'application/json',
          },
        }
      );
      if (data && data.access_token) {
        await SecureStore.setItemAsync('supabase_token', data.access_token);
        router.replace('/(tabs)');
      } else {
        alert('Email ou senha inválidos.');
      }
    } catch (error) {
      alert('Erro ao fazer login. Verifique suas credenciais.');
      console.error(error);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      alert('Informe o email.');
      return;
    }
    setResetting(true);
    try {
      await axios.post(
        `${supabaseUrl}/auth/v1/recover`,
        { email: resetEmail },
        {
          headers: {
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc2NsaW90cm1xaHZxYnZyaHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTA3NjksImV4cCI6MjA2MTUyNjc2OX0.Yh2Ebi1n6CPx2mVERHfA7G5w_kaF6_p7OImAF3qRj8o',
            'Content-Type': 'application/json',
          },
        }
      );
      alert('Se o email estiver cadastrado, você receberá um link para redefinir a senha.');
      setShowReset(false);
      setResetEmail('');
    } catch (e) {
      alert('Erro ao solicitar recuperação.');
    }
    setResetting(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ThemedView style={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          <ThemedText style={styles.brand}>Axios Finanças</ThemedText>
        </View>
        <ThemedText style={styles.subtitle}>Gerencie suas finanças de forma simples</ThemedText>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.button}
            onPress={handleLogin}
          >
            <ThemedText style={styles.buttonText}>Entrar</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => router.push('/auth/register')}
          >
            <ThemedText style={styles.registerText}>
              Não tem uma conta? Cadastre-se
            </ThemedText>
          </TouchableOpacity>

          <Modal visible={showReset} animationType="slide" transparent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%' }}>
                <ThemedText style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Recuperar senha</ThemedText>
                <TextInput
                  style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 12 }}
                  placeholder="Email"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={handlePasswordReset} style={{ backgroundColor: Colors.light.tint, borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 8 }} disabled={resetting}>
                  <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>{resetting ? 'Enviando...' : 'Enviar link'}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowReset(false)} style={{ alignItems: 'center' }}>
                  <ThemedText style={{ color: Colors.light.error }}>Cancelar</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <TouchableOpacity style={{ alignItems: 'center', marginTop: 8 }} onPress={() => setShowReset(true)}>
            <ThemedText style={{ color: Colors.light.tint, fontSize: 14 }}>Esqueci minha senha</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  brand: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.7,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  registerText: {
    color: Colors.light.tint,
    fontSize: 14,
  },
}); 