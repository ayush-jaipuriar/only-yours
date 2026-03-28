const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

const typography = {
  display: 40,
  titleLarge: 32,
  title: 28,
  heading: 24,
  subheading: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  label: 11,
};

const fontFamilies = {
  heading: 'Newsreader',
  body: 'System',
  label: 'System',
};

const shadows = {
  card: {
    elevation: 3,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
  },
  button: {
    elevation: 4,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
};

const lightColors = {
  backgroundBase: '#FFF7F6',
  backgroundMuted: '#F8EEF2',
  backgroundCanvas: '#FFF1F5',
  surface: '#FFFDFC',
  surfaceMuted: '#F7EEF3',
  surfaceElevated: '#F2E8EF',
  surfaceOverlay: '#F8EEF4',
  surfaceInput: '#FBF3F6',
  surfaceEmphasis: '#EDE0E9',
  border: '#D8C3D0',
  borderStrong: '#B79BAE',
  borderAccent: '#C98BA5',
  textPrimary: '#23172E',
  textSecondary: '#6B5B73',
  textTertiary: '#928093',
  textOnEmphasis: '#201522',
  primary: '#FF2E6E',
  primaryContrast: '#FFF7F6',
  accent: '#E85A87',
  accentContrast: '#FFF7F6',
  success: '#2C9A6F',
  warning: '#C77B2A',
  danger: '#C44D69',
  info: '#557FD8',
  overlayScrim: 'rgba(35, 23, 46, 0.12)',
  glowPrimary: 'rgba(255, 46, 110, 0.20)',
  glowAccent: 'rgba(232, 90, 135, 0.16)',
  bannerWarning: '#FFF0E1',
  bannerWarningBorder: '#D9964A',
  bannerDanger: '#FFE7EC',
  bannerDangerBorder: '#D75B7C',
  celebrationSurface: '#F6E4EC',
  celebrationBorder: '#D77B9E',
  badgeSurfaceGold: '#F5E8D4',
  badgeSurfaceSky: '#E6EDF9',
  badgeSurfaceLavender: '#EEE7F4',
  badgeSurfaceRose: '#F9E3EB',
  badgeSurfacePeach: '#F8E6DE',
  badgeSurfaceMint: '#E5F3EC',
};

const darkColors = {
  backgroundBase: '#151023',
  backgroundMuted: '#1A1428',
  backgroundCanvas: '#120D20',
  surface: '#221D30',
  surfaceMuted: '#1E192C',
  surfaceElevated: '#2C273B',
  surfaceOverlay: '#2A2338',
  surfaceInput: '#1F1A2D',
  surfaceEmphasis: '#352E46',
  border: '#43384F',
  borderStrong: '#5A4B69',
  borderAccent: '#7B4A69',
  textPrimary: '#FFF7F6',
  textSecondary: '#C9B6C8',
  textTertiary: '#9B8EA6',
  textOnEmphasis: '#FFF7F6',
  primary: '#FF2E6E',
  primaryContrast: '#FFF7F6',
  accent: '#FFB1C3',
  accentContrast: '#3B1023',
  success: '#74D7A6',
  warning: '#FFB56B',
  danger: '#FF8AA3',
  info: '#8DAEF7',
  overlayScrim: 'rgba(7, 4, 14, 0.64)',
  glowPrimary: 'rgba(255, 46, 110, 0.28)',
  glowAccent: 'rgba(255, 177, 195, 0.18)',
  bannerWarning: '#4D2E1C',
  bannerWarningBorder: '#D9964A',
  bannerDanger: '#4A2030',
  bannerDangerBorder: '#D75B7C',
  celebrationSurface: '#3A2030',
  celebrationBorder: '#D77B9E',
  badgeSurfaceGold: '#4A3825',
  badgeSurfaceSky: '#253246',
  badgeSurfaceLavender: '#32283F',
  badgeSurfaceRose: '#472538',
  badgeSurfacePeach: '#4A2D28',
  badgeSurfaceMint: '#1F3A33',
};

const createTheme = (mode, rawColors) => {
  const colors = {
    ...rawColors,
    background: rawColors.backgroundBase,
    surfaceCard: rawColors.surface,
    surfacePanel: rawColors.surfaceElevated,
    surfaceHero: rawColors.surfaceEmphasis,
  };

  return {
    mode,
    colors,
    spacing,
    radius,
    typography,
    fontFamilies,
    shadows,
  };
};

const lightTheme = createTheme('light', lightColors);
const darkTheme = createTheme('dark', darkColors);

export {
  spacing,
  radius,
  typography,
  fontFamilies,
  shadows,
  lightTheme,
  darkTheme,
};
