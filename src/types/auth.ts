export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user?: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
  accessToken?: string;
  token?: string;
  access_token?: string;
  refreshToken?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthError {
  error: string;
  code: string;
  details?: Record<string, any>;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface GoogleAuthResponse {
  token: string;
  refreshToken?: string;
  user?: User;
}

export interface AppleAuthResponse {
  token: string;
  refreshToken?: string;
  user?: User;
} 