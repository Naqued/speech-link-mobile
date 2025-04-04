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
          {t('voice.settings.noVoiceSelected')}
        </Text>
        <TouchableOpacity
          style={[styles.changeButton, { backgroundColor: theme.primary }]}
          onPress={onChangeVoice}
        >
          <Text style={styles.changeButtonText}>
            {t('voice.settings.selectVoice')}
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
        <Text style={[styles.title, { color: theme.text }]}>
          {t('voice.settings.currentVoice')}
        </Text>
        <TouchableOpacity
          style={[styles.changeButton, { backgroundColor: theme.primary }]}
          onPress={onChangeVoice}
        >
          <Text style={styles.changeButtonText}>
            {t('voice.settings.change')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.voiceInfo}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.details}>
          <Text style={[styles.voiceName, { color: theme.text }]}>
            {voice.name}
          </Text>
          <Text style={[styles.voiceDetails, { color: theme.text + '80' }]}>
            {voice.provider} • {voice.language || 'English'}
          </Text>
          <View style={styles.badges}>
            {voice.gender && (
              <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons
                  name={voice.gender === 'male' ? 'male' : voice.gender === 'female' ? 'female' : 'person'}
                  size={12}
                  color={theme.primary}
                />
                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  {t(`voice.metadata.gender.${voice.gender}`)}
                </Text>
              </View>
            )}
            {voice.accent && (
              <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  {t(`voice.metadata.accent.${voice.accent}`)}
                </Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: theme.primary }]}
          onPress={handlePlayPreview}
          disabled={isPlaying}
        >
          {isPlaying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="play" size={16} color="#FFFFFF" />
          )}
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  voiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  voiceDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVoiceText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
});

export default SelectedVoiceCard; 