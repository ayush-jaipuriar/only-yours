const gradientTokens = {
  light: {
    romancePrimary: {
      stops: ['#F7A1C2', '#E978A9', '#C95A90'],
      fallback: '#E978A9',
    },
    romanceSoft: {
      stops: ['#FFF3F8', '#F7EAF6'],
      fallback: '#F7EAF6',
    },
    auraPurple: {
      stops: ['#B38DFF', '#7A4BCE'],
      fallback: '#7A4BCE',
    },
    celebrationGlow: {
      stops: ['#FFE9F2', '#FADFF2', '#F4E7FF'],
      fallback: '#FADFF2',
    },
  },
  dark: {
    romancePrimary: {
      stops: ['#6E274D', '#9E3F6F', '#D7689C'],
      fallback: '#9E3F6F',
    },
    romanceSoft: {
      stops: ['#34213D', '#42264D'],
      fallback: '#42264D',
    },
    auraPurple: {
      stops: ['#6B3D7D', '#4B295F'],
      fallback: '#4B295F',
    },
    celebrationGlow: {
      stops: ['#4B2740', '#5B3250', '#3E284E'],
      fallback: '#5B3250',
    },
  },
};

const getGradientToken = (tokenName, mode = 'light') => {
  const gradientSet = gradientTokens[mode] || gradientTokens.light;
  return gradientSet[tokenName] || gradientSet.auraPurple;
};

export { gradientTokens, getGradientToken };
