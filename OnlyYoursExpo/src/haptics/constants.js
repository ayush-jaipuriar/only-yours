const HAPTIC_STORAGE_KEY = 'haptics_enabled_v1';

const HAPTIC_EVENTS = {
  INVITATION_SENT: 'INVITATION_SENT',
  INVITATION_ACCEPTED: 'INVITATION_ACCEPTED',
  ANSWER_SUBMITTED: 'ANSWER_SUBMITTED',
  GUESS_SUBMITTED: 'GUESS_SUBMITTED',
  GUESS_CORRECT: 'GUESS_CORRECT',
  GUESS_INCORRECT: 'GUESS_INCORRECT',
  ROUND_UNLOCKED: 'ROUND_UNLOCKED',
  GAME_COMPLETED: 'GAME_COMPLETED',
  INVALID_ACTION: 'INVALID_ACTION',
  ACTION_ERROR: 'ACTION_ERROR',
  REALTIME_UNAVAILABLE: 'REALTIME_UNAVAILABLE',
  UNLINK_CONFIRMED: 'UNLINK_CONFIRMED',
  COUPLE_RECOVERED: 'COUPLE_RECOVERED',
  SETTINGS_SAVED: 'SETTINGS_SAVED',
  PROFILE_SAVED: 'PROFILE_SAVED',
  PARTNER_CODE_GENERATED: 'PARTNER_CODE_GENERATED',
  PARTNER_CODE_COPIED: 'PARTNER_CODE_COPIED',
  PARTNER_CODE_SHARED: 'PARTNER_CODE_SHARED',
};

const HAPTIC_EVENT_MAP = {
  [HAPTIC_EVENTS.INVITATION_SENT]: { kind: 'impact', style: 'light' },
  [HAPTIC_EVENTS.INVITATION_ACCEPTED]: { kind: 'notification', type: 'success' },
  [HAPTIC_EVENTS.ANSWER_SUBMITTED]: { kind: 'selection' },
  [HAPTIC_EVENTS.GUESS_SUBMITTED]: { kind: 'selection' },
  [HAPTIC_EVENTS.GUESS_CORRECT]: { kind: 'notification', type: 'success' },
  [HAPTIC_EVENTS.GUESS_INCORRECT]: { kind: 'notification', type: 'warning' },
  [HAPTIC_EVENTS.ROUND_UNLOCKED]: { kind: 'impact', style: 'medium' },
  [HAPTIC_EVENTS.GAME_COMPLETED]: { kind: 'notification', type: 'success' },
  [HAPTIC_EVENTS.INVALID_ACTION]: { kind: 'notification', type: 'warning' },
  [HAPTIC_EVENTS.ACTION_ERROR]: { kind: 'notification', type: 'error' },
  [HAPTIC_EVENTS.REALTIME_UNAVAILABLE]: { kind: 'notification', type: 'warning' },
  [HAPTIC_EVENTS.UNLINK_CONFIRMED]: { kind: 'notification', type: 'warning' },
  [HAPTIC_EVENTS.COUPLE_RECOVERED]: { kind: 'notification', type: 'success' },
  [HAPTIC_EVENTS.SETTINGS_SAVED]: { kind: 'impact', style: 'light' },
  [HAPTIC_EVENTS.PROFILE_SAVED]: { kind: 'impact', style: 'light' },
  [HAPTIC_EVENTS.PARTNER_CODE_GENERATED]: { kind: 'impact', style: 'light' },
  [HAPTIC_EVENTS.PARTNER_CODE_COPIED]: { kind: 'selection' },
  [HAPTIC_EVENTS.PARTNER_CODE_SHARED]: { kind: 'impact', style: 'light' },
};

export {
  HAPTIC_EVENT_MAP,
  HAPTIC_EVENTS,
  HAPTIC_STORAGE_KEY,
};
