import React from 'react';
import VelvetSurfaceCard from './VelvetSurfaceCard';

const VelvetStatCard = ({ children, style, ...rest }) => (
  <VelvetSurfaceCard
    variant="elevated"
    padding={12}
    radius={16}
    style={style}
    {...rest}
  >
    {children}
  </VelvetSurfaceCard>
);

export default VelvetStatCard;
