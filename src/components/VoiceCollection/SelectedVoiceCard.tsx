import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Voice } from '../../services/ttsService';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useVoiceSettings } from '../../hooks/useVoiceSettings';
import { useTranslation } from 'react-i18next';
import { PremiumBadge, UpgradePrompt } from '../UI';

interface SelectedVoiceCardProps {
  voice: Voice | null;
  onChangeVoice?: () => void;
  theme: any;
}

const SelectedVoiceCard: React.FC<SelectedVoiceCardProps> = ({
  voice,
  onChangeVoice,
  theme
}) => {
  const { t } = useTranslation();
  const { previewVoice, stopSpeaking } = useTextToSpeech();
  const { canPreviewVoice, getVoiceAccess } = useVoiceSettings();
  const [isPlaying, setIsPlaying] = useState(false);

  if (!voice) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <Text style={[styles.noVoiceText, { color: theme.text }]}>
          {t('voice.settings.noVoiceSelected', 'No voice selected')}
        </Text>
        <TouchableOpacity
          style={[styles.changeButton, { backgroundColor: theme.primary }]}
          onPress={onChangeVoice}
        >
          <Text style={styles.changeButtonText}>
            {t('voice.settings.selectVoice', 'Select Voice')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(voice.name)}&background=4A6FEA&color=fff`;
  
  // Get voice access information
  const voiceAccess = getVoiceAccess(voice.id);
  const canPreview = canPreviewVoice(voice.id);
  const isPremiumVoice = voice.isPremium || voice.accessLevel === 'premium';

  const handlePlayPreview = async () => {
    try {
      if (isPlaying) {
        stopSpeaking();
        setIsPlaying(false);
        return;
      }

      if (!canPreview) {
        // Don't attempt to preview if user doesn't have access
        return;
      }

      setIsPlaying(true);
      await previewVoice(
        voice.id,
        voice.provider,
        voice.public_owner_id || voice.publicOwnerId,
        voice.name,
        voice.language || voice.languageCode
      );
    } catch (error) {
      console.error('Failed to play voice sample', error);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t('voice.settings.currentVoice', 'Current Voice')}
          </Text>
          {isPremiumVoice && (
            <PremiumBadge size="small" style={styles.premiumBadge} />
          )}
        </View>
      </View>
      <View style={styles.content}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.voiceInfo}>
          <View style={styles.voiceNameContainer}>
            <Text style={[styles.voiceName, { color: theme.text }]}>{voice.name}</Text>
          </View>
          <View style={styles.voiceDetails}>
            <View style={[styles.providerBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.providerText}>{voice.provider}</Text>
            </View>
            <Text style={[styles.voiceLanguage, { color: theme.text + '80' }]}>
              {voice.language || 'English'}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Show upgrade prompt if voice requires premium but user doesn't have access */}
      {voiceAccess?.requiresUpgrade && (
        <UpgradePrompt
          variant="inline"
          size="small"
          title={t('upgrade.premiumVoiceTitle', 'Premium Voice')}
          message={t('upgrade.premiumVoiceMessage', 'This voice requires a premium plan for full access.')}
          style={styles.upgradePrompt}
        />
      )}
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.playButton, 
            { backgroundColor: canPreview ? theme.primary : theme.text + '40' },
            (isPlaying || !canPreview) && { opacity: 0.7 }
          ]}
          onPress={handlePlayPreview}
          disabled={isPlaying || !canPreview}
        >
          <Ionicons
            name={isPlaying ? "stop" : "play"}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.buttonText}>
            {isPlaying 
              ? t('voice.actions.stopping', 'Stopping...')
              : canPreview 
                ? t('voice.actions.preview', 'Preview')
                : t('voice.actions.previewLocked', 'Preview Locked')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.changeButton, { borderColor: theme.primary }]}
          onPress={onChangeVoice}
        >
          <Text style={[styles.changeButtonText, { color: theme.primary }]}>
            {t('voice.settings.change', 'Change')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  premiumBadge: {
    marginLeft: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  voiceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  voiceNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  voiceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  providerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  voiceLanguage: {
    fontSize: 14,
  },
  upgradePrompt: {
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noVoiceText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default SelectedVoiceCard; 