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
  Linking,
  Modal,
  FlatList,
  TextInput
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

// Language options with native names and flags
const LANGUAGE_OPTIONS = [
  { id: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { id: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { id: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { id: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { id: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { id: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { id: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { id: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { id: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { id: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { id: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { id: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { id: 'fil', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
  { id: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { id: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { id: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  { id: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { id: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { id: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { id: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { id: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { id: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { id: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { id: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { id: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { id: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { id: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' }
];

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { signOut } = useContext(AuthContext);
  
  const { 
    userSettings, 
    isLoading,
    availableVoices,
    updateVoiceSettings,
  } = useVoiceSettings();

  const { 
    isAudioRoutingEnabled,
    toggleAudioRouting 
  } = useTextToSpeech();
  
  const isDarkMode = theme.background === themes.dark.background;
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find the currently selected voice
  // Handle both voiceId (from TypeScript interface) and selectedVoice (from API response)
  const selectedVoiceId = userSettings?.voiceSettings?.voiceId || 
    (userSettings?.voiceSettings as any)?.selectedVoice;
  
  // First try to find in availableVoices
  let currentVoice = availableVoices.find(voice => voice.id === selectedVoiceId);
  
  // If not found, try to find in the voices array from the API response
  if (!currentVoice && (userSettings?.voiceSettings as any)?.voices) {
    const apiVoices = (userSettings?.voiceSettings as any)?.voices || [];
    currentVoice = apiVoices.find((voice: any) => voice.id === selectedVoiceId);
  }

  const styles = makeStyles(theme);

  const filteredLanguages = searchQuery 
    ? LANGUAGE_OPTIONS.filter(lang => 
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()))
    : LANGUAGE_OPTIONS;

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

  // Add navigation to the Voice Collection screen
  const handleVoiceSelectionPress = () => {
    navigation.navigate('VoiceCollection' as never);
  };

  // Add debug logging for voice selection
  useEffect(() => {
    console.log("Voice Settings Debug:");
    console.log("Selected voice ID:", selectedVoiceId);
    console.log("Current voice found:", currentVoice ? {
      id: currentVoice.id,
      name: currentVoice.name,
      provider: currentVoice.provider
    } : "No voice found");
    console.log("Available voices count:", availableVoices.length);
    console.log("API voices:", (userSettings?.voiceSettings as any)?.voices ? 
      (userSettings?.voiceSettings as any)?.voices.length : "Not available");
  }, [selectedVoiceId, currentVoice, availableVoices, userSettings]);

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

  const renderLanguageModal = () => (
    <Modal
      visible={isLanguageModalVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setLanguageModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{t('language.select')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder={t('general.search')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.text + '50'}
        />
        <FlatList
          data={filteredLanguages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.languageOption}
              onPress={() => {
                handleChangeLanguage(item.id);
                setLanguageModalVisible(false);
                setSearchQuery('');
              }}
            >
              <View style={styles.languageRow}>
                <Text style={styles.languageFlag}>{item.flag}</Text>
                <View style={styles.languageTextContainer}>
                  <Text style={styles.languageText}>{item.nativeName}</Text>
                  <Text style={styles.languageSubtext}>{t(`languages.${item.id}`)}</Text>
                </View>
              </View>
              {i18n.language === item.id && (
                <Ionicons name="checkmark" size={22} color={theme.primary} />
              )}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
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
          {renderSettingItem(
            'language-outline',
            t('language.select'),
            <Text style={styles.settingValueText}>
              {LANGUAGE_OPTIONS.find(l => l.id === i18n.language)?.nativeName || 'English'}
            </Text>,
            () => setLanguageModalVisible(true)
          )}
          {renderLanguageModal()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('voice.settings.title')}</Text>
          
          {/* Current voice selection setting with a better icon and display */}
          {renderSettingItem(
            'mic-circle-outline',
            t('voice.settings.currentVoice', 'Voice'),
            currentVoice ? (
              <View style={styles.voiceValueContainer}>
                <Text style={styles.settingValueText}>
                  {currentVoice.name}
                </Text>
                <View style={styles.voiceProviderBadge}>
                  <Text style={styles.voiceProviderText}>
                    {currentVoice.provider}
                  </Text>
                </View>
              </View>
            ) : selectedVoiceId ? (
              <View style={styles.voiceValueContainer}>
                <Text style={styles.settingValueText}>
                  ID: {selectedVoiceId}
                </Text>
                <View style={styles.voiceProviderBadge}>
                  <Text style={styles.voiceProviderText}>
                    {(userSettings?.voiceSettings as any)?.provider || 'UNKNOWN'}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.settingValueText, {color: theme.error + '80'}]}>
                {t('voice.settings.noVoiceSelected', 'Not selected')}
              </Text>
            ),
            handleVoiceSelectionPress
          )}
          
          {/* Auto-speak setting */}
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
    paddingHorizontal: 20,
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
  // Modal-specific styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  searchInput: {
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: theme.inputBackground || theme.background + '30',
    borderRadius: 8,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 22,
    marginRight: 15,
  },
  languageTextContainer: {
    flexDirection: 'column',
  },
  languageSubtext: {
    fontSize: 14,
    color: theme.text + '80',
  },
  voiceValueContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  voiceProviderBadge: {
    backgroundColor: theme.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  voiceProviderText: {
    fontSize: 10,
    color: theme.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default SettingsScreen; 