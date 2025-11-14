import { StyleSheet } from 'react-native';

export const theme = {
  colors: {
    primary: '#3B82F6', // blue-500
    primaryDark: '#2563EB', // blue-600
    background: '#FFFFFF',
    backgroundDark: '#0F172A', // slate-900
    text: '#1F2937', // gray-800
    textDark: '#F3F4F6', // gray-100
    textSecondary: '#4B5563', // gray-600
    textSecondaryDark: '#9CA3AF', // gray-400
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  // Add more theme values as needed
};

export const styles = StyleSheet.create({
  // Reusable style objects can go here
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  // Add more reusable styles as needed
});
