import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import useTheme from '../../theme/useTheme';
import VelvetScreen from './VelvetScreen';

const VelvetScrollScreen = ({
  children,
  contentMaxWidth = 760,
  horizontalPadding = 20,
  verticalPadding = 20,
  bottomPadding = 32,
  contentContainerStyle,
  scrollStyle,
  withAtmosphere = false,
  atmosphere = 'default',
  showsVerticalScrollIndicator = false,
  ...scrollProps
}) => {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const maxWidth = Math.min(contentMaxWidth, Math.max(width - horizontalPadding * 2, 0));
  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        content: {
          paddingHorizontal: horizontalPadding,
          paddingTop: verticalPadding,
          paddingBottom: bottomPadding,
          alignItems: 'center',
        },
        inner: {
          width: '100%',
          maxWidth,
        },
      }),
    [bottomPadding, horizontalPadding, maxWidth, theme, verticalPadding]
  );

  return (
    <VelvetScreen withAtmosphere={withAtmosphere} atmosphere={atmosphere}>
      <ScrollView
        style={[styles.scroll, scrollStyle]}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        {...scrollProps}
      >
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </VelvetScreen>
  );
};

export default VelvetScrollScreen;
