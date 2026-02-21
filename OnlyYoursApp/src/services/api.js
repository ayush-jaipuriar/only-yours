import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_URL = 'http://localhost:8080/api';
const AUTH_ENDPOINT_PREFIX = '/auth/';

const api = axios.create({
    baseURL: API_URL,
});

const refreshClient = axios.create({
    baseURL: API_URL,
});

/**
 * AsyncStorage keys for auth payload.
 *
 * We keep access and refresh tokens separate:
 * - accessToken: short-lived JWT used on normal API requests
 * - refreshToken: long-lived opaque token used only with /auth/refresh
 */
const STORAGE_KEYS = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    userData: 'userData',
};

let _logoutHandler = null;
let isRefreshing = false;
let refreshPromise = null;
let pendingQueue = [];

const isAuthEndpoint = (url = '') => url.includes(AUTH_ENDPOINT_PREFIX);
const isRefreshEndpoint = (url = '') => url.includes('/auth/refresh');

const processPendingQueue = (error, accessToken = null) => {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
            return;
        }
        resolve(accessToken);
    });
    pendingQueue = [];
};

const persistAuthPayload = async (payload) => {
    const writes = [];

    if (payload?.accessToken) {
        writes.push([STORAGE_KEYS.accessToken, payload.accessToken]);
    }
    if (payload?.refreshToken) {
        writes.push([STORAGE_KEYS.refreshToken, payload.refreshToken]);
    }
    if (payload?.user) {
        writes.push([STORAGE_KEYS.userData, JSON.stringify(payload.user)]);
    }

    if (writes.length > 0) {
        await AsyncStorage.multiSet(writes);
    }
};

const clearAuthStorage = async () => {
    await AsyncStorage.multiRemove([
        STORAGE_KEYS.accessToken,
        STORAGE_KEYS.refreshToken,
        STORAGE_KEYS.userData,
    ]);
};

const refreshAccessToken = async () => {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.refreshToken);
    if (!refreshToken) {
        throw new Error('Missing refresh token');
    }

    const response = await refreshClient.post('/auth/refresh', { refreshToken });
    await persistAuthPayload(response.data);
    return response.data.accessToken;
};

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.accessToken);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const setLogoutHandler = (fn) => {
    _logoutHandler = fn;
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config || {};
        const status = error.response?.status;
        const requestUrl = originalRequest.url || '';

        if (status === 401 && !isAuthEndpoint(requestUrl)) {
            if (isRefreshEndpoint(requestUrl)) {
                await clearAuthStorage();
                if (_logoutHandler) {
                    await _logoutHandler();
                }
                Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please sign in again.',
                    [{ text: 'OK' }]
                );
                return Promise.reject(error);
            }

            if (originalRequest._retry) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push({ resolve, reject });
                }).then((newAccessToken) => {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                });
            }

            isRefreshing = true;
            refreshPromise = refreshAccessToken();

            try {
                const newAccessToken = await refreshPromise;
                processPendingQueue(null, newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processPendingQueue(refreshError, null);
                await clearAuthStorage();
                if (_logoutHandler) {
                    await _logoutHandler();
                }
                Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please sign in again.',
                    [{ text: 'OK' }]
                );
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
                refreshPromise = null;
            }
        }

        if (status >= 500) {
            Alert.alert(
                'Server Error',
                'Something went wrong on our end. Please try again in a moment.',
                [{ text: 'OK' }]
            );
        } else if (!error.response) {
            // No response at all — device is offline or server is unreachable
            Alert.alert(
                'No Connection',
                'Unable to reach the server. Please check your internet connection.',
                [{ text: 'OK' }]
            );
        }

        return Promise.reject(error);
    }
);

export default api;
 