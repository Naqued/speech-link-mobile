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
  onCorrect,
  onDismiss,
  compact = false
}) => {
  const [selectedWord, setSelectedWord] = useState<LowConfidenceWord | null>(null);
  const [correctionText, setCorrectionText] = useState('');

  if (words.length === 0) return null;

  const handleChipPress = (word: LowConfidenceWord) => {
    setSelectedWord(word);
    setCorrectionText('');
  };

  const handleSubmitCorrection = () => {
    if (!selectedWord || !correctionText.trim()) {
      Alert.alert('Error', 'Please enter a correction');
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
            <Text style={styles.title}>⚠️ Review unclear words</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
              <Text style={styles.dismissText}>Skip</Text>
            </TouchableOpacity>
          </View>
        )}

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
            <Text style={styles.modalTitle}>Correct this word</Text>
            
            <View style={styles.wordInfo}>
              <Text style={styles.wordLabel}>Heard as:</Text>
              <Text style={styles.wordValue}>"{selectedWord?.word}"</Text>
              <Text style={styles.confidenceLabel}>
                Confidence: {Math.round((selectedWord?.confidence || 0) * 100)}%
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Enter the correct word"
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
                <Text style={styles.buttonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleSubmitCorrection}
              >
                <Text style={styles.buttonTextPrimary}>Save & Learn</Text>
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

