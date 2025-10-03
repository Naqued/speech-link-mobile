import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';

// API
import * as dictionaryAPI from '../../api/dictionary';

// Types
type DictionaryEntry = dictionaryAPI.DictionaryEntry;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: Omit<DictionaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  entry?: DictionaryEntry;
  language: string;
}

const AddEditEntryModal: React.FC<Props> = ({
  visible,
  onClose,
  onSave,
  entry,
  language
}) => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  
  // State
  const [word, setWord] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const styles = makeStyles(theme);
  const isEditing = !!entry;

  // Initialize form when modal opens or entry changes
  useEffect(() => {
    if (visible) {
      if (entry) {
        setWord(entry.word);
        setPronunciation(entry.pronunciation);
      } else {
        setWord('');
        setPronunciation('');
      }
    }
  }, [visible, entry]);

  // Validation
  const validateForm = () => {
    const errors: string[] = [];

    if (!word.trim()) {
      errors.push(t('dictionary.wordRequired') || 'Word is required');
    } else if (word.trim().length > 50) {
      errors.push(t('dictionary.wordTooLong') || 'Word must be 50 characters or less');
    } else if (!/^[a-zA-Z0-9\s'\-]+$/.test(word.trim())) {
      errors.push(t('dictionary.invalidCharacters') || 'Word contains invalid characters');
    }

    if (!pronunciation.trim()) {
      errors.push(t('dictionary.pronunciationRequired') || 'Pronunciation is required');
    } else if (pronunciation.trim().length > 100) {
      errors.push(t('dictionary.pronunciationTooLong') || 'Pronunciation must be 100 characters or less');
    }

    return errors;
  };

  // Handle save
  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      Alert.alert(
        t('general.error') || 'Error',
        errors.join('\n')
      );
      return;
    }

    try {
      setLoading(true);
      await onSave({
        word: word.trim().toLowerCase(),
        pronunciation: pronunciation.trim(),
        language
      });
      onClose();
    } catch (error) {
      Alert.alert(
        t('general.error') || 'Error',
        t('dictionary.saveFailed') || 'Failed to save dictionary entry'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle preview
  const handlePreview = async () => {
    if (!pronunciation.trim()) {
      Alert.alert(
        t('general.error') || 'Error',
        t('dictionary.pronunciationRequired') || 'Pronunciation is required'
      );
      return;
    }

    try {
      setPreviewLoading(true);
      await dictionaryAPI.previewPronunciation(pronunciation.trim(), language);
    } catch (error) {
      console.error('Failed to preview pronunciation:', error);
      Alert.alert(
        t('general.error') || 'Error',
        error instanceof Error ? error.message : (t('dictionary.previewFailed') || 'Failed to preview pronunciation')
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
          >
            <Text style={styles.headerButtonText}>
              {t('general.cancel') || 'Cancel'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {isEditing ? (t('dictionary.editEntry') || 'Edit Entry') : (t('dictionary.addEntry') || 'Add Entry')}
          </Text>
          
          <TouchableOpacity
            style={[styles.headerButton, styles.saveButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {t('dictionary.save') || 'Save'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Language Indicator */}
          <View style={styles.languageIndicator}>
            <Ionicons name="globe-outline" size={18} color={theme.primary} />
            <Text style={styles.languageText}>
              {t(`languages.${language}`) || language.toUpperCase()}
            </Text>
          </View>

          {/* Word Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              {t('dictionary.word') || 'Word'}
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={word}
                onChangeText={setWord}
                placeholder={t('dictionary.wordPlaceholder') || 'Enter word...'}
                placeholderTextColor={theme.text + '60'}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={50}
              />
            </View>
            <Text style={styles.charCount}>
              {word.length}/50
            </Text>
          </View>

          {/* Pronunciation Input */}
          <View style={styles.inputSection}>
            <View style={styles.pronunciationHeader}>
              <Text style={styles.inputLabel}>
                {t('dictionary.pronunciation') || 'Pronunciation'}
              </Text>
              <TouchableOpacity
                style={styles.previewButton}
                onPress={handlePreview}
                disabled={previewLoading || !pronunciation.trim()}
              >
                {previewLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <>
                    <Ionicons 
                      name="play-circle-outline" 
                      size={20} 
                      color={pronunciation.trim() ? theme.primary : theme.text + '40'} 
                    />
                    <Text style={[
                      styles.previewButtonText,
                      !pronunciation.trim() && { color: theme.text + '40' }
                    ]}>
                      {t('dictionary.preview') || 'Preview'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, styles.pronunciationInput]}
                value={pronunciation}
                onChangeText={setPronunciation}
                placeholder={t('dictionary.pronunciationPlaceholder') || 'Enter pronunciation...'}
                placeholderTextColor={theme.text + '60'}
                multiline
                maxLength={100}
              />
            </View>
            <Text style={styles.charCount}>
              {pronunciation.length}/100
            </Text>
          </View>

          {/* Help Text */}
          <View style={styles.helpSection}>
            <Ionicons name="information-circle-outline" size={20} color={theme.text + '60'} />
            <Text style={styles.helpText}>
              Enter how you want the word to be pronounced. For example, "OpenAI" → "Open A I"
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: 16,
    color: theme.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  languageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.primary + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.primary + '20',
  },
  languageText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  pronunciationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  previewButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.card,
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: theme.text,
    minHeight: 50,
  },
  pronunciationInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: theme.text + '60',
    textAlign: 'right',
    marginTop: 4,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 8,
  },
  helpText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: theme.text + '80',
    lineHeight: 20,
  },
});

export default AddEditEntryModal; 