import { AccessibilityInfo, Platform } from 'react-native';

const liveRegion = Platform.OS === 'android' ? 'polite' : undefined;
const assertiveLiveRegion = Platform.OS === 'android' ? 'assertive' : undefined;

const decorativeAccessibilityProps = {
  accessible: false,
  importantForAccessibility: 'no',
  accessibilityElementsHidden: true,
};

const accessibilityAlertProps = {
  accessible: true,
  ...(assertiveLiveRegion ? { accessibilityLiveRegion: assertiveLiveRegion } : {}),
};

const accessibilityStatusProps = {
  accessible: true,
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
