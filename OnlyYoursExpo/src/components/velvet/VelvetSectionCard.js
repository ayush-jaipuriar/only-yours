import React from 'react';
import VelvetSurfaceCard from './VelvetSurfaceCard';

const VelvetSectionCard = ({ children, style, ...rest }) => (
  <VelvetSurfaceCard
    variant="solid"
    padding={18}
    radius={20}
    style={style}
    {...rest}
  >
    {children}
  </VelvetSurfaceCard>
);

export default VelvetSectionCard;
