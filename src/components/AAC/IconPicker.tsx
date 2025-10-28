import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Icon options (reusing from CategoryFormModal)
const ICON_OPTIONS = [
  'water-outline',
  'hand-left-outline',
  'happy-outline',
  'help-circle-outline',
  'medical-outline',
  'bicycle-outline',
  'basket-outline',
  'book-outline',
  'build-outline',
  'car-outline',
  'home-outline',
  'restaurant-outline',
  'people-outline',
  'person-outline',
  'school-outline',
  'time-outline',
  'earth-outline',
  'map-outline',
  'beer-outline',
  'cafe-outline',
  'cart-outline',
  'chatbubble-outline',
  'heart-outline',
  'mail-outline',
  'paw-outline',
  'phone-portrait-outline',
  'star-outline',
  'trophy-outline',
  'umbrella-outline',
  'walk-outline',
];

// Common emojis
const EMOJI_OPTIONS = [
  '😀', '😊', '🥰', '😎', '🤔', '😴', '🤒', '😭',
  '👋', '👍', '👎', '🙏', '💪', '🤝', '👏', '✌️',
  '❤️', '💯', '⭐', '✨', '🔥', '💧', '🌟', '⚡',
  '🏠', '🚗', '🚲', '✈️', '🍕', '🍔', '☕', '🍎',
  '⚽', '🎮', '🎵', '📚', '💼', '🎓', '🏥', '🛒',
  '📱', '💻', '⌚', '🔔', '💡', '🔑', '🎁', '🎂',
];

export interface IconSelection {
  icon: string;
  iconType: 'ionicon' | 'emoji';
}

interface IconPickerProps {
  value?: IconSelection | null;
  onSelect: (icon: string, iconType: 'ionicon' | 'emoji') => void;
  categoryIcon?: string;  // For "use category default" option
  theme: any;
  showCategoryDefault?: boolean;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onSelect,
  categoryIcon,
  theme,
  showCategoryDefault = true,
}) => {
  const [activeTab, setActiveTab] = useState<'ionicon' | 'emoji'>(
    value?.iconType || 'ionicon'
  );
  const [customEmoji, setCustomEmoji] = useState('');

  const styles = makeStyles(theme);

  const handleIconSelect = (icon: string, type: 'ionicon' | 'emoji') => {
    onSelect(icon, type);
  };

  const handleCategoryDefault = () => {
    if (categoryIcon) {
      onSelect(categoryIcon, 'ionicon');
    }
  };

  const handleCustomEmojiAdd = () => {
    if (customEmoji.trim()) {
      handleIconSelect(customEmoji.trim(), 'emoji');
      setCustomEmoji('');
    }
  };

  const isSelected = (icon: string, type: 'ionicon' | 'emoji') => {
    return value?.icon === icon && value?.iconType === type;
  };

  return (
    <View style={styles.container}>
      {/* Show category default option if available */}
      {showCategoryDefault && categoryIcon && (
        <TouchableOpacity
          style={[
            styles.categoryDefaultButton,
            !value && styles.categoryDefaultButtonSelected,
          ]}
          onPress={handleCategoryDefault}
        >
          <Ionicons name={categoryIcon as any} size={24} color={theme.text} />
          <Text style={styles.categoryDefaultText}>Use Category Icon</Text>
          {!value && (
            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
          )}
        </TouchableOpacity>
      )}

      {/* Tab selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'ionicon' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('ionicon')}
        >
          <Ionicons
            name="apps-outline"
            size={20}
            color={activeTab === 'ionicon' ? theme.primary : theme.text}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'ionicon' && styles.activeTabText,
            ]}
          >
            Icons
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'emoji' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('emoji')}
        >
          <Text style={styles.emojiIcon}>😊</Text>
          <Text
            style={[
              styles.tabText,
              activeTab === 'emoji' && styles.activeTabText,
            ]}
          >
            Emoji
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {activeTab === 'ionicon' ? (
          <View style={styles.iconGrid}>
            {ICON_OPTIONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconItem,
                  isSelected(icon, 'ionicon') && styles.selectedIconItem,
                ]}
                onPress={() => handleIconSelect(icon, 'ionicon')}
              >
                <Ionicons
                  name={icon as any}
                  size={28}
                  color={
                    isSelected(icon, 'ionicon') ? '#FFFFFF' : theme.text
                  }
                />
                {isSelected(icon, 'ionicon') && (
                  <View style={styles.selectedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiItem,
                    isSelected(emoji, 'emoji') && styles.selectedEmojiItem,
                  ]}
                  onPress={() => handleIconSelect(emoji, 'emoji')}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                  {isSelected(emoji, 'emoji') && (
                    <View style={styles.selectedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={theme.primary}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom emoji input */}
            <View style={styles.customEmojiContainer}>
              <Text style={styles.customEmojiLabel}>Or enter custom emoji:</Text>
              <View style={styles.customEmojiInputRow}>
                <TextInput
                  style={styles.customEmojiInput}
                  value={customEmoji}
                  onChangeText={setCustomEmoji}
                  placeholder="Paste emoji here"
                  placeholderTextColor={theme.text + '60'}
                  maxLength={2}
                />
                <TouchableOpacity
                  style={[
                    styles.addEmojiButton,
                    !customEmoji.trim() && styles.addEmojiButtonDisabled,
                  ]}
                  onPress={handleCustomEmojiAdd}
                  disabled={!customEmoji.trim()}
                >
                  <Ionicons
                    name="add"
                    size={24}
                    color={customEmoji.trim() ? '#FFFFFF' : theme.text + '60'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      width: '100%',
      height: 360,
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
    categoryDefaultText: {
      marginLeft: 12,
      flex: 1,
      fontSize: 16,
      color: theme.text,
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: 16,
      borderRadius: 8,
      backgroundColor: theme.card,
      padding: 4,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 6,
    },
    activeTab: {
      backgroundColor: theme.background,
    },
    tabText: {
      marginLeft: 6,
      fontSize: 14,
      color: theme.text,
    },
    activeTabText: {
      color: theme.primary,
      fontWeight: '600',
    },
    emojiIcon: {
      fontSize: 20,
    },
    content: {
      flex: 1,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingBottom: 16,
    },
    iconItem: {
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      position: 'relative',
    },
    selectedIconItem: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
      paddingBottom: 16,
    },
    emojiItem: {
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      position: 'relative',
    },
    selectedEmojiItem: {
      borderColor: theme.primary,
      borderWidth: 2,
      backgroundColor: theme.primary + '20',
    },
    emojiText: {
      fontSize: 32,
    },
    selectedBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
    },
    customEmojiContainer: {
      marginTop: 20,
      marginBottom: 20,
      padding: 16,
      borderRadius: 8,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    customEmojiLabel: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 8,
    },
    customEmojiInputRow: {
      flexDirection: 'row',
      gap: 8,
    },
    customEmojiInput: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      fontSize: 24,
      color: theme.text,
      textAlign: 'center',
    },
    addEmojiButton: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addEmojiButtonDisabled: {
      backgroundColor: theme.card,
    },
  });

