import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Contexts
import { ThemeContext } from '../contexts/ThemeContext';

// Screens
import HomeScreen from '../screens/Home/HomeScreen';
import AACBoardScreen from '../screens/AACBoard/AACBoardScreen';
import VoiceCollectionScreen from '../screens/VoiceCollection/VoiceCollectionScreen';
import HistoryScreen from '../screens/History/HistoryScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

// Types
export type MainTabParamList = {
  Home: undefined;
  AACBoard: undefined;
  VoiceCollection: undefined;
  History: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  Main: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

const MainTabs = () => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'help-outline'; // Default icon

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AACBoard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'VoiceCollection') {
            iconName = focused ? 'mic' : 'mic-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.text,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
        headerStyle: {
          backgroundColor: theme.card,
          shadowColor: theme.shadowColor,
        },
        headerTintColor: theme.text,
      })}
    >
      {/* <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: t('home.title') }} 
      /> */}
      <Tab.Screen 
        name="AACBoard" 
        component={AACBoardScreen} 
        options={{ title: t('aac.title'), headerShown: false }} 
      />
      <Tab.Screen 
        name="VoiceCollection" 
        component={VoiceCollectionScreen} 
        options={{ title: t('voice.collection.title'), headerShown: false }} 
      />
      {/* <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ title: t('history.title') }} 
      /> */}
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: t('settings.title'), headerShown: false }} 
      />
    </Tab.Navigator>
  );
};

export const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}; 