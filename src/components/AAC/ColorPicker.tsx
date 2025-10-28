import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Color options (reusing from CategoryFormModal)
const COLOR_OPTIONS = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6B7280', // Gray
];

interface ColorPickerProps {
  value?: string | null;
  onSelect: (color: string | null) => void;  // null = use category default
  categoryColor: string;
  theme: any;
  showCategoryDefault?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onSelect,
  categoryColor,
  theme,
  showCategoryDefault = true,
}) => {
  const styles = makeStyles(theme);

  const handleColorSelect = (color: string | null) => {
    onSelect(color);
  };

  const isSelected = (color: string | null) => {
    // If value is null/undefined and color is null, it's selected (category default)
    if (value === null || value === undefined) {
      return color === null;
    }
    return value === color;
  };

  return (
    <View style={styles.container}>
      {/* Show category default option */}
      {showCategoryDefault && (
        <TouchableOpacity
          style={[
            styles.categoryDefaultButton,
            isSelected(null) && styles.categoryDefaultButtonSelected,
          ]}
          onPress={() => handleColorSelect(null)}
        >
          <View
            style={[
              styles.categoryColorPreview,
              { backgroundColor: categoryColor },
            ]}
          />
          <Text style={styles.categoryDefaultText}>Use Category Color</Text>
          {isSelected(null) && (
            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
          )}
        </TouchableOpacity>
      )}

      {/* Color grid */}
      <View style={styles.colorGrid}>
        {COLOR_OPTIONS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorItem,
              { backgroundColor: color },
              isSelected(color) && styles.selectedColorItem,
            ]}
            onPress={() => handleColorSelect(color)}
          >
            {isSelected(color) && (
              <Ionicons name="checkmark" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    categoryDefaultButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
    },
    categoryDefaultButtonSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '20',
    },
    categoryColorPreview: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    categoryDefaultText: {
      marginLeft: 12,
      flex: 1,
      fontSize: 16,
      color: theme.text,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 20,
    },
    colorItem: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    selectedColorItem: {
      borderColor: '#FFFFFF',
      shadowOpacity: 0.4,
      elevation: 6,
    },
  });

