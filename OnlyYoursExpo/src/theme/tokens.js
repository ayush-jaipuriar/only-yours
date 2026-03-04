const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

const typography = {
  titleLarge: 32,
  title: 28,
  heading: 24,
  subheading: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
};

const shadows = {
  card: {
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  button: {
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
};

const lightColors = {
  background: '#F6F5FF',
  backgroundMuted: '#F1F0FA',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F5FF',
  border: '#D9D3F3',
  textPrimary: '#2D225A',
  textSecondary: '#6B6296',
  textTertiary: '#8A82B0',
  primary: '#6A4CFF',
  primaryContrast: '#FFFFFF',
  accent: '#03DAC6',
  accentContrast: '#073833',
  success: '#2E9B66',
  warning: '#F97316',
  danger: '#C6354C',
  info: '#4A90E2',
};

const darkColors = {
  background: '#120E24',
  backgroundMuted: '#1A1531',
  surface: '#1E1939',
  surfaceMuted: '#2A224A',
  border: '#3A2F63',
  textPrimary: '#F7F3FF',
  textSecondary: '#CAC2ED',
  textTertiary: '#A59CCB',
  primary: '#9B83FF',
  primaryContrast: '#16112E',
  accent: '#35E7D2',
  accentContrast: '#052C28',
  success: '#52C68D',
  warning: '#FFAF6A',
  danger: '#FF768E',
  info: '#77B9FF',
};

const createTheme = (mode, colors) => ({
  mode,
  colors,
  spacing,
  radius,
  typography,
  shadows,
});

const lightTheme = createTheme('light', lightColors);
const darkTheme = createTheme('dark', darkColors);

export {
  spacing,
  radius,
  typography,
  shadows,
  lightTheme,
  darkTheme,
};
