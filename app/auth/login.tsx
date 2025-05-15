import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import supabaseClient from '../lib/supabase';

export default function LoginScreen() {
  const { user, isLoading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetting, setResetting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redireciona para o app se já estiver autenticado
  if (!isLoading && user) {
    return <Redirect href="/(tabs)" />;
  }

  const validateForm = () => {
    if (!email.trim()) return 'Digite seu email';
    if (!password.trim()) return 'Digite sua senha';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'Email inválido';
    return null;
  };

  const handleLogin = async () => {
    if (loading) return;
    
    try {
      setError(null);
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const validationError = validateForm();
      if (validationError) {
        throw new Error(validationError);
      }
      
      await signIn(email.trim(), password.trim());
      // O redirecionamento será feito pelo AuthContext após login bem-sucedido
    } catch (error) {
      console.error('Erro no login:', error);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setError(error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      setError('Informe o email.');
      return;
    }

    setResetting(true);
    setError(null);

    try {
      await supabaseClient.post('/auth/v1/recover', { 
        email: resetEmail.trim(),
      });
      alert('Se o email estiver cadastrado, você receberá um link para redefinir a senha.');
      setShowReset(false);
      setResetEmail('');
    } catch (error) {
      console.error('Erro na recuperação:', error);
      setError('Erro ao solicitar recuperação de senha.');
    } finally {
      setResetting(false);
    }
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
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          {error && (
            <ThemedText style={styles.errorText}>
              {error}
            </ThemedText>
          )}
          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>
                Entrar
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => router.push('/auth/register')}
            disabled={loading}
          >
            <ThemedText style={styles.registerText}>
              Não tem uma conta? Cadastre-se
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ alignItems: 'center', marginTop: 8 }} 
            onPress={() => setShowReset(true)}
            disabled={loading}
          >
            <ThemedText style={{ color: Colors.light.tint, fontSize: 14 }}>
              Esqueci minha senha
            </ThemedText>
          </TouchableOpacity>
        </View>

        <Modal visible={showReset} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>Recuperar senha</ThemedText>
              <TextInput
                style={styles.modalInput}
                placeholder="Email"
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {error && (
                <ThemedText style={styles.errorText}>
                  {error}
                </ThemedText>
              )}
              <TouchableOpacity 
                onPress={handlePasswordReset} 
                style={[styles.modalButton, { backgroundColor: Colors.light.tint }]} 
                disabled={resetting}
              >
                <ThemedText style={styles.modalButtonText}>
                  {resetting ? 'Enviando...' : 'Enviar link'}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setShowReset(false)} 
                style={styles.modalCancelButton}
              >
                <ThemedText style={{ color: Colors.light.error }}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
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
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    alignItems: 'center',
  },
  registerText: {
    color: Colors.light.tint,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalCancelButton: {
    alignItems: 'center',
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 14,
    textAlign: 'center',
  },
});