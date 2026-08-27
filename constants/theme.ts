export const colors = {
  primaryDark: '#0A4D2E',
  primary: '#119E4B',
  accent: '#7CFC00',
  surface: '#E8F7ED',
  white: '#FFFFFF',
  black: '#0B1310',
  gray: '#6B7A72',
  grayLight: '#C7D6CC',
  danger: '#D64545',
  warning: '#E0A62B',
} as const;

export const gradients = {
  brand: [colors.primaryDark, colors.primary, colors.accent] as const,
  card: [colors.primaryDark, colors.primary] as const,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 11, fontWeight: '600' as const },
};
