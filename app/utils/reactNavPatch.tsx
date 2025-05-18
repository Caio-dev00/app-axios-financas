// Arquivo de utilitários para corrigir problemas de texto no React Navigation
import React from 'react';
import { Text } from 'react-native';

// Função simplificada que apenas registra uma mensagem no console
export function applyReactNavigationFixes() {
  console.log('[PATCH] React Navigation text fixes - use SafeTabLabel');
}

// Wrapper de componentes que pode conter texto
export function SafeTextWrapper({ children }: { children: React.ReactNode }) {
  // Se for uma string, número ou booleano, envolva em um Text
  if (typeof children === 'string' || 
      typeof children === 'number' || 
      typeof children === 'boolean') {
    return <Text>{String(children)}</Text>;
  }
  
  // Caso contrário, retorne como está
  return <>{children}</>;
}

export default applyReactNavigationFixes;
