import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import useTheme from '../../theme/useTheme';
import VelvetBottomNav from './VelvetBottomNav';
import VelvetScreen from './VelvetScreen';
import VelvetTopBar from './VelvetTopBar';

const DEFAULT_NAV_ITEMS = [
  { key: 'dashboard', label: 'Home', icon: '⌂', route: 'Dashboard' },
  { key: 'history', label: 'History', icon: '◷', route: 'GameHistory' },
  { key: 'customQuestions', label: 'Custom', icon: '✦', route: 'CustomQuestions' },
  { key: 'profile', label: 'Profile', icon: '◌', route: 'Profile' },
];

const VelvetBrowseLayout = ({
  children,
  navigation,
  activeNavKey,
  headerTitle,
  headerSubtitle,
  headerRightContent,
  showHeader = true,
  navItems = DEFAULT_NAV_ITEMS,
  contentMaxWidth = 760,
  horizontalPadding = 20,
  verticalPadding = 20,
  bottomPadding = 28,
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
        root: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        scroll: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        content: {
          paddingHorizontal: horizontalPadding,
          paddingTop: verticalPadding,
          paddingBottom: bottomPadding,
          alignItems: 'center',
          flexGrow: 1,
        },
        inner: {
          width: '100%',
          maxWidth,
        },
      }),
    [bottomPadding, horizontalPadding, maxWidth, theme, verticalPadding]
  );

  const handleNavPress = (key) => {
    const targetItem = navItems.find((item) => item.key === key);
    if (!targetItem?.route || key === activeNavKey) {
      return;
    }
    navigation?.navigate(targetItem.route);
  };

  return (
    <VelvetScreen
      withAtmosphere={withAtmosphere}
      atmosphere={atmosphere}
      safeAreaEdges={['left', 'right']}
    >
      <View style={styles.root}>
        {showHeader ? (
          <VelvetTopBar
            title={headerTitle}
            subtitle={headerSubtitle}
            rightContent={headerRightContent}
          />
        ) : null}
        <ScrollView
          style={[styles.scroll, scrollStyle]}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          {...scrollProps}
        >
          <View style={styles.inner}>{children}</View>
        </ScrollView>
        <VelvetBottomNav items={navItems} activeKey={activeNavKey} onPress={handleNavPress} />
      </View>
    </VelvetScreen>
  );
};

export default VelvetBrowseLayout;
