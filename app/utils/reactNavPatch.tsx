// Arquivo de utilitários para corrigir problemas de texto no React Navigation
import React from 'react';
import { ThemedText } from '../../components/ThemedText';

// Função simplificada que apenas registra uma mensagem no console
export function applyReactNavigationFixes() {
  console.log('[PATCH] React Navigation text fixes - use SafeTabLabel');
}

// Wrapper de componentes que pode conter texto
export function SafeTextWrapper({ children }: { children: React.ReactNode }) {
  // Se for uma string, número ou booleano, envolva em um ThemedText
  if (typeof children === 'string' || 
      typeof children === 'number' || 
      typeof children === 'boolean') {
    return <ThemedText>{String(children)}</ThemedText>;
  }
  
  // Caso contrário, retorne como está
  return <>{children}</>;
}

export default applyReactNavigationFixes;
