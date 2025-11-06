/**
 * EmotionalTagSelector Component (React Native)
 * 
 * Displays emotional tags organized by category
 * Users can tap tags to insert them into text
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EmotionalTag, EMOTIONAL_TAGS, getTagsByCategory } from '../utils/emotionalTags';
import { useFeatureGate } from '../contexts/FeatureGateContext';

interface EmotionalTagSelectorProps {
  onTagSelect: (tag: EmotionalTag) => void;
  theme: any;
  maxHeight?: number;
  onLearnMore?: () => void;
}

const CATEGORIES = [
  { id: 'emotion', icon: '😊' },
  { id: 'expression', icon: '🎭' },
  { id: 'style', icon: '🎨' },
  { id: 'pattern', icon: '🎵' }
];

export const EmotionalTagSelector: React.FC<EmotionalTagSelectorProps> = ({
  onTagSelect,
  theme,
  maxHeight = 300,
  onLearnMore
}) => {
  const { t } = useTranslation();
  const { isV3AlphaModel, isPremiumUser } = useFeatureGate();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['emotion']) // Expand emotions by default
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleTagPress = (tag: EmotionalTag) => {
    // Only lock for non-premium users
    if (!isPremiumUser && tag.requiresPremium) {
      // Tag locked - don't allow
      return;
    }
    // Premium users can always click (auto-switch happens in parent component)
    onTagSelect(tag);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('emotionalTags.title')}</Text>
      
      {/* Info/Warning Banner */}
      {!isPremiumUser ? (
        // Non-premium user: Show upgrade message
        <View style={[styles.premiumWarning, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
          <Text style={[styles.premiumWarningText, { color: theme.primary }]}>
            🔒 {t('emotionalTags.premiumRequired')}
          </Text>
          {onLearnMore && (
            <TouchableOpacity onPress={onLearnMore} style={styles.learnMoreButton}>
              <Text style={[styles.learnMoreText, { color: theme.primary }]}>
                {t('emotionalTags.learnMore')} →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : !isV3AlphaModel ? (
        // Premium user on Standard model: Show auto-switch info
        <View style={[styles.premiumWarning, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}>
          <Text style={[styles.premiumWarningText, { color: theme.warning }]}>
            ⚠️ {t('emotionalTags.autoSwitchInfo')}
          </Text>
          {onLearnMore && (
            <TouchableOpacity onPress={onLearnMore} style={styles.learnMoreButton}>
              <Text style={[styles.learnMoreText, { color: theme.warning }]}>
                {t('emotionalTags.learnMore')} →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* Scrollable Tag Categories */}
      <ScrollView
        style={[styles.scrollView, { maxHeight }]}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        {CATEGORIES.map(category => {
          const tags = getTagsByCategory(category.id);
          const isExpanded = expandedCategories.has(category.id);

          return (
            <View key={category.id} style={[styles.category, { borderColor: theme.border }]}>
              {/* Category Header */}
              <TouchableOpacity
                style={[styles.categoryHeader, { backgroundColor: theme.card }]}
                onPress={() => toggleCategory(category.id)}
              >
                <View style={styles.categoryHeaderContent}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[styles.categoryName, { color: theme.text }]}>
                    {t(`emotionalTags.categories.${category.id}`)}
                  </Text>
                  <Text style={[styles.categoryCount, { color: theme.text + '99' }]}>
                    ({tags.length})
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: theme.text + '99' }]}>
                  {isExpanded ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {/* Category Tags */}
              {isExpanded && (
                <View style={[styles.tagsContainer, { backgroundColor: theme.background }]}>
                  {tags.map(tag => {
                    // Only lock for non-premium users
                    const isLocked = !isPremiumUser && tag.requiresPremium;
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        style={[
                          styles.tag,
                          {
                            backgroundColor: isLocked ? theme.border : theme.primary + '20',
                            borderColor: isLocked ? theme.border : theme.primary
                          }
                        ]}
                        onPress={() => handleTagPress(tag)}
                        disabled={isLocked}
                      >
                        {tag.icon && <Text style={styles.tagIcon}>{tag.icon}</Text>}
                        <Text style={[styles.tagLabel, { color: isLocked ? theme.text + '66' : theme.primary }]}>
                          {t(`emotionalTags.tags.${tag.id}`)}
                        </Text>
                        {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Footer Help */}
      <Text style={[styles.helpText, { color: theme.text + '99' }]}>
        {t('emotionalTags.instruction')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  premiumWarning: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12
  },
  premiumWarningText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8
  },
  learnMoreButton: {
    marginTop: 4
  },
  learnMoreText: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline'
  },
  scrollView: {
    marginBottom: 8
  },
  category: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden'
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12
  },
  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  categoryIcon: {
    fontSize: 18
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600'
  },
  categoryCount: {
    fontSize: 12
  },
  chevron: {
    fontSize: 12
  },
  tagsContainer: {
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4
  },
  tagIcon: {
    fontSize: 14
  },
  tagLabel: {
    fontSize: 13,
    fontWeight: '500'
  },
  lockIcon: {
    fontSize: 10
  },
  helpText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8
  }
});


