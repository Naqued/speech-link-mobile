import React, { useContext } from 'react';
import { StatusBar, Platform } from 'react-native';

// Context
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext, themes } from '../contexts/ThemeContext';

// Navigators
import MainNavigator from './MainNavigator';
import { AuthNavigator } from './AuthNavigator';

const RootNavigator: React.FC = () => {
  const { token } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  return (
    <>
      <StatusBar 
        barStyle={theme === themes.dark ? 'light-content' : 'dark-content'} 
        backgroundColor={Platform.OS === 'android' ? theme.background : undefined}
      />
      {token ? <MainNavigator /> : <AuthNavigator />}
    </>
  );
};

export default RootNavigator; 