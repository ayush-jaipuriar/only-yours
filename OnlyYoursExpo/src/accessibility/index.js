import { AccessibilityInfo, Platform } from 'react-native';

const liveRegion = Platform.OS === 'android' ? 'polite' : undefined;

const decorativeAccessibilityProps = {
  accessible: false,
  importantForAccessibility: 'no',
  accessibilityElementsHidden: true,
};

const accessibilityAlertProps = {
  accessibilityRole: 'alert',
  ...(liveRegion ? { accessibilityLiveRegion: liveRegion } : {}),
};

const accessibilityStatusProps = {
  accessibilityRole: 'status',
  ...(liveRegion ? { accessibilityLiveRegion: liveRegion } : {}),
};

const announceForAccessibility = (message) => {
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';
  if (!trimmedMessage) {
    return;
  }

  AccessibilityInfo?.announceForAccessibility?.(trimmedMessage);
};

export {
  accessibilityAlertProps,
  accessibilityStatusProps,
  announceForAccessibility,
  decorativeAccessibilityProps,
};
