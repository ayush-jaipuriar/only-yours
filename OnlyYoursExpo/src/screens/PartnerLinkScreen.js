import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Share,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ScrollView,
  Clipboard,
  Platform,
  useWindowDimensions,
} from 'react-native';
import api from '../services/api';
import useTheme from '../theme/useTheme';
import { announceForAccessibility } from '../accessibility';

const HeartIllustration = ({ primaryColor, linkColor }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -6, duration: 1800, useNativeDriver: true }),
        Animated.timing(float, { toValue: 6, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    return () => {
      pulse.stopAnimation();
      float.stopAnimation();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.heartContainer,
        { transform: [{ scale: pulse }, { translateY: float }] },
      ]}
    >
      <View style={styles.heartRow}>
        <View style={[styles.heartHalf, styles.heartLeft, { backgroundColor: primaryColor }]} />
        <View style={[styles.heartHalf, styles.heartRight, { backgroundColor: primaryColor }]} />
      </View>
      <View style={[styles.heartBottom, { borderTopColor: primaryColor }]} />
      <View style={[styles.linkLine, { backgroundColor: linkColor }]} />
      <View style={[styles.linkDot, { backgroundColor: linkColor }]} />
    </Animated.View>
  );
};

const PartnerLinkScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loadingGen, setLoadingGen] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const codeReveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (generatedCode) {
      codeReveal.setValue(0);
      Animated.spring(codeReveal, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [generatedCode]);

  const generateCode = async () => {
    setLoadingGen(true);
    try {
      const res = await api.post('/couple/generate-code');
      setGeneratedCode(res.data.code);
      announceForAccessibility(`Partner code generated. ${res.data.code.split('').join(' ')}`);
    } catch {
      Alert.alert('Oops', 'Could not generate a code right now. Please try again.');
    } finally {
      setLoadingGen(false);
    }
  };

  const shareCode = async () => {
    if (!generatedCode) return;
    try {
      await Share.share({
        message: `Hey! Let's connect on Only Yours \u2764\uFE0F\nUse my partner code: ${generatedCode}`,
      });
    } catch {}
  };

  const copyCode = () => {
    if (!generatedCode) return;
    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(generatedCode);
    } else {
      Clipboard.setString(generatedCode);
    }
    setCopied(true);
    announceForAccessibility('Partner code copied.');
    setTimeout(() => setCopied(false), 2000);
  };

  const link = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      Alert.alert('Missing Code', 'Please enter the code your partner shared with you.');
      return;
    }
    setLoadingLink(true);
    try {
      await api.post('/couple/link', { code: trimmed });
      announceForAccessibility('Partner code accepted. You are now connected.');
      Alert.alert(
        'You\'re Connected!',
        'You and your partner are now linked. Time to start playing!',
        [{ text: 'Let\'s Go', onPress: () => navigation.navigate('Dashboard') }],
      );
    } catch {
      Alert.alert('Invalid Code', 'That code didn\'t work. Ask your partner for a new one.');
    } finally {
      setLoadingLink(false);
    }
  };

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          backgroundColor: theme.colors.background,
        },
        heading: {
          color: theme.colors.textPrimary,
        },
        subheading: {
          color: theme.colors.textSecondary,
        },
        card: {
          backgroundColor: theme.colors.surfaceOverlay,
          shadowColor: theme.colors.glowPrimary,
          borderColor: theme.colors.border,
        },
        heartHalf: {
          backgroundColor: theme.colors.primary,
        },
        heartBottom: {
          borderTopColor: theme.colors.primary,
        },
        linkDetail: {
          backgroundColor: theme.colors.border,
        },
        stepBadge: {
          backgroundColor: theme.colors.surfaceEmphasis,
        },
        stepText: {
          color: theme.colors.primary,
        },
        cardTitle: {
          color: theme.colors.textPrimary,
        },
        cardDescription: {
          color: theme.colors.textTertiary,
        },
        primaryButton: {
          backgroundColor: theme.colors.primary,
        },
        primaryButtonText: {
          color: theme.colors.primaryContrast,
        },
        codeBadge: {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.borderAccent,
        },
        codeText: {
          color: theme.colors.textPrimary,
        },
        actionButton: {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
        },
        actionButtonText: {
          color: theme.colors.primary,
        },
        shareButton: {
          backgroundColor: theme.colors.accent,
          borderColor: theme.colors.accent,
        },
        shareButtonText: {
          color: theme.colors.accentContrast,
        },
        input: {
          backgroundColor: theme.colors.surfaceInput,
          borderColor: theme.colors.border,
          color: theme.colors.textPrimary,
        },
        connectButton: {
          backgroundColor: theme.colors.accent,
          shadowColor: theme.colors.glowAccent,
        },
      }),
    [theme]
  );

  return (
    <ScrollView
      style={[styles.screen, dynamicStyles.screen]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.View
        style={[
          styles.animatedWrapper,
          { width: '100%', maxWidth: isTablet ? 760 : 520 },
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <HeartIllustration primaryColor={theme.colors.primary} linkColor={theme.colors.border} />

        <Text style={[styles.heading, dynamicStyles.heading]} accessibilityRole="header">Link with Partner</Text>
        <Text style={[styles.subheading, dynamicStyles.subheading]}>
          Share your code or enter theirs to connect
        </Text>

        {/* --- Generate & Share Section --- */}
        <View style={[styles.card, dynamicStyles.card]} accessible={false}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, dynamicStyles.stepBadge]}>
              <Text style={[styles.stepText, dynamicStyles.stepText]}>1</Text>
            </View>
            <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>Share your code</Text>
          </View>
          <Text style={[styles.cardDescription, dynamicStyles.cardDescription]}>
            Generate a unique code and send it to your partner
          </Text>

          {generatedCode ? (
            <Animated.View
              style={[
                styles.codeResultContainer,
                {
                  opacity: codeReveal,
                  transform: [{ scale: codeReveal }],
                },
              ]}
            >
              <View
                style={[styles.codeBadge, dynamicStyles.codeBadge]}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`Generated partner code ${generatedCode.split('').join(' ')}`}
              >
                <Text style={[styles.codeText, dynamicStyles.codeText]}>{generatedCode}</Text>
              </View>

              <View style={styles.codeActions}>
                <TouchableOpacity
                  style={[styles.actionButton, dynamicStyles.actionButton]}
                  onPress={copyCode}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={copied ? 'Partner code copied' : 'Copy partner code'}
                  accessibilityHint="Copies the generated partner code to your clipboard."
                >
                  <Text style={[styles.actionButtonText, dynamicStyles.actionButtonText]}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, dynamicStyles.actionButton, styles.shareButton, dynamicStyles.shareButton]}
                  onPress={shareCode}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Share partner code"
                  accessibilityHint="Opens the native share sheet with your generated partner code."
                >
                  <Text style={[styles.actionButtonText, dynamicStyles.actionButtonText, styles.shareButtonText, dynamicStyles.shareButtonText]}>
                    Share
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, dynamicStyles.primaryButton, loadingGen && styles.buttonDisabled]}
              onPress={generateCode}
              disabled={loadingGen}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={loadingGen ? 'Generating partner code' : 'Generate partner code'}
              accessibilityHint="Requests a new partner code that you can share."
              accessibilityState={{ disabled: loadingGen }}
            >
              {loadingGen ? (
                <ActivityIndicator color={theme.colors.primaryContrast} size="small" />
              ) : (
                <Text style={[styles.primaryButtonText, dynamicStyles.primaryButtonText]}>Generate Code</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* --- Divider --- */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.dividerText, { color: theme.colors.textTertiary }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        </View>

        {/* --- Enter Code Section --- */}
        <View style={[styles.card, dynamicStyles.card]} accessible={false}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, dynamicStyles.stepBadge]}>
              <Text style={[styles.stepText, dynamicStyles.stepText]}>2</Text>
            </View>
            <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>Enter their code</Text>
          </View>
          <Text style={[styles.cardDescription, dynamicStyles.cardDescription]}>
            Paste the code your partner shared with you
          </Text>

          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="e.g. ABCD1234"
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="characters"
            style={[styles.input, dynamicStyles.input]}
            accessibilityLabel="Partner code"
            accessibilityHint="Enter the code your partner shared with you."
          />

          <TouchableOpacity
            style={[
              styles.connectButton,
              dynamicStyles.connectButton,
              (!code.trim() || loadingLink) && styles.buttonDisabled,
            ]}
            onPress={link}
            disabled={!code.trim() || loadingLink}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={loadingLink ? 'Connecting to partner' : 'Connect with partner code'}
            accessibilityHint="Links your account with your partner using the entered code."
            accessibilityState={{ disabled: !code.trim() || loadingLink }}
          >
            {loadingLink ? (
              <ActivityIndicator color={theme.colors.accentContrast} size="small" />
            ) : (
              <Text style={[styles.primaryButtonText, dynamicStyles.shareButtonText]}>Connect</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F5FF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  animatedWrapper: {
    alignItems: 'center',
  },

  heartContainer: {
    width: 80,
    height: 90,
    alignItems: 'center',
    marginBottom: 8,
  },
  heartRow: {
    flexDirection: 'row',
    gap: 0,
  },
  heartHalf: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6A4CFF',
  },
  heartLeft: {
    marginRight: -4,
  },
  heartRight: {
    marginLeft: -4,
  },
  heartBottom: {
    width: 0,
    height: 0,
    borderLeftWidth: 28,
    borderRightWidth: 28,
    borderTopWidth: 32,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#6A4CFF',
    marginTop: -8,
  },
  linkLine: {
    width: 2,
    height: 16,
    backgroundColor: '#D9D3F3',
    marginTop: 4,
  },
  linkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9D3F3',
  },

  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2D225A',
    marginTop: 4,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 15,
    color: '#6B5FA8',
    marginBottom: 24,
    textAlign: 'center',
  },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#6A4CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EDE9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6A4CFF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D225A',
  },
  cardDescription: {
    fontSize: 13,
    color: '#8A82B0',
    marginBottom: 16,
    marginLeft: 34,
  },

  primaryButton: {
    backgroundColor: '#6A4CFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  codeResultContainer: {
    alignItems: 'center',
  },
  codeBadge: {
    backgroundColor: '#F0EDFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 1.5,
    borderColor: '#D9D3F3',
    borderStyle: 'dashed',
    marginBottom: 14,
  },
  codeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D225A',
    letterSpacing: 4,
    textAlign: 'center',
  },
  codeActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F0EDFF',
    borderWidth: 1,
    borderColor: '#D9D3F3',
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 15,
    color: '#6A4CFF',
  },
  shareButton: {
    backgroundColor: '#6A4CFF',
    borderColor: '#6A4CFF',
  },
  shareButtonText: {
    color: '#FFFFFF',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D9D3F3',
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 14,
    color: '#8A82B0',
    fontWeight: '500',
  },

  input: {
    backgroundColor: '#F9F8FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9D3F3',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    letterSpacing: 2,
    color: '#2D225A',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 14,
  },
  connectButton: {
    backgroundColor: '#03DAC6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#03DAC6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
});

export default PartnerLinkScreen;
