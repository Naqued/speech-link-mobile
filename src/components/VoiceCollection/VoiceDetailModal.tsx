import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Voice } from '../../services/ttsService';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useTranslation } from 'react-i18next';

interface VoiceDetailModalProps {
  visible: boolean;
  onClose: () => void;
  voice: Voice | null;
  onToggleFavorite: (voice: Voice) => Promise<void>;
  onSelectVoice: (voice: Voice) => Promise<void>;
  isFavorite: boolean;
  isSelected: boolean;
  theme: any;
}

const VoiceDetailModal: React.FC<VoiceDetailModalProps> = ({
  visible,
  onClose,
  voice,
  onToggleFavorite,
  onSelectVoice,
  isFavorite,
  isSelected,
  theme
}) => {
  const { t } = useTranslation();
  const { speak, isLoading: isSpeaking, stopSpeaking, previewVoice } = useTextToSpeech();
  const [isPlaying, setIsPlaying] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [selectLoading, setSelectLoading] = useState(false);

  if (!voice) return null;

  const playVoiceSample = async () => {
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

  const handleToggleFavorite = async () => {
    if (!voice) return;
    setFavoriteLoading(true);
    try {
      await onToggleFavorite(voice);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleSelectVoice = async () => {
    if (!voice) return;
    setSelectLoading(true);
    try {
      await onSelectVoice(voice);
    } finally {
      setSelectLoading(false);
    }
  };

  // Generate avatar URL with proper colors
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(voice.name)}&background=4A6FEA&color=fff`;

  // Translate metadata fields
  const getTranslatedGender = (gender?: string) => {
    if (!gender) return t('general.notSpecified');
    return t(`voice.metadata.gender.${gender}`, gender.charAt(0).toUpperCase() + gender.slice(1));
  };

  const getTranslatedAge = (age?: string) => {
    if (!age) return t('general.notSpecified');
    return t(`voice.metadata.age.${age}`, age.charAt(0).toUpperCase() + age.slice(1));
  };

  const getTranslatedAccent = (accent?: string) => {
    if (!accent) return t('general.notSpecified');
    return t(`voice.metadata.accent.${accent}`, accent.charAt(0).toUpperCase() + accent.slice(1));
  };

  const getTranslatedUseCase = (useCase?: string) => {
    if (!useCase) return t('general.general');
    return t(`voice.metadata.useCase.${useCase}`, useCase.charAt(0).toUpperCase() + useCase.slice(1));
  };

  // Get label/value pairs for all voice attributes we want to display
  const detailsItems = [
    { label: t('voice.labels.name'), value: voice.name },
    { label: t('voice.labels.language'), value: voice.language || 'English' },
    { label: t('voice.labels.gender'), value: getTranslatedGender(voice.gender) },
    { label: t('voice.labels.accent'), value: getTranslatedAccent(voice.accent) },
    { label: t('voice.labels.age'), value: getTranslatedAge(voice.age) },
    { label: t('voice.labels.useCase'), value: getTranslatedUseCase(voice.use_case) },
  ];

  // Add description only if it exists
  if (voice.description) {
    detailsItems.push({ 
      label: t('voice.labels.description'), 
      value: voice.description 
    });
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          {/* Header with close button */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('voice.details.title')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {/* Voice avatar and name section */}
            <View style={styles.voiceProfileSection}>
              <Image source={{ uri: avatarUrl }} style={styles.voiceAvatar} />
              <View style={styles.nameContainer}>
                <Text style={[styles.voiceName, { color: theme.text }]}>{voice.name}</Text>
                <View style={styles.badgeContainer}>
                  <View style={[styles.providerBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.providerText}>ElevenLabs</Text>
                  </View>
                  {voice.gender && (
                    <View style={styles.genderBadge}>
                      <Ionicons
                        name={voice.gender === 'male' ? 'male' : voice.gender === 'female' ? 'female' : 'person'}
                        size={14}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Voice details section */}
            <View style={styles.detailsSection}>
              {detailsItems.map((item, index) => (
                <View key={index} style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: theme.text + '80' }]}>{item.label}</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Footer with action buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: theme.primary }]}
              onPress={playVoiceSample}
              disabled={isSpeaking && !isPlaying}
            >
              {isPlaying ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.buttonText}>{t('voice.actions.processing')}</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="play" size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>{t('voice.actions.preview')}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.secondaryActionsContainer}>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleToggleFavorite}
                disabled={favoriteLoading}
              >
                {favoriteLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={24}
                    color={isFavorite ? theme.error : theme.text}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.selectButton, isSelected && styles.selectButtonSelected, { borderColor: theme.primary }]}
                onPress={handleSelectVoice}
                disabled={selectLoading}
              >
                {selectLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Text
                    style={[
                      styles.selectButtonText,
                      { color: theme.primary },
                      isSelected && styles.selectButtonTextSelected
                    ]}
                  >
                    {isSelected ? t('voice.actions.selected') : t('voice.actions.select')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: '70%',
  },
  voiceProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  voiceAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  nameContainer: {
    marginLeft: 16,
    flex: 1,
  },
  voiceName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  providerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  genderBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsSection: {
    marginTop: 16,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  playButton: {
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  selectButton: {
    flex: 1,
    marginLeft: 12,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  selectButtonText: {
    fontWeight: 'bold',
  },
  selectButtonTextSelected: {
    fontWeight: 'bold',
  },
});

export default VoiceDetailModal; 