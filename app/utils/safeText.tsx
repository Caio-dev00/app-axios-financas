// Este componente destina-se a envolver textos em componententes <ThemedText> de forma segura
import React from 'react';
import { TextProps } from 'react-native';
import { ThemedText } from '../../components/ThemedText';

// Uma função auxiliar para garantir que todos os textos estão dentro de componentes ThemedText
export const SafeText = (props: TextProps) => {
  return <ThemedText {...props} />;
};

// Função para garantir que um valor será renderizado como string dentro de um componente Text
export const ensureTextSafe = (value: any) => {
  // Se for uma string, número ou booleano, podemos retornar com segurança
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
    return value;
  }
  
  // Para evitar a renderização direta de objetos não renderizáveis
  return JSON.stringify(value);
};

export default SafeText;
