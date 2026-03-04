const gradientTokens = {
  romancePrimary: {
    stops: ['#FF6B8A', '#FF4D7A', '#E43F5A'],
    fallback: '#E43F5A',
  },
  romanceSoft: {
    stops: ['#FDE7EF', '#F8DCE8'],
    fallback: '#F8DCE8',
  },
  auraPurple: {
    stops: ['#7C62FF', '#5B3FFF'],
    fallback: '#5B3FFF',
  },
};

const getGradientToken = (tokenName) => gradientTokens[tokenName] || gradientTokens.auraPurple;

export { gradientTokens, getGradientToken };
