/**
 * Quick Correction Chip (Atom)
 * 
 * Small, tappable chip displaying a low-confidence word that needs correction.
 * Follows atomic design principles - minimal, reusable component.
 * 
 * @module components/atoms/QuickCorrectionChip
 */

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

export interface QuickCorrectionChipProps {
  /** The word that needs correction */
  word: string;
  /** Confidence score (0.0-1.0) */
  confidence: number;
  /** Callback when user taps to correct */
  onPress: () => void;
  /** Optional custom styling */
  style?: any;
}

/**
 * QuickCorrectionChip Component
 * 
 * Displays a low-confidence word as a tappable chip.
 * Color-coded by confidence level.
 */
export const QuickCorrectionChip: React.FC<QuickCorrectionChipProps> = ({
  word,
  confidence,
  onPress,
  style
}) => {
  // Determine color based on confidence
  const getConfidenceColor = (): string => {
    if (confidence < 0.3) return '#F44336'; // Red - very low confidence
    if (confidence < 0.5) return '#FF9800'; // Orange - low confidence
    return '#FFC107'; // Amber - medium-low confidence
  };

  const backgroundColor = getConfidenceColor();
  const confidencePercent = Math.round(confidence * 100);

  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.word} numberOfLines={1}>
          "{word}"
        </Text>
        <Text style={styles.confidence}>
          {confidencePercent}%
        </Text>
      </View>
      <Text style={styles.icon}>✏️</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  content: {
    flex: 1,
    marginRight: 4,
  },
  word: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  confidence: {
    color: '#FFFFFF',
    fontSize: 11,
    opacity: 0.9,
  },
  icon: {
    fontSize: 16,
  },
});

