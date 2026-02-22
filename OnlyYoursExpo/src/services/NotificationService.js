import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.warn('[Notifications] Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6A4CFF',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  if (!projectId) {
    console.error('[Notifications] EAS projectId not found in app.json');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (error) {
    const message = error?.message || String(error);
    if (message.includes('Default FirebaseApp is not initialized')) {
      console.warn(
        '[Notifications] Android push is not configured yet. Add Firebase android config (google-services.json), rebuild the dev client, and retry.'
      );
      return null;
    }
    throw error;
  }
}

async function sendTokenToBackend(token) {
  try {
    const deviceId = Device.osBuildId || Device.modelId || null;
    await api.post('/push/register', { token, deviceId });
    console.log('[Notifications] Push token registered with backend');
  } catch (error) {
    console.error('[Notifications] Failed to register push token:', error?.message);
  }
}

async function unregisterToken(token) {
  try {
    await api.delete('/push/unregister', { data: { token } });
  } catch (error) {
    console.error('[Notifications] Failed to unregister push token:', error?.message);
  }
}

function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export default {
  registerForPushNotifications,
  sendTokenToBackend,
  unregisterToken,
  addNotificationReceivedListener,
  addNotificationResponseListener,
};
