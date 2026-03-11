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
  backgroundBase: '#F8F4FF',
  backgroundMuted: '#F1EBFA',
  backgroundCanvas: '#FFF8FC',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F1FF',
  surfaceElevated: '#FFF9FD',
  surfaceOverlay: '#FFF6FB',
  surfaceInput: '#FCF8FF',
  surfaceEmphasis: '#F2E7FF',
  border: '#D9D0F2',
  borderStrong: '#C0B0EB',
  borderAccent: '#C691B7',
  textPrimary: '#2F204A',
  textSecondary: '#6D5E90',
  textTertiary: '#9588B6',
  textOnEmphasis: '#24123F',
  primary: '#7A4BCE',
  primaryContrast: '#FFFFFF',
  accent: '#D84C85',
  accentContrast: '#FFF5FA',
  success: '#2E9B66',
  warning: '#F97316',
  danger: '#C6354C',
  info: '#4A90E2',
  overlayScrim: 'rgba(40, 18, 71, 0.12)',
  glowPrimary: 'rgba(122, 75, 206, 0.22)',
  glowAccent: 'rgba(216, 76, 133, 0.18)',
  bannerWarning: '#FFE8CF',
  bannerWarningBorder: '#F59E0B',
  bannerDanger: '#FFE0E4',
  bannerDangerBorder: '#D6455D',
  celebrationSurface: '#F9EBF4',
  celebrationBorder: '#D986B1',
  badgeSurfaceGold: '#FFF3D6',
  badgeSurfaceSky: '#E9F4FF',
  badgeSurfaceLavender: '#F1EAFF',
  badgeSurfaceRose: '#FFE9F1',
  badgeSurfacePeach: '#FFEAD9',
  badgeSurfaceMint: '#E6FAF0',
};

const darkColors = {
  backgroundBase: '#140F21',
  backgroundMuted: '#1B142C',
  backgroundCanvas: '#22162E',
  surface: '#241A35',
  surfaceMuted: '#2E223F',
  surfaceElevated: '#342447',
  surfaceOverlay: '#3A274D',
  surfaceInput: '#2A1E3B',
  surfaceEmphasis: '#42264D',
  border: '#533A68',
  borderStrong: '#6E4A83',
  borderAccent: '#B06A90',
  textPrimary: '#FAF5FF',
  textSecondary: '#D6C5E6',
  textTertiary: '#A994BB',
  textOnEmphasis: '#FFF4FA',
  primary: '#D7689C',
  primaryContrast: '#FFF6FA',
  accent: '#F1A7C8',
  accentContrast: '#341528',
  success: '#71D9A3',
  warning: '#FFC189',
  danger: '#FF8A9F',
  info: '#8EC8FF',
  overlayScrim: 'rgba(10, 5, 18, 0.62)',
  glowPrimary: 'rgba(215, 104, 156, 0.32)',
  glowAccent: 'rgba(241, 167, 200, 0.24)',
  bannerWarning: '#4A2F18',
  bannerWarningBorder: '#E39A4A',
  bannerDanger: '#532231',
  bannerDangerBorder: '#FF8AA1',
  celebrationSurface: '#43233E',
  celebrationBorder: '#E49AC1',
  badgeSurfaceGold: '#4A3920',
  badgeSurfaceSky: '#21354D',
  badgeSurfaceLavender: '#3A2D56',
  badgeSurfaceRose: '#4D2437',
  badgeSurfacePeach: '#503120',
  badgeSurfaceMint: '#1E4335',
};

const createTheme = (mode, rawColors) => {
  const colors = {
    ...rawColors,
    background: rawColors.backgroundBase,
    surfaceCard: rawColors.surface,
    surfacePanel: rawColors.surfaceElevated,
    surfaceHero: rawColors.surfaceEmphasis,
    background: rawColors.backgroundBase,
  };

  return {
  mode,
  colors,
  spacing,
  radius,
  typography,
  shadows,
  };
};

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
