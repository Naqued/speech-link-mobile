import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Theme {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  border: string;
  card: string;
  shadowColor: string;
}

export const themes: { 
  light: Theme;
  dark: Theme;
} = {
  light: {
    background: '#FFFFFF',
    text: '#111111',
    primary: '#4A6FEA',
    secondary: '#8C63EE',
    accent: '#54C7FC',
    error: '#E53935',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
    border: '#E0E0E0',
    card: '#F9F9F9',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    background: '#121212',
    text: '#FFFFFF',
    primary: '#5D7BFF',
    secondary: '#9870F5',
    accent: '#64D2FF',
    error: '#FF5252',
    success: '#69F0AE',
    warning: '#FFD740',
    info: '#40C4FF',
    border: '#2D2D2D',
    card: '#1E1E1E',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
  },
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: themes.light,
  toggleTheme: async () => {},
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [theme, setTheme] = useState(themes.light);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme === 'dark') {
          setTheme(themes.dark);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === themes.light ? themes.dark : themes.light;
    try {
      await AsyncStorage.setItem('theme', newTheme === themes.dark ? 'dark' : 'light');
      setTheme(newTheme);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 