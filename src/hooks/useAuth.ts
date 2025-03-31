import { useState, useEffect } from 'react';
import { authService, AuthToken } from '../services/authService';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.getDevelopmentToken();
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.clearToken();
      setIsAuthenticated(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isAuthenticated,
    error,
    login,
    logout,
  };
}; 