// Centralized icon mapping for transaction categories
import { Ionicons } from '@expo/vector-icons';

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Alimentação': 'fast-food-outline',
  'Transporte': 'car-outline',
  'Moradia': 'home-outline',
  'Saúde': 'heart-outline',
  'Educação': 'school-outline',
  'Lazer': 'game-controller-outline',
  'Vestuário': 'shirt-outline',
  'Serviços': 'construct-outline',
  'Compras': 'cart-outline',
  'Viagens': 'airplane-outline',
  'Outros': 'pricetag-outline',
};

export default categoryIcons;
