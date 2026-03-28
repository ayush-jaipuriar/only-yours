import React from 'react';
import VelvetSurfaceCard from './VelvetSurfaceCard';

const VelvetHeroCard = ({ children, style, ...rest }) => (
  <VelvetSurfaceCard
    variant="default"
    padding={18}
    radius={20}
    glow
    style={style}
    {...rest}
  >
    {children}
  </VelvetSurfaceCard>
);

export default VelvetHeroCard;
