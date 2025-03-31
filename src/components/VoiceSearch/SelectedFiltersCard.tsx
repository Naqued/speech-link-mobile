import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterParams } from './AdvancedFilterModal';
import { useTranslation } from 'react-i18next';

interface SelectedFiltersCardProps {
  filters: FilterParams;
  onClearFilter: (key: keyof FilterParams) => void;
  onClearAll: () => void;
  theme: any;
}

// Helper function to get friendly filter names
const getFilterName = (key: string, value: string, t: any): string => {
  switch (key) {
    case 'gender':
      return value === 'male' ? t('voice.filters.male', 'Male') : 
             value === 'female' ? t('voice.filters.female', 'Female') : 
             t('voice.filters.neutral', 'Neutral');
    case 'language':
      const languageMap: Record<string, string> = {
        'en': t('voice.filters.english', 'English'),
        'fr': t('voice.filters.french', 'French'),
        'es': t('voice.filters.spanish', 'Spanish'),
        'de': t('voice.filters.german', 'German'),
        'it': t('voice.filters.italian', 'Italian'),
        'ja': t('voice.filters.japanese', 'Japanese'),
        'pt': t('voice.filters.portuguese', 'Portuguese'),
        'nl': t('voice.filters.dutch', 'Dutch'),
        'zh': t('voice.filters.chinese', 'Chinese'),
        'ru': t('voice.filters.russian', 'Russian'),
        'ko': t('voice.filters.korean', 'Korean'),
        'pl': t('voice.filters.polish', 'Polish'),
        'hi': t('voice.filters.hindi', 'Hindi'),
        'ar': t('voice.filters.arabic', 'Arabic'),
        'id': t('voice.filters.indonesian', 'Indonesian'),
        'tr': t('voice.filters.turkish', 'Turkish'),
        'cs': t('voice.filters.czech', 'Czech'),
        'da': t('voice.filters.danish', 'Danish'),
        'fi': t('voice.filters.finnish', 'Finnish'),
        'el': t('voice.filters.greek', 'Greek'),
        'hu': t('voice.filters.hungarian', 'Hungarian'),
        'ro': t('voice.filters.romanian', 'Romanian'),
        'sv': t('voice.filters.swedish', 'Swedish'),
        'uk': t('voice.filters.ukrainian', 'Ukrainian'),
        'vi': t('voice.filters.vietnamese', 'Vietnamese')
      };
      return languageMap[value] || value;
    case 'provider':
      return value === 'ELEVENLABS' ? t('voice.filters.elevenlabs', 'ElevenLabs') : 
             value === 'OPENAI' ? t('voice.filters.openai', 'OpenAI') : value;
    case 'accent':
      return value.charAt(0).toUpperCase() + value.slice(1);
    case 'age':
      return value.charAt(0).toUpperCase() + value.slice(1);
    case 'featured':
      return t('voice.filters.featured', 'Featured');
    case 'descriptives':
      return t(`voice.filters.descriptives.${value}`, value.charAt(0).toUpperCase() + value.slice(1));
    case 'use_cases':
      return t(`voice.filters.useCases.${value}`, value.charAt(0).toUpperCase() + value.slice(1));
    case 'category':
      return t(`voice.filters.categories.${value}`, value.charAt(0).toUpperCase() + value.slice(1));
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
};

const SelectedFiltersCard: React.FC<SelectedFiltersCardProps> = ({ 
  filters, 
  onClearFilter, 
  onClearAll,
  theme
}) => {
  const { t } = useTranslation();
  
  // Get all active filters except search
  const activeFilters = Object.entries(filters).filter(
    ([key, value]) => key !== 'search' && value !== undefined && value !== 'all'
  );
  
  if (activeFilters.length === 0) {
    return null; // Don't show anything if no active filters
  }
  
  const styles = makeStyles(theme);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('voice.filters.activeFilters', 'Active Filters')}</Text>
        <TouchableOpacity onPress={onClearAll} style={styles.clearAllButton}>
          <Text style={styles.clearAllText}>{t('voice.filters.clearAll', 'Clear All')}</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.scrollView}
        contentContainerStyle={styles.filtersContainer}
      >
        {activeFilters.map(([key, value]) => (
          <TouchableOpacity 
            key={key} 
            style={styles.filterChip}
            onPress={() => onClearFilter(key as keyof FilterParams)}
          >
            <Text style={styles.filterText}>
              {getFilterName(key, value as string, t)}
            </Text>
            <Ionicons name="close-circle" size={16} color={theme.primary} style={styles.closeIcon} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    color: theme.text,
  },
  clearAllButton: {
    padding: 4,
  },
  clearAllText: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
  },
  scrollView: {
    flexDirection: 'row',
  },
  filtersContainer: {
    paddingRight: 16,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary + '15',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.primary + '30',
  },
  filterText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  closeIcon: {
    marginLeft: 2,
  },
});

export default SelectedFiltersCard; 