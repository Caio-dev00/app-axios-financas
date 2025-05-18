import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { SafeTabLabel } from '../components/SafeTabLabel';
import { useAuth } from '../contexts/AuthContext';
import { TransactionsProvider } from '../TransactionsContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();

  // Mostra tela de carregamento enquanto verifica autenticação
  if (isLoading) {
    return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={{ marginTop: 10 }}>Verificando autenticação...</ThemedText>
      </ThemedView>
    );
  }

  // Redireciona para login se não estiver autenticado
  if (!user) {
    return <Redirect href="/auth/login" />;
  }
  return (
    <TransactionsProvider>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#fff',
          tabBarStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].tint,
            borderTopWidth: 0,
          },
          tabBarLabel: ({ color, focused }) => {
            // Garantir que os labels de tab sejam renderizados dentro de um Text component
            const labelMap: {[key: string]: string} = {
              index: 'Dashboard',
              transactions: 'Transações',
              reports: 'Relatórios',
              profile: 'Perfil'
            };
            const label = labelMap[route.name] || route.name;
            return <SafeTabLabel label={label} color={color} focused={focused} />;
          },
        })}>
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="swap-horizontal-outline" size={size} color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
            headerShown: false,
          }}
        />
      </Tabs>
    </TransactionsProvider>
  );
}
