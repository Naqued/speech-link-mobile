import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceSettings } from '../../hooks/useVoiceSettings';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { Voice } from '../../services/ttsService';
import { ThemeContext } from '../../contexts/ThemeContext';
import { VoiceSettings } from '../../services/voiceSettingsService';
import { Audio } from 'expo-av';
import { apiService } from '../../services/apiService';
import { useTranslation } from 'react-i18next';

const VoiceSettingsScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const { 
    userSettings, 
    availableVoices, 
    isLoading, 
    loadingVoices, 
    error, 
    updateVoiceSettings,
    toggleFavoriteVoice,
    refreshSettings
  } = useVoiceSettings();
  
  const { 
    speak, 
    isLoading: isSpeaking, 
    previewVoice,
    isAudioRoutingEnabled,
    toggleAudioRouting 
  } = useTextToSpeech();
  
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [previewSound, setPreviewSound] = useState<Audio.Sound | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Filter voices based on current filters
  const filteredVoices = availableVoices.filter(voice => {
    if (showFavoritesOnly && userSettings?.favorites?.voices) {
      if (!userSettings.favorites.voices.includes(voice.id)) {
        return false;
      }
    }
    
    if (selectedProvider && voice.provider !== selectedProvider) {
      return false;
    }
    
    return true;
  });

  const handleVoiceSelect = async (voice: Voice) => {
    if (!userSettings?.voiceSettings) return;
    
    try {
      await updateVoiceSettings({
        ...userSettings.voiceSettings,
        provider: voice.provider,
        voiceId: voice.id
      });
      
      Alert.alert('Success', `Voice set to ${voice.name}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to update voice selection');
    }
  };

  const handleToggleFavorite = async (voice: Voice) => {
    try {
      // Only consider the API favorites (from userSettings.favorites.voices)
      const isFavorite = !userSettings?.favorites?.voices?.includes(voice.id);
      
      // Gather all available metadata from the voice object
      const voiceDetails = {
        gender: voice.gender,
        accent: voice.accent,
        age: voice.age,
        use_case: voice.use_case,
        description: voice.description,
        publicOwnerId: voice.publicOwnerId || voice.public_owner_id,
        previewUrl: voice.previewUrl
      };
      
      await toggleFavoriteVoice(voice.id, isFavorite, voice.name, voiceDetails);
    } catch (err) {
      console.error('Error toggling favorite voice', err);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handlePreviewVoice = async (voice: Voice) => {
    try {
      setIsPreviewLoading(true);
      setPreviewError(null);

      // Stop any existing preview
      if (previewSound) {
        await previewSound.unloadAsync();
        setPreviewSound(null);
      }

      // Use the previewVoice function from useTextToSpeech hook
      // Pass the publicOwnerId and voiceName for shared voices
      await previewVoice(
        voice.id, 
        voice.provider, 
        voice.public_owner_id || voice.publicOwnerId, 
        voice.name
      );
      
      setIsPreviewLoading(false);
    } catch (error) {
      console.error('Error previewing voice:', error);
      setPreviewError(error instanceof Error ? error.message : 'Failed to preview voice');
      setIsPreviewLoading(false);
      Alert.alert('Error', 'Failed to preview voice');
    }
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

  const handleToggleEnhancementSetting = async (value: boolean) => {
    if (!userSettings?.voiceSettings) return;
    
    try {
      await updateVoiceSettings({
        ...userSettings.voiceSettings,
        enhancementEnabled: value
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to update enhancement setting');
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
                Alert.alert(t('general.error'), t('voice_settings.audio_routing.enable_failed', 'Failed to enable audio routing'));
              }
            },
          },
        ]
      );
    } else {
      // No confirmation needed when disabling
      const success = await toggleAudioRouting(false);
      if (!success) {
        Alert.alert(t('general.error'), t('voice_settings.audio_routing.disable_failed', 'Failed to disable audio routing'));
      }
    }
  };

  const renderVoiceItem = ({ item }: { item: Voice }) => {
    const isSelected = userSettings?.voiceSettings?.voiceId === item.id;
    // Only use API favorites (from userSettings.favorites.voices), not the item.isFavorite property
    const isFavorite = userSettings?.favorites?.voices?.includes(item.id);
    const isPreviewing = isPreviewLoading && userSettings?.voiceSettings?.voiceId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.voiceItem,
          isSelected && { backgroundColor: theme.background + '30' },
        ]}
        onPress={() => handleVoiceSelect(item)}
      >
        <View style={styles.voiceInfo}>
          <Text style={[styles.voiceName, { color: theme.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.voiceDetails, { color: theme.text + '80' }]}>
            {item.provider} • {item.language || 'English'}
          </Text>
        </View>
        
        <View style={styles.voiceActions}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleToggleFavorite(item)}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? "#FF3B30" : theme.text + '80'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => handlePreviewVoice(item)}
            disabled={isPreviewing}
          >
            {isPreviewing ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons
                name="play-circle-outline"
                size={26}
                color={theme.primary}
              />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshSettings}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Voice Settings</Text>
          
          <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Auto-speak in Text Mode</Text>
            <Switch
              value={userSettings?.voiceSettings?.autoSpeakEnabled ?? false}
              onValueChange={handleToggleAutoSpeakSetting}
              disabled={isLoading}
              trackColor={{ false: '#767577', true: theme.primary + '50' }}
              thumbColor={userSettings?.voiceSettings?.autoSpeakEnabled ? theme.primary : '#f4f3f4'}
            />
          </View>
          
          <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Enable Voice Enhancement</Text>
            <Switch
              value={userSettings?.voiceSettings?.enhancementEnabled ?? false}
              onValueChange={handleToggleEnhancementSetting}
              disabled={isLoading}
              trackColor={{ false: '#767577', true: theme.primary + '50' }}
              thumbColor={userSettings?.voiceSettings?.enhancementEnabled ? theme.primary : '#f4f3f4'}
            />
          </View>
          
          <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Route Audio to Microphone
              </Text>
              <Text style={[styles.settingDescription, { color: theme.text + '80' }]}>
                Send synthesized speech to the microphone for use in other apps
              </Text>
            </View>
            <Switch
              value={isAudioRoutingEnabled}
              onValueChange={handleToggleAudioRouting}
              disabled={isLoading}
              trackColor={{ false: '#767577', true: theme.primary + '50' }}
              thumbColor={isAudioRoutingEnabled ? theme.primary : '#f4f3f4'}
            />
          </View>
          
          {isAudioRoutingEnabled && (
            <View style={styles.warningContainer}>
              <Text style={[styles.warningText, { color: '#FF9500' }]}>
                This feature routes audio to your microphone, allowing other apps to receive your synthesized voice.
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Voices</Text>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Ionicons 
                name={showFavoritesOnly ? "heart" : "heart-outline"} 
                size={20} 
                color={showFavoritesOnly ? "#FF3B30" : theme.text + '80'} 
              />
              <Text style={[styles.filterButtonText, { color: theme.text }]}>
                {showFavoritesOnly ? 'All Voices' : 'Favorites Only'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {loadingVoices ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.text + '80' }]}>
                Loading voices...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredVoices}
              renderItem={renderVoiceItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.voiceList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: theme.text + '80' }]}>
                  {showFavoritesOnly 
                    ? 'No favorite voices yet. Add some by tapping the heart icon.' 
                    : 'No voices available. Pull down to refresh.'}
                </Text>
              }
              refreshing={isLoading}
              onRefresh={refreshSettings}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingLabelContainer: {
    flex: 1,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  warningContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  filterButtonText: {
    marginLeft: 4,
    fontSize: 14,
  },
  voiceList: {
    paddingHorizontal: 16,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  voiceDetails: {
    fontSize: 14,
  },
  voiceActions: {
    flexDirection: 'row',
  },
  favoriteButton: {
    padding: 8,
    marginLeft: 4,
  },
  playButton: {
    padding: 8,
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default VoiceSettingsScreen; 