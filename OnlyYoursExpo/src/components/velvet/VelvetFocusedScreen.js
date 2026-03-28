import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import VelvetScreen from './VelvetScreen';
import VelvetTopBar from './VelvetTopBar';

const VelvetFocusedScreen = ({
  children,
  header,
  footer,
  title,
  subtitle,
  navigation,
  onBackPress,
  showBackButton = true,
  withAtmosphere = false,
  atmosphere = 'focused',
  style,
  contentStyle,
}) => {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        content: {
          flex: 1,
        },
      }),
    []
  );

  const resolvedHeader = header || ((title || subtitle) ? (
    <VelvetTopBar
      title={title}
      subtitle={subtitle}
      leftIcon={showBackButton ? '←' : null}
      onLeftPress={showBackButton ? (onBackPress || (() => navigation?.goBack?.())) : undefined}
    />
  ) : null);

  return (
    <VelvetScreen
      withAtmosphere={withAtmosphere}
      atmosphere={atmosphere}
      safeAreaEdges={['left', 'right']}
      style={style}
    >
      <View style={styles.root}>
        {resolvedHeader}
        <View style={[styles.content, contentStyle]}>{children}</View>
        {footer}
      </View>
    </VelvetScreen>
  );
};

export default VelvetFocusedScreen;
