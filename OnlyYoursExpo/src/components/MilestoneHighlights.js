import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import useTheme from '../theme/useTheme';

const ICON_BY_TYPE = {
  LEVEL_UP: '🚀',
  ACHIEVEMENT_UNLOCK: '🏅',
};

// eslint-disable-next-line react/prop-types
const MilestoneHighlights = ({ milestones, title = 'Recent Milestones' }) => {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          width: '100%',
          borderRadius: 18,
          padding: 18,
          backgroundColor: theme.colors.surfaceOverlay,
          borderWidth: 1,
          borderColor: theme.colors.borderAccent,
          marginBottom: 14,
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: '800',
          color: theme.colors.textPrimary,
          marginBottom: 10,
        },
        item: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingVertical: 10,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border,
        },
        firstItem: {
          borderTopWidth: 0,
          paddingTop: 0,
        },
        icon: {
          fontSize: 18,
          marginRight: 10,
        },
        body: {
          flex: 1,
        },
        itemTitle: {
          fontSize: 14,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          marginBottom: 2,
        },
        itemMeta: {
          fontSize: 11,
          color: theme.colors.textTertiary,
          marginBottom: 3,
          textTransform: 'uppercase',
        },
        itemDescription: {
          fontSize: 12,
          color: theme.colors.textSecondary,
          lineHeight: 18,
        },
      }),
    [theme]
  );

  if (!milestones?.length) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {milestones.map((milestone, index) => (
        <View
          key={`${milestone.type}-${milestone.code || milestone.title}-${index}`}
          style={[styles.item, index === 0 && styles.firstItem]}
          accessible
          accessibilityLabel={`${milestone.ownerLabel || milestone.scope}. ${milestone.title}. ${milestone.description}`}
        >
          <Text style={styles.icon}>{ICON_BY_TYPE[milestone.type] || '✨'}</Text>
          <View style={styles.body}>
            <Text style={styles.itemMeta}>
              {(milestone.ownerLabel || milestone.scope || 'Milestone').toUpperCase()}
            </Text>
            <Text style={styles.itemTitle}>{milestone.title}</Text>
            <Text style={styles.itemDescription}>{milestone.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default MilestoneHighlights;
