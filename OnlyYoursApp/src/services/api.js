import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
});

/**
 * REQUEST INTERCEPTOR — attaches the JWT to every outgoing API call.
 *
 * Concept: Axios interceptors are middleware that run before/after every request.
 * By attaching the token here, we don't need to manually add headers in each screen.
 * This is the Single Responsibility Principle applied to HTTP clients.
 */
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR — global error handling for all API responses.
 *
 * Why a global interceptor?
 * Without this, every single API call needs a catch block that handles
 * 401s, network errors, and server errors. That's repetitive and easy to miss.
 * With this interceptor, common errors are handled once and consistently.
 *
 * Error handling strategy:
 * - 401 Unauthorized: Token expired or invalid → force logout + show message
 *   (Note: auth.logout is set via setLogoutHandler() to avoid circular imports)
 * - 5xx Server Error: Backend crashed or unavailable → user-friendly alert
 * - No response (network error): Device is offline or server unreachable → alert
 * - All other errors: Propagated to the calling code for local handling
 *   (e.g., 400 Bad Request from invalid couple code is handled in PartnerLinkScreen)
 */
let _logoutHandler = null;

export const setLogoutHandler = (fn) => {
    _logoutHandler = fn;
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;

        if (status === 401) {
            // Token has expired or is invalid — clear storage and force re-authentication
            await AsyncStorage.removeItem('userToken');
            if (_logoutHandler) {
                _logoutHandler();
            }
            Alert.alert(
                'Session Expired',
                'Your session has expired. Please sign in again.',
                [{ text: 'OK' }]
            );
        } else if (status >= 500) {
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

        // Always propagate the error so individual screens can also handle it
        return Promise.reject(error);
    }
);

export default api;
 