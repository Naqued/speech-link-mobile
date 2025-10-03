import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Contexts
import { ThemeContext } from '../contexts/ThemeContext';
import { DiscordProvider } from '../contexts/DiscordContext';

// Screens
import HomeScreen from '../screens/Home/HomeScreen';
import AACBoardScreen from '../screens/AACBoard/AACBoardScreen';
import VoiceCollectionScreen from '../screens/VoiceCollection/VoiceCollectionScreen';
import HistoryScreen from '../screens/History/HistoryScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import AboutScreen from '../screens/About/AboutScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicy/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfService/TermsOfServiceScreen';
import DiscordSettingsScreen from '../screens/Discord/DiscordSettingsScreen';
import DictionaryScreen from '../screens/Dictionary/DictionaryScreen';
import AudioOutputSettings from '../screens/Settings/AudioOutputSettings';

// Types
export type MainTabParamList = {
  Home: undefined;
  AACBoard: undefined;
  VoiceCollection: undefined;
  Dictionary: undefined;
  History: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
  About: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  DiscordSettings: undefined;
  AudioOutputSettings: undefined;
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
          } else if (route.name === 'Dictionary') {
            iconName = focused ? 'book' : 'book-outline';
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
        options={{ title: t('aac.title') || 'AAC Board', headerShown: false }} 
      />
      <Tab.Screen 
        name="VoiceCollection" 
        component={VoiceCollectionScreen} 
        options={{ title: t('voice.collection.title') || 'Voice Collection', headerShown: false }} 
      />
      <Tab.Screen 
        name="Dictionary" 
        component={DictionaryScreen} 
        options={{ title: t('dictionary.title') || 'Dictionary', headerShown: false }} 
      />
      {/* <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ title: t('history.title') }} 
      /> */}
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: t('settings.title') || 'Settings', headerShown: false }} 
      />
    </Tab.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <DiscordProvider>
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="DiscordSettings" component={DiscordSettingsScreen} />
      <Stack.Screen name="AudioOutputSettings" component={AudioOutputSettings} />
    </Stack.Navigator>
    </DiscordProvider>
  );
};

export default MainNavigator; 