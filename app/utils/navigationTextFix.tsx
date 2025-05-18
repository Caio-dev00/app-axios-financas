// Este arquivo contém patches para corrigir problemas de renderização de texto no React Navigation
import React from 'react';
import { ThemedText } from '../../components/ThemedText';

// Função para garantir que qualquer valor seja renderizado com segurança dentro de componentes ThemedText
export function ensureTextComponent(value: any) {
  // Não precisamos envolver componentes React ou null/undefined
  if (value === null || value === undefined || React.isValidElement(value)) {
    return value;
  }
  
  // Para strings, números, booleanos - envolver em ThemedText
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <ThemedText>{String(value)}</ThemedText>;
  }
  
  // Para outros tipos (objetos, arrays) - converter para string segura
  try {
    return <ThemedText>{JSON.stringify(value)}</ThemedText>;
  } catch {
    return <ThemedText>[Objeto]</ThemedText>;
  }
}

// Factory para criar HOCs que envolvem texto
export function withSafeText<P>(Component: React.ComponentType<P>) {
  const Wrapped = React.forwardRef<any, P>((props, ref) => {
    // Interceptar props que podem conter texto não encapsulado
    const safeProps = { ...props } as P;

    // Lista de props que comumente contém texto direto
    const textProps = ['label', 'title', 'headerTitle', 'placeholder', 'text'];

    // Garantir que todos esses props estão encapsulados em componentes Text
    textProps.forEach((propName) => {
      if (
        Object.prototype.hasOwnProperty.call(props, propName) &&
        (props as any)[propName] !== undefined &&
        (props as any)[propName] !== null
      ) {
        (safeProps as any)[propName] = ensureTextComponent((props as any)[propName]);
      }
    });

    return <Component {...safeProps} ref={ref} />;
  });
  Wrapped.displayName = `withSafeText(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
}

export default withSafeText;
