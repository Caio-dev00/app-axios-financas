// Componente para garantir que labels de abas estejam dentro de componentes Text
import { ThemedText } from '@/components/ThemedText';
import React from 'react';
import { StyleSheet } from 'react-native';

// Componente para evitar o warning "Text strings must be rendered within a <Text> component"
export function SafeTabLabel(props: { label: string; color?: string; focused?: boolean }) {
  const { label, color, focused } = props;
  
  return (
    <ThemedText style={[
      styles.tabLabel,
      color ? { color } : undefined,
      focused ? styles.focused : undefined,
    ]}>
      {label}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  focused: {
    fontWeight: 'bold',
  },
});

export default SafeTabLabel;
