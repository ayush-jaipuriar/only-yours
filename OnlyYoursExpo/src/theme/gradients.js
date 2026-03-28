const gradientTokens = {
  light: {
    romancePrimary: {
      stops: ['#FF6A97', '#FF3B78', '#FF2E6E'],
      fallback: '#FF3B78',
    },
    romanceSoft: {
      stops: ['#FFF7F6', '#F8EEF2', '#F2E8EF'],
      fallback: '#F8EEF2',
    },
    auraPurple: {
      stops: ['#3A2D56', '#2B1F3B', '#1C1830'],
      fallback: '#2B1F3B',
    },
    celebrationGlow: {
      stops: ['#F9E3EB', '#F6E4EC', '#EEE7F4'],
      fallback: '#F6E4EC',
    },
    velvetHero: {
      stops: ['#FFF1F5', '#F8EEF4', '#EDE0E9'],
      fallback: '#F8EEF4',
    },
  },
  dark: {
    romancePrimary: {
      stops: ['#FF3B78', '#FF2E6E', '#D61D5B'],
      fallback: '#FF2E6E',
    },
    romanceSoft: {
      stops: ['#221D30', '#1A1428', '#151023'],
      fallback: '#221D30',
    },
    auraPurple: {
      stops: ['#352E46', '#2B1F3B', '#1C1830'],
      fallback: '#2B1F3B',
    },
    celebrationGlow: {
      stops: ['#472538', '#3A2030', '#32283F'],
      fallback: '#3A2030',
    },
    velvetHero: {
      stops: ['#2A2338', '#221D30', '#151023'],
      fallback: '#221D30',
    },
  },
};

const getGradientToken = (tokenName, mode = 'light') => {
  const gradientSet = gradientTokens[mode] || gradientTokens.light;
  return gradientSet[tokenName] || gradientSet.romancePrimary;
};

export { gradientTokens, getGradientToken };
