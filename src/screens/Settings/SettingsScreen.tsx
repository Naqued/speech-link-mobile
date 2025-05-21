import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';

// Hooks
import { useVoiceSettings } from '../../hooks/useVoiceSettings';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';

// Components
import DeveloperSettings from '../../components/SettingsScreen/DeveloperSettings';

// Language options
const LANGUAGE_OPTIONS = [
  { id: 'en', name: 'English' },
  { id: 'fr', name: 'French' },
];

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { signOut } = useContext(AuthContext);
  
  const { 
    userSettings, 
    isLoading, 
    updateVoiceSettings,
  } = useVoiceSettings();

  const { 
    isAudioRoutingEnabled,
    toggleAudioRouting 
  } = useTextToSpeech();
  
  const isDarkMode = theme.background === themes.dark.background;

  const styles = makeStyles(theme);

  const handleChangeLanguage = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem('userLanguage', languageCode);
    } catch (error) {
      console.error('Failed to change language', error);
      Alert.alert(t('general.error'), 'Failed to change language');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('settings.logout'),
      'Are you sure you want to log out?',
      [
        {
          text: t('general.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.logout'),
          onPress: signOut,
        },
      ]
    );
  };

  const handleToggleAutoSpeakSetting = async (value: boolean) => {
    if (!userSettings?.voiceSettings) return;
    
    try {
      await updateVoiceSettings({
        ...userSettings.voiceSettings,
        autoSpeakEnabled: value
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to update auto-speak setting');
    }
  };

  const handleToggleAudioRouting = async (value: boolean) => {
    if (value) {
      // Show confirmation dialog when enabling
      Alert.alert(
        t('voice_settings.audio_routing.confirmation_title'),
        t('voice_settings.audio_routing.confirmation_message'),
        [
          {
            text: t('general.cancel'),
            style: 'cancel',
          },
          {
            text: t('general.enable'),
            onPress: async () => {
              const success = await toggleAudioRouting(true);
              if (!success) {
                Alert.alert(t('general.error'), t('voice_settings.audio_routing.enable_failed'));
              }
            },
          },
        ]
      );
    } else {
      // No confirmation needed when disabling
      const success = await toggleAudioRouting(false);
      if (!success) {
        Alert.alert(t('general.error'), t('voice_settings.audio_routing.disable_failed'));
      }
    }
  };

  const handleSubscriptionPress = () => {
    const url = `https://speech-aac.link/${i18n.language}/profile`;
    Linking.openURL(url).catch((err) => {
      console.error('Error opening subscription URL:', err);
      Alert.alert(t('general.error'), 'Failed to open subscription page');
    });
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    value?: React.ReactNode,
    onPress?: () => void,
    showArrow: boolean = true
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeftContent}>
        <View style={styles.settingIconContainer}>
          <Ionicons name={icon as any} size={22} color={theme.primary} />
        </View>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <View style={styles.settingRightContent}>
        {value}
        {showArrow && onPress && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.text + '80'}
            style={styles.settingArrow}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.theme')}</Text>
          {renderSettingItem(
            'moon-outline',
            t('settings.darkMode'),
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary + '80' }}
              thumbColor={isDarkMode ? theme.primary : '#f4f3f4'}
              ios_backgroundColor={theme.border}
            />,
            undefined,
            false
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          {LANGUAGE_OPTIONS.map((language) => (
            <TouchableOpacity
              key={language.id}
              style={styles.languageOption}
              onPress={() => handleChangeLanguage(language.id)}
            >
              <Text style={styles.languageText}>{t(`languages.${language.id}`)}</Text>
              {i18n.language === language.id && (
                <Ionicons name="checkmark" size={22} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('voice.settings.title')}</Text>
          {renderSettingItem(
            'refresh-circle-outline',
            t('settings.autoSpeakEnabled', 'Auto-Speak'),
            <Switch
              value={userSettings?.voiceSettings?.autoSpeakEnabled ?? false}
              onValueChange={handleToggleAutoSpeakSetting}
              disabled={isLoading}
              trackColor={{ false: theme.border, true: theme.primary + '80' }}
              thumbColor={userSettings?.voiceSettings?.autoSpeakEnabled ? theme.primary : '#f4f3f4'}
            />,
            undefined,
            false
          )}
          {/* {renderSettingItem(
            'mic-outline',
            t('voice_settings.audio_routing.title'),
            <Switch
              value={isAudioRoutingEnabled}
              onValueChange={handleToggleAudioRouting}
              disabled={isLoading}
              trackColor={{ false: theme.border, true: theme.primary + '80' }}
              thumbColor={isAudioRoutingEnabled ? theme.primary : '#f4f3f4'}
            />,
            undefined,
            false
          )}
          {isAudioRoutingEnabled && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                {t('voice_settings.audio_routing.warning')}
              </Text>
            </View>
          )} */}
          {renderSettingItem(
            'trending-up-outline',
            t('voice.settings.pitch'),
            <Text style={styles.settingValueText}>Medium</Text>
          )}
          {renderSettingItem(
            'volume-high-outline',
            t('voice.settings.volume'),
            <Text style={styles.settingValueText}>80%</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          {renderSettingItem(
            'person-outline',
            t('profile.title'),
            undefined,
            () => navigation.navigate('Profile' as never)
          )}
          {renderSettingItem(
            'card-outline',
            t('profile.subscription'),
            undefined,
            handleSubscriptionPress
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
          {renderSettingItem(
            'information-circle-outline',
            t('settings.about'),
            undefined,
            () => navigation.navigate('About' as never)
          )}
          {renderSettingItem(
            'shield-checkmark-outline',
            t('settings.privacy'),
            undefined,
            () => Linking.openURL(`${process.env.APP_DOMAIN || 'https://speech-aac.link'}/${i18n.language}/privacy-policy`)
          )}
          {renderSettingItem(
            'document-text-outline',
            t('settings.terms'),
            undefined,
            () => Linking.openURL(`${process.env.APP_DOMAIN || 'https://speech-aac.link'}/${i18n.language}/terms-of-service`)
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer</Text>
          <DeveloperSettings />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>{t('settings.logout')}</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Copy of themes from ThemeContext to avoid circular dependency
const themes = {
  light: {
    background: '#FFFFFF',
  },
  dark: {
    background: '#121212',
  },
};

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginVertical: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  settingLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    color: theme.text,
  },
  settingRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 14,
    color: theme.text + '80',
    marginRight: 10,
  },
  settingArrow: {
    marginLeft: 5,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  languageText: {
    fontSize: 16,
    color: theme.text,
  },
  warningContainer: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: theme.error + '20',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: theme.error,
  },
  premiumBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.error,
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  versionText: {
    fontSize: 14,
    color: theme.text + '50',
  },
});

export default SettingsScreen; 