/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const primaryGreen = '#19C37D';
const accentPurple = '#7C3AED'; // Roxo para ação
const accentBlue = '#3B82F6'; // Azul para ação alternativa
const lightGray = '#F4F6F8';
const mediumGray = '#23232A';
const cardGray = '#2C2C35';
const borderGray = '#393945';
const textGray = '#B0B3C6';
const errorRed = '#FF5252';

export const Colors = {
  light: {
    text: '#23232A',
    background: lightGray,
    tint: primaryGreen,
    accent: accentPurple,
    accentAlt: accentBlue,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryGreen,
    card: '#fff',
    border: '#E5E5E5',
    error: errorRed,
    gray: '#888',
  },
  dark: {
    text: '#fff',
    background: mediumGray,
    tint: primaryGreen,
    accent: accentPurple,
    accentAlt: accentBlue,
    icon: textGray,
    tabIconDefault: textGray,
    tabIconSelected: primaryGreen,
    card: cardGray,
    border: borderGray,
    error: errorRed,
    gray: textGray,
  },
};
