const React = require('react');

const createMockComponent = (name) => {
  const Component = (props) => React.createElement(name, props, props.children);
  Component.displayName = name;
  return Component;
};

const AnimatedValue = class {
  constructor(val) { this._value = val; }
  setValue(val) { this._value = val; }
  interpolate(config) { return this; }
  addListener(cb) {
    if (cb) cb({ value: this._value });
    return 'listener-id';
  }
  removeListener() {}
};

const AnimatedMock = {
  Value: AnimatedValue,
  timing: (value, config) => ({
    start: (cb) => {
      value._value = config.toValue;
      if (cb) cb({ finished: true });
    },
  }),
  spring: (value, config) => ({
    start: (cb) => {
      value._value = config.toValue;
      if (cb) cb({ finished: true });
    },
  }),
  parallel: (anims) => ({
    start: (cb) => {
      anims.forEach((a) => a.start());
      if (cb) cb({ finished: true });
    },
  }),
  View: createMockComponent('Animated.View'),
  Text: createMockComponent('Animated.Text'),
};

module.exports = {
  Platform: { OS: 'ios', select: (obj) => obj.ios },
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
  },
  View: createMockComponent('View'),
  Text: createMockComponent('Text'),
  TouchableOpacity: createMockComponent('TouchableOpacity'),
  ScrollView: createMockComponent('ScrollView'),
  ActivityIndicator: createMockComponent('ActivityIndicator'),
  Alert: { alert: jest.fn() },
  Animated: AnimatedMock,
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
  PixelRatio: { get: () => 2 },
  NativeModules: {},
  NativeEventEmitter: class { addListener() {} removeListeners() {} },
  findNodeHandle: () => 1,
  UIManager: { getViewManagerConfig: () => ({}) },
  AppState: { currentState: 'active', addEventListener: () => ({}) },
  I18nManager: { isRTL: false },
  Appearance: { getColorScheme: () => 'light' },
  useColorScheme: () => 'light',
};
