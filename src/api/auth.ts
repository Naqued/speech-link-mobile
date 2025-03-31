import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginWithGoogle = async (accessToken: string) => {
  try {
    const response = await apiClient.post('/api/auth/mobile/google', { accessToken });
    await AsyncStorage.setItem('auth_token', response.data.token);
    return response.data;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('auth_token');
    return apiClient.post('/api/auth/mobile/logout');
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}; 