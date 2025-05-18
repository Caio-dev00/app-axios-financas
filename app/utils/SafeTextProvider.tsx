// Arquivo de utilitários para texto seguro
import React from 'react';
import { ThemedText } from '../../components/ThemedText';

// SimpleSafeText Provider - apenas para manter compatibilidade
export function SafeTextProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
export default SafeTextProvider;

// Função para garantir que o conteúdo é seguro para ThemedText
function ensureSafeText(content: any): React.ReactNode {
  // Se for null, undefined ou já é um elemento React - retornar como está
  if (content === null || content === undefined || React.isValidElement(content)) {
    return content;
  }
  
  // Strings, números, booleanos - converter para string
  if (typeof content === 'string' || typeof content === 'number' || typeof content === 'boolean') {
    return String(content);
  }
  
  // Para arrays, objetos, etc - converter para string segura
  try {
    return JSON.stringify(content);
  } catch {
    return '[Objeto]';
  }
}

// Componente ThemedText seguro
export function SafeText({ children, ...props }: React.ComponentProps<typeof ThemedText>) {
  const safeContent = ensureSafeText(children);
  return <ThemedText {...props}>{safeContent}</ThemedText>;
}

// Função de monkeypatch simplificada que não faz nada (apenas para compatibilidade)
export function applyTextPatch() {
  console.log('[SafeText] Text patch applied'); 
}
