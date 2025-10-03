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
import { useTranslation } from 'react-i18next';

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

  const handlePlayPreview = async () => {
    try {
      if (isPlaying) {
        stopSpeaking();
        setIsPlaying(false);
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('voice.settings.currentVoice', 'Current Voice')}
        </Text>
      </View>
      <View style={styles.content}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.voiceInfo}>
          <Text style={[styles.voiceName, { color: theme.text }]}>{voice.name}</Text>
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
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: theme.primary }, isPlaying && { opacity: 0.7 }]}
          onPress={handlePlayPreview}
          disabled={isPlaying}
        >
          <Ionicons
            name={isPlaying ? "stop" : "play"}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.buttonText}>
            {isPlaying 
              ? t('voice.actions.stopping', 'Stopping...')
              : t('voice.actions.preview', 'Preview')}
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
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
    borderWidth: 2,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  noVoiceText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
});

export default SelectedVoiceCard; 