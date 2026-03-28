import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import api from '../services/api';
import {
  VelvetFocusedScreen,
  VelvetHeroCard,
  VelvetPrimaryButton,
  VelvetSectionCard,
  VelvetSecondaryButton,
  VelvetStatusPill,
  VelvetTextField,
} from '../components/velvet';
import { HAPTIC_EVENTS, useHaptics } from '../haptics';
import useTheme from '../theme/useTheme';
import { announceForAccessibility } from '../accessibility';

// eslint-disable-next-line react/prop-types
const PartnerLinkScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { triggerHaptic } = useHaptics();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loadingGen, setLoadingGen] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        scrollContent: {
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 44,
          alignSelf: 'center',
          width: '100%',
          maxWidth: isTablet ? 780 : 540,
        },
        introWrap: {
          width: '100%',
          marginBottom: 16,
        },
        eyebrow: {
          color: theme.colors.textTertiary,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: 8,
        },
        title: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: isTablet ? 38 : 32,
          lineHeight: isTablet ? 42 : 36,
          marginBottom: 10,
        },
        body: {
          color: theme.colors.textSecondary,
          fontSize: 15,
          lineHeight: 22,
        },
        introMeta: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 14,
        },
        introDot: {
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: theme.colors.primary,
          marginRight: 8,
          shadowColor: theme.colors.glowPrimary,
          shadowOpacity: 0.7,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
        },
        introMetaText: {
          color: theme.colors.textTertiary,
          fontSize: 13,
        },
        heroCard: {
          width: '100%',
          marginBottom: 14,
          overflow: 'hidden',
        },
        heroGlow: {
          position: 'absolute',
          top: -34,
          right: -16,
          width: isTablet ? 220 : 170,
          height: isTablet ? 220 : 170,
          borderRadius: 999,
          backgroundColor: theme.colors.glowPrimary,
          opacity: 0.45,
        },
        heroTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: isTablet ? 30 : 28,
          lineHeight: isTablet ? 34 : 32,
          marginTop: 12,
          marginBottom: 8,
        },
        heroBody: {
          color: theme.colors.textSecondary,
          fontSize: 15,
          lineHeight: 22,
        },
        heroActionRow: {
          flexDirection: isTablet ? 'row' : 'column',
          marginTop: 18,
        },
        heroPrimary: {
          flex: 1,
          marginRight: isTablet ? 10 : 0,
          marginBottom: isTablet ? 0 : 10,
        },
        heroSecondary: {
          flex: isTablet ? 0.8 : 1,
        },
        panel: {
          width: '100%',
          marginBottom: 14,
        },
        panelHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        panelHeaderCopy: {
          flex: 1,
          paddingRight: 12,
        },
        panelTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: 22,
          lineHeight: 26,
          marginBottom: 4,
        },
        panelBody: {
          color: theme.colors.textSecondary,
          fontSize: 13,
          lineHeight: 20,
        },
        codeBadge: {
          borderRadius: 20,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: theme.colors.borderAccent,
          backgroundColor: theme.colors.surfaceEmphasis,
          paddingVertical: 20,
          paddingHorizontal: 18,
          marginTop: 4,
          marginBottom: 16,
        },
        codeText: {
          color: theme.colors.textPrimary,
          textAlign: 'center',
          fontFamily: theme.fontFamilies.heading,
          fontSize: isTablet ? 34 : 30,
          letterSpacing: 4,
        },
        actionRow: {
          flexDirection: isTablet ? 'row' : 'column',
        },
        rowButton: {
          flex: 1,
          marginRight: isTablet ? 10 : 0,
          marginBottom: isTablet ? 0 : 10,
        },
        dividerRow: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 14,
        },
        dividerLine: {
          flex: 1,
          height: 1,
          backgroundColor: theme.colors.border,
        },
        dividerText: {
          marginHorizontal: 14,
          color: theme.colors.textTertiary,
          fontSize: 13,
          fontWeight: '600',
        },
        field: {
          textAlign: 'center',
          letterSpacing: 2.2,
          fontSize: 18,
          fontWeight: '700',
          textTransform: 'uppercase',
        },
        helperCard: {
          minHeight: 172,
          justifyContent: 'space-between',
        },
        helperTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: 22,
          lineHeight: 26,
          marginBottom: 8,
        },
        helperBody: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          lineHeight: 21,
        },
        securityNote: {
          width: '100%',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingTop: 8,
        },
        securityText: {
          color: theme.colors.textTertiary,
          fontSize: 12,
          lineHeight: 18,
          textAlign: 'center',
          marginTop: 8,
          maxWidth: 360,
        },
        successWrap: {
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 44,
        },
        successCard: {
          width: '100%',
          maxWidth: 520,
          alignItems: 'center',
          paddingTop: 30,
          paddingBottom: 24,
        },
        successIcon: {
          fontSize: 42,
          marginBottom: 16,
        },
        successTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: 34,
          lineHeight: 38,
          textAlign: 'center',
          marginBottom: 10,
        },
        successBody: {
          color: theme.colors.textSecondary,
          fontSize: 15,
          lineHeight: 22,
          textAlign: 'center',
          marginBottom: 20,
        },
        successRow: {
          flexDirection: isTablet ? 'row' : 'column',
          width: '100%',
        },
      }),
    [isTablet, theme]
  );

  const generateCode = async () => {
    setLoadingGen(true);
    try {
      const res = await api.post('/couple/generate-code');
      setGeneratedCode(res.data.code);
      announceForAccessibility(`Partner code generated. ${res.data.code.split('').join(' ')}`);
      triggerHaptic(HAPTIC_EVENTS.PARTNER_CODE_GENERATED);
    } catch {
      Alert.alert('Oops', 'Could not generate a code right now. Please try again.');
      triggerHaptic(HAPTIC_EVENTS.ACTION_ERROR);
    } finally {
      setLoadingGen(false);
    }
  };

  const shareCode = async () => {
    if (!generatedCode) {
      return;
    }
    try {
      await Share.share({
        message: `Hey! Let's connect on Only Yours ❤️\nUse my partner code: ${generatedCode}`,
      });
      triggerHaptic(HAPTIC_EVENTS.PARTNER_CODE_SHARED);
    } catch {
      // Native share sheet dismissal does not need user-facing error treatment.
    }
  };

  const copyCode = () => {
    if (!generatedCode) {
      return;
    }

    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(generatedCode);
    } else {
      Clipboard.setString(generatedCode);
    }

    setCopied(true);
    announceForAccessibility('Partner code copied.');
    triggerHaptic(HAPTIC_EVENTS.PARTNER_CODE_COPIED);
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
      triggerHaptic(HAPTIC_EVENTS.INVITATION_ACCEPTED);
      setIsConnected(true);
    } catch {
      Alert.alert('Invalid Code', 'That code did not work. Ask your partner for a fresh code and try again.');
      triggerHaptic(HAPTIC_EVENTS.ACTION_ERROR);
    } finally {
      setLoadingLink(false);
    }
  };

  if (isConnected) {
    return (
      <VelvetFocusedScreen
        navigation={navigation}
        title="Partner Linked"
        subtitle="Connection established"
        withAtmosphere
        atmosphere="auth"
      >
        <View style={dynamicStyles.successWrap}>
          <VelvetHeroCard style={dynamicStyles.successCard}>
            <Text style={dynamicStyles.successIcon}>💞</Text>
            <Text style={dynamicStyles.successTitle}>You&apos;re connected.</Text>
            <Text style={dynamicStyles.successBody}>
              Your shared space is ready. Start your first game together or head back to the dashboard and explore your new home for two.
            </Text>
            <View style={dynamicStyles.successRow}>
              <VelvetPrimaryButton
                label="Start First Game"
                onPress={() => navigation.navigate('CategorySelection')}
                style={dynamicStyles.heroPrimary}
              />
              <VelvetSecondaryButton
                label="Go to Dashboard"
                onPress={() => navigation.navigate('Dashboard')}
                style={dynamicStyles.heroSecondary}
              />
            </View>
          </VelvetHeroCard>
        </View>
      </VelvetFocusedScreen>
    );
  }

  return (
    <VelvetFocusedScreen
      navigation={navigation}
      title="Link with Partner"
      subtitle="Private connection setup"
      withAtmosphere
      atmosphere="auth"
    >
      <ScrollView
        contentContainerStyle={dynamicStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={dynamicStyles.introWrap}>
          <Text style={dynamicStyles.eyebrow}>Private Connection</Text>
          <Text style={dynamicStyles.title}>Complete your shared space.</Text>
          <Text style={dynamicStyles.body}>
            Link with your partner to unlock games, progression, celebrations, and the relationship rituals that make Only Yours feel like a world built for two.
          </Text>
          <View style={dynamicStyles.introMeta}>
            <View style={dynamicStyles.introDot} />
            <Text style={dynamicStyles.introMetaText}>Transactional flow only. No bottom navigation here.</Text>
          </View>
        </View>

        <VelvetHeroCard style={dynamicStyles.heroCard}>
          <View style={dynamicStyles.heroGlow} />
          <VelvetStatusPill label="Step 1" tone="accent" />
          <Text style={dynamicStyles.heroTitle}>Generate a code and send it to your partner.</Text>
          <Text style={dynamicStyles.heroBody}>
            Your code is unique to this connection flow. Copy it instantly or send it through the native share sheet.
          </Text>

          {generatedCode ? (
            <>
              <View
                style={dynamicStyles.codeBadge}
                accessible
                accessibilityLabel={`Generated partner code ${generatedCode.split('').join(' ')}`}
              >
                <Text style={dynamicStyles.codeText}>{generatedCode}</Text>
              </View>
              <View style={dynamicStyles.actionRow}>
                <VelvetSecondaryButton
                  label={copied ? 'Copied!' : 'Copy Code'}
                  onPress={copyCode}
                  style={dynamicStyles.rowButton}
                  accessibilityLabel={copied ? 'Partner code copied' : 'Copy partner code'}
                  accessibilityHint="Copies the generated partner code to your clipboard."
                />
                <VelvetPrimaryButton
                  label="Share Code"
                  onPress={shareCode}
                  style={dynamicStyles.rowButton}
                  accessibilityLabel="Share partner code"
                  accessibilityHint="Opens the native share sheet with your generated partner code."
                />
              </View>
            </>
          ) : (
            <View style={dynamicStyles.heroActionRow}>
              <VelvetPrimaryButton
                label={loadingGen ? 'Generating...' : 'Generate Code'}
                onPress={generateCode}
                loading={loadingGen}
                disabled={loadingGen}
                style={dynamicStyles.heroPrimary}
                accessibilityLabel={loadingGen ? 'Generating partner code' : 'Generate partner code'}
                accessibilityHint="Requests a new partner code that you can share."
              />
              <VelvetSecondaryButton
                label="Need theirs instead?"
                onPress={() => null}
                disabled
                style={dynamicStyles.heroSecondary}
              />
            </View>
          )}
        </VelvetHeroCard>

        <View style={dynamicStyles.dividerRow}>
          <View style={dynamicStyles.dividerLine} />
          <Text style={dynamicStyles.dividerText}>or</Text>
          <View style={dynamicStyles.dividerLine} />
        </View>

        <VelvetSectionCard style={dynamicStyles.panel}>
          <View style={dynamicStyles.panelHeader}>
            <View style={dynamicStyles.panelHeaderCopy}>
              <Text style={dynamicStyles.panelTitle}>Enter their code</Text>
              <Text style={dynamicStyles.panelBody}>
                Paste the code your partner sent you to connect accounts instantly.
              </Text>
            </View>
            <VelvetStatusPill label="Step 2" tone="primary" />
          </View>

          <VelvetTextField
            label="Partner code"
            value={code}
            onChangeText={setCode}
            placeholder="e.g. ABCD1234"
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel="Partner code"
            accessibilityHint="Enter the code your partner shared with you."
            inputStyle={dynamicStyles.field}
          />

          <VelvetPrimaryButton
            label="Connect Now"
            onPress={link}
            loading={loadingLink}
            disabled={!code.trim() || loadingLink}
            accessibilityLabel={loadingLink ? 'Connecting to partner' : 'Connect with partner code'}
            accessibilityHint="Links your account with your partner using the entered code."
          />
        </VelvetSectionCard>

        <VelvetSectionCard style={[dynamicStyles.panel, dynamicStyles.helperCard]}>
          <View>
            <Text style={dynamicStyles.helperTitle}>What happens after linking?</Text>
            <Text style={dynamicStyles.helperBody}>
              You will be able to start shared games, create private custom decks, unlock milestones together, and resume active sessions from the dashboard.
            </Text>
          </View>
          <VelvetSecondaryButton
            label="Go to Dashboard"
            onPress={() => navigation.navigate('Dashboard')}
          />
        </VelvetSectionCard>

        <View style={dynamicStyles.securityNote}>
          <VelvetStatusPill label="Private by design" tone="neutral" />
          <Text style={dynamicStyles.securityText}>
            This flow is intentionally focused. Linking is a high-trust relationship action, so the screen keeps the user on task and avoids unrelated navigation noise.
          </Text>
        </View>
      </ScrollView>
    </VelvetFocusedScreen>
  );
};

export default PartnerLinkScreen;
