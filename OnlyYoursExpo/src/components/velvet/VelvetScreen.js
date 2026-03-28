import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import useTheme from '../../theme/useTheme';
import VelvetAtmosphere from './VelvetAtmosphere';

const VelvetScreen = ({
  children,
  variant = 'default',
  atmosphere = 'default',
  withAtmosphere = false,
  safeAreaEdges = ['top', 'right', 'bottom', 'left'],
  style,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        content: {
          flex: 1,
        },
      }),
    [theme]
  );

  return (
    <SafeAreaView edges={safeAreaEdges} style={[styles.safeArea, style]}>
      {withAtmosphere ? <VelvetAtmosphere variant={atmosphere || variant} /> : null}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

export default VelvetScreen;
