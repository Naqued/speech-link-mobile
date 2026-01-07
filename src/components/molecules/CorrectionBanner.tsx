/**
 * Correction Banner (Molecule)
 * 
 * Banner displaying multiple low-confidence words with correction options.
 * Composed of multiple QuickCorrectionChip atoms.
 * 
 * @module components/molecules/CorrectionBanner
 */

import React, { useState } from 'react';
import { View, Text, Modal, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { QuickCorrectionChip } from '../atoms/QuickCorrectionChip';

export interface LowConfidenceWord {
  word: string;
  confidence: number;
  start?: number;
  end?: number;
}

export interface CorrectionBannerProps {
  /** Array of low-confidence words */
  words: LowConfidenceWord[];
  /** The full sentence for context */
  sentence: string;
  /** Callback when user corrects a word */
  onCorrect: (word: string, correction: string) => void;
  /** Callback when user dismisses banner */
  onDismiss: () => void;
  /** Optional: Show in compact mode */
  compact?: boolean;
}

/**
 * CorrectionBanner Component
 * 
 * Displays low-confidence words and allows user to correct them.
 * Shows a modal for entering corrections.
 */
export const CorrectionBanner: React.FC<CorrectionBannerProps> = ({
  words,
  sentence,
  onCorrect,
  onDismiss,
  compact = false
}) => {
  const { t } = useTranslation();
  const [selectedWord, setSelectedWord] = useState<LowConfidenceWord | null>(null);
  const [correctionText, setCorrectionText] = useState('');

  // Show banner if there's a sentence, even if no low-confidence words
  if (!sentence || sentence.trim().length === 0) return null;

  /**
   * Render the sentence with all words clickable (low-confidence words highlighted)
   */
  const renderSentenceWithHighlights = () => {
    if (!sentence || sentence.trim().length === 0) {
      // Fallback to word chips if no sentence
      return null;
    }

    // Create a map of words to highlight (lowercase for case-insensitive matching)
    const wordsToHighlight = new Map<string, LowConfidenceWord>();
    words.forEach(w => {
      wordsToHighlight.set(w.word.toLowerCase(), w);
    });

    // Split sentence into words while preserving punctuation
    const sentenceWords = sentence.split(/(\s+)/);
    
    return (
      <View style={styles.sentenceContainer}>
        <Text style={styles.sentenceLabel}>{t('speechEnhancer.sentenceHeard', 'Sentence heard:')}</Text>
        <View style={styles.sentenceWords}>
          {sentenceWords.map((token, index) => {
            // Skip whitespace tokens but preserve them
            if (/^\s+$/.test(token)) {
              return <Text key={`space-${index}`} style={styles.normalWord}>{token}</Text>;
            }

            // Clean the token for comparison (remove punctuation)
            const cleanToken = token.replace(/[.,!?;:"']/g, '').toLowerCase();
            const wordInfo = wordsToHighlight.get(cleanToken);

            if (wordInfo) {
              // This is a low-confidence word - highlight it with color
              return (
                <TouchableOpacity
                  key={`word-${index}`}
                  onPress={() => handleChipPress(wordInfo)}
                  style={styles.highlightedWordContainer}
                >
                  <Text style={[styles.highlightedWord, { color: getConfidenceColor(wordInfo.confidence) }]}>
                    {token}
                  </Text>
                  <View style={[styles.highlightUnderline, { backgroundColor: getConfidenceColor(wordInfo.confidence) }]} />
                </TouchableOpacity>
              );
            }

            // Normal word - make it clickable too for adding to dictionary
            return (
              <TouchableOpacity
                key={`word-${index}`}
                onPress={() => handleChipPress({
                  word: cleanToken,
                  confidence: 1.0,
                })}
                style={styles.normalWordContainer}
              >
                <Text style={styles.normalWord}>
                  {token}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.tapHint}>{t('speechEnhancer.tapWordToAdd', 'Tap on any word to add it to your dictionary')}</Text>
      </View>
    );
  };

  /**
   * Get color based on confidence level
   */
  const getConfidenceColor = (confidence: number): string => {
    if (confidence < 0.3) return '#F44336'; // Red - very low confidence
    if (confidence < 0.5) return '#FF9800'; // Orange - low confidence
    return '#FFC107'; // Amber - medium-low confidence
  };

  const handleChipPress = (word: LowConfidenceWord) => {
    setSelectedWord(word);
    setCorrectionText('');
  };

  const handleSubmitCorrection = () => {
    if (!selectedWord || !correctionText.trim()) {
      Alert.alert(
        t('general.error.title', 'Error'),
        t('speechEnhancer.pleaseEnterCorrection', 'Please enter a correction')
      );
      return;
    }

    onCorrect(selectedWord.word, correctionText.trim());
    setSelectedWord(null);
    setCorrectionText('');
  };

  const handleDismissModal = () => {
    setSelectedWord(null);
    setCorrectionText('');
  };

  return (
    <>
      <View style={[styles.banner, compact && styles.bannerCompact]}>
        {!compact && (
          <View style={styles.header}>
            <Text style={styles.title}>
              {words.length > 0 
                ? t('speechEnhancer.reviewUnclearWords', '⚠️ Review unclear words')
                : t('speechEnhancer.addWordsToDictionary', '💬 Add words to dictionary')}
            </Text>
            <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
              <Text style={styles.dismissText}>{t('speechEnhancer.skip', 'Skip')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Display full sentence with highlighted low-confidence words */}
        {renderSentenceWithHighlights()}

        {/* Fallback to word chips if no sentence available */}
        {(!sentence || sentence.trim().length === 0) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {words.map((word, index) => (
              <QuickCorrectionChip
                key={`${word.word}-${index}`}
                word={word.word}
                confidence={word.confidence}
                onPress={() => handleChipPress(word)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Correction Modal */}
      <Modal
        visible={selectedWord !== null}
        transparent
        animationType="slide"
        onRequestClose={handleDismissModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedWord && selectedWord.confidence < 1.0 
                ? t('speechEnhancer.correctThisWord', 'Correct this word')
                : t('speechEnhancer.addWordToDictionary', 'Add word to dictionary')}
            </Text>
            
            <View style={styles.wordInfo}>
              <Text style={styles.wordLabel}>{t('speechEnhancer.heardAs', 'Heard as:')}</Text>
              <Text style={styles.wordValue}>"{selectedWord?.word}"</Text>
              {selectedWord && selectedWord.confidence < 1.0 && (
                <Text style={styles.confidenceLabel}>
                  {t('speechEnhancer.confidence', 'Confidence: {{percent}}%', { 
                    percent: Math.round((selectedWord?.confidence || 0) * 100) 
                  })}
                </Text>
              )}
            </View>

            <TextInput
              style={styles.input}
              placeholder={selectedWord && selectedWord.confidence < 1.0 
                ? t('speechEnhancer.enterCorrectWord', 'Enter the correct word')
                : t('speechEnhancer.whatDidYouSay', 'What did you actually say?')}
              value={correctionText}
              onChangeText={setCorrectionText}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleDismissModal}
              >
                <Text style={styles.buttonTextSecondary}>{t('general.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleSubmitCorrection}
              >
                <Text style={styles.buttonTextPrimary}>{t('speechEnhancer.saveAndLearn', 'Save & Learn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  bannerCompact: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
  },
  dismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dismissText: {
    color: '#F57C00',
    fontSize: 14,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  sentenceContainer: {
    marginTop: 4,
  },
  sentenceLabel: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
    marginBottom: 8,
  },
  sentenceWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  normalWord: {
    fontSize: 16,
    color: '#212121',
    lineHeight: 24,
  },
  normalWordContainer: {
    position: 'relative',
  },
  highlightedWordContainer: {
    position: 'relative',
  },
  highlightedWord: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  highlightUnderline: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  tapHint: {
    fontSize: 11,
    color: '#757575',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
    textAlign: 'center',
  },
  wordInfo: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  wordLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  wordValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#F57C00',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  buttonTextSecondary: {
    color: '#424242',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

