import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import useTheme from '../theme/useTheme';
import ShareCardCanvas from './ShareCardCanvas';

const waitForNextPaint = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 40);
  });

const useShareCardComposer = () => {
  const { theme } = useTheme();
  const captureTargetRef = useRef(null);
  const [pendingCard, setPendingCard] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        captureHost: {
          position: 'absolute',
          left: -9999,
          top: 0,
          opacity: 0.01,
          backgroundColor: theme.colors.background,
        },
      }),
    [theme]
  );

  const shareCard = async (cardModel) => {
    if (!cardModel || isSharing) {
      return;
    }
    setPendingCard(cardModel);
    setIsSharing(true);
  };

  useEffect(() => {
    if (!pendingCard || !isSharing) {
      return undefined;
    }

    let cancelled = false;

    const runShare = async () => {
      try {
        await waitForNextPaint();
        const sharingAvailable = await Sharing.isAvailableAsync();
        if (!sharingAvailable) {
          Alert.alert('Sharing unavailable', 'This device cannot share image cards right now.');
          return;
        }

        const imageUri = await captureRef(captureTargetRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });

        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/png',
          dialogTitle: pendingCard.shareLabel || 'Share card',
          UTI: 'public.png',
        });
      } catch (error) {
        Alert.alert('Share failed', 'Unable to prepare this share card right now.');
      } finally {
        if (!cancelled) {
          setPendingCard(null);
          setIsSharing(false);
        }
      }
    };

    runShare();

    return () => {
      cancelled = true;
    };
  }, [isSharing, pendingCard]);

  const shareHost = pendingCard ? (
    <View style={styles.captureHost} pointerEvents="none">
      <View ref={captureTargetRef} collapsable={false}>
        <ShareCardCanvas model={pendingCard} />
      </View>
    </View>
  ) : null;

  return {
    isSharing,
    shareCard,
    shareHost,
  };
};

export default useShareCardComposer;
