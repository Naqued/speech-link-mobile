import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  FlatList,
  Platform,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface FilterOption {
  id: string;
  name: string;
}

export interface FilterParams {
  search?: string;
  category?: string;
  gender?: string;
  age?: string;
  accent?: string;
  language?: string;
  use_cases?: string;
  descriptives?: string;
  featured?: string;
  provider?: string;
}

interface AdvancedFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterParams) => void;
  initialFilters: FilterParams;
  theme: any;
}

// Filter options with translation keys
const CATEGORIES = (t: any) => [
  { id: 'all', name: t('voice.filters.categories.all', 'All Categories') },
  { id: 'professional', name: t('voice.filters.categories.professional', 'Professional') },
  { id: 'entertainment', name: t('voice.filters.categories.entertainment', 'Entertainment') },
  { id: 'storytelling', name: t('voice.filters.categories.storytelling', 'Storytelling') }
];

const GENDERS = (t: any) => [
  { id: 'all', name: t('voice.filters.genders.all', 'All Genders') },
  { id: 'male', name: t('voice.filters.male', 'Male') },
  { id: 'female', name: t('voice.filters.female', 'Female') },
  { id: 'neutral', name: t('voice.filters.neutral', 'Neutral') }
];

const AGES = (t: any) => [
  { id: 'all', name: t('voice.filters.ages.all', 'All Ages') },
  { id: 'young', name: t('voice.filters.ages.young', 'Young') },
  { id: 'middle-aged', name: t('voice.filters.ages.middleAged', 'Middle Aged') },
  { id: 'senior', name: t('voice.filters.ages.senior', 'Senior') }
];

const ACCENTS = (t: any) => [
  { id: 'all', name: t('voice.filters.accents.all', 'All Accents') },
  { id: 'american', name: t('voice.filters.accents.american', 'American') },
  { id: 'british', name: t('voice.filters.accents.british', 'British') },
  { id: 'australian', name: t('voice.filters.accents.australian', 'Australian') },
  { id: 'indian', name: t('voice.filters.accents.indian', 'Indian') },
  { id: 'french', name: t('voice.filters.accents.french', 'French') },
  { id: 'german', name: t('voice.filters.accents.german', 'German') },
  { id: 'spanish', name: t('voice.filters.accents.spanish', 'Spanish') },
  { id: 'italian', name: t('voice.filters.accents.italian', 'Italian') }
];

const LANGUAGES = (t: any) => [
  { id: 'all', name: t('languages.all', 'All Languages') },
  { id: 'en', name: t('voice.filters.english', 'English') },
  { id: 'fr', name: t('voice.filters.french', 'French') },
  { id: 'es', name: t('voice.filters.spanish', 'Spanish') },
  { id: 'de', name: t('voice.filters.german', 'German') },
  { id: 'it', name: t('voice.filters.italian', 'Italian') },
  { id: 'ja', name: t('voice.filters.japanese', 'Japanese') },
  { id: 'pt', name: t('voice.filters.portuguese', 'Portuguese') },
  { id: 'nl', name: t('voice.filters.dutch', 'Dutch') },
  { id: 'zh', name: t('voice.filters.chinese', 'Chinese') },
  { id: 'ru', name: t('voice.filters.russian', 'Russian') },
  { id: 'ko', name: t('voice.filters.korean', 'Korean') },
  { id: 'pl', name: t('voice.filters.polish', 'Polish') },
  { id: 'hi', name: t('voice.filters.hindi', 'Hindi') },
  { id: 'ar', name: t('voice.filters.arabic', 'Arabic') },
  { id: 'id', name: t('voice.filters.indonesian', 'Indonesian') },
  { id: 'tr', name: t('voice.filters.turkish', 'Turkish') },
  { id: 'cs', name: t('voice.filters.czech', 'Czech') },
  { id: 'da', name: t('voice.filters.danish', 'Danish') },
  { id: 'fi', name: t('voice.filters.finnish', 'Finnish') },
  { id: 'el', name: t('voice.filters.greek', 'Greek') },
  { id: 'hu', name: t('voice.filters.hungarian', 'Hungarian') },
  { id: 'ro', name: t('voice.filters.romanian', 'Romanian') },
  { id: 'sv', name: t('voice.filters.swedish', 'Swedish') },
  { id: 'uk', name: t('voice.filters.ukrainian', 'Ukrainian') },
  { id: 'vi', name: t('voice.filters.vietnamese', 'Vietnamese') }
];

const USE_CASES = (t: any) => [
  { id: 'all', name: t('voice.filters.useCases.all', 'All Use Cases') },
  { id: 'general', name: t('voice.filters.useCases.general', 'General Purpose') },
  { id: 'audiobook', name: t('voice.filters.useCases.audiobook', 'Audiobooks') },
  { id: 'assistant', name: t('voice.filters.useCases.assistant', 'Virtual Assistant') },
  { id: 'gaming', name: t('voice.filters.useCases.gaming', 'Gaming') },
  { id: 'narration', name: t('voice.filters.useCases.narration', 'Narration') },
  { id: 'advertisement', name: t('voice.filters.useCases.advertisement', 'Advertisement') }
];

const DESCRIPTIVES = (t: any) => [
  { id: 'all', name: t('voice.filters.descriptives.all', 'All Descriptives') },
  { id: 'calm', name: t('voice.filters.descriptives.calm', 'Calm') },
  { id: 'energetic', name: t('voice.filters.descriptives.energetic', 'Energetic') },
  { id: 'professional', name: t('voice.filters.descriptives.professional', 'Professional') },
  { id: 'friendly', name: t('voice.filters.descriptives.friendly', 'Friendly') },
  { id: 'authoritative', name: t('voice.filters.descriptives.authoritative', 'Authoritative') },
  { id: 'cheerful', name: t('voice.filters.descriptives.cheerful', 'Cheerful') },
  { id: 'serious', name: t('voice.filters.descriptives.serious', 'Serious') }
];

const PROVIDERS = (t: any) => [
  { id: 'all', name: t('voice.providers.all', 'All Providers') },
  { id: 'ELEVENLABS', name: t('voice.providers.elevenlabs', 'ElevenLabs') },
  { id: 'OPENAI', name: t('voice.providers.openai', 'OpenAI') }
];

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  initialFilters,
  theme
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || 'all');
  const [selectedGender, setSelectedGender] = useState(initialFilters.gender || 'all');
  const [selectedAge, setSelectedAge] = useState(initialFilters.age || 'all');
  const [selectedAccent, setSelectedAccent] = useState(initialFilters.accent || 'all');
  const [selectedLanguage, setSelectedLanguage] = useState(initialFilters.language || 'all');
  const [selectedUseCase, setSelectedUseCase] = useState(initialFilters.use_cases || 'all');
  const [selectedDescriptive, setSelectedDescriptive] = useState(initialFilters.descriptives || 'all');
  const [selectedFeatured, setSelectedFeatured] = useState(initialFilters.featured === 'true');
  const [selectedProvider, setSelectedProvider] = useState(initialFilters.provider || 'all');
  const [isLoading, setIsLoading] = useState(false);

  const styles = makeStyles(theme);

  const handleApplyFilters = () => {
    // Set loading state
    setIsLoading(true);
    
    const filters: FilterParams = {
      search: searchQuery,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      gender: selectedGender !== 'all' ? selectedGender : undefined,
      age: selectedAge !== 'all' ? selectedAge : undefined,
      accent: selectedAccent !== 'all' ? selectedAccent : undefined,
      language: selectedLanguage !== 'all' ? selectedLanguage : undefined,
      use_cases: selectedUseCase !== 'all' ? selectedUseCase : undefined,
      descriptives: selectedDescriptive !== 'all' ? selectedDescriptive : undefined,
      featured: selectedFeatured ? 'true' : undefined,
      provider: selectedProvider !== 'all' ? selectedProvider : undefined
    };

    // Clean up undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof FilterParams] === undefined) {
        delete filters[key as keyof FilterParams];
      }
    });

    // Apply filters first
    onApplyFilters(filters);
    
    // Reset loading state and close modal
    setIsLoading(false);
    onClose();
  };

  // Count active filters for the Apply button
  const getActiveFilterCount = (): number => {
    let count = 0;
    
    if (searchQuery) count++;
    if (selectedCategory !== 'all') count++;
    if (selectedGender !== 'all') count++;
    if (selectedAge !== 'all') count++;
    if (selectedAccent !== 'all') count++;
    if (selectedLanguage !== 'all') count++;
    if (selectedUseCase !== 'all') count++;
    if (selectedDescriptive !== 'all') count++;
    if (selectedFeatured) count++;
    if (selectedProvider !== 'all') count++;
    
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedGender('all');
    setSelectedAge('all');
    setSelectedAccent('all');
    setSelectedLanguage('all');
    setSelectedUseCase('all');
    setSelectedDescriptive('all');
    setSelectedFeatured(false);
    setSelectedProvider('all');
  };

  const renderFilterSection = (
    title: string,
    options: FilterOption[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={options}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedValue === item.id && styles.filterChipSelected,
            ]}
            onPress={() => onSelect(item.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedValue === item.id && styles.filterChipTextSelected,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
      />
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('voice.filters.title', 'Voice Filters')}</Text>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetFilters}>
            <Text style={styles.resetButtonText}>{t('voice.filters.reset', 'Reset')}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.text + '80'} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('voice.filters.searchPlaceholder', 'Search voices...')}
            placeholderTextColor={theme.text + '50'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoFocus={false}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={theme.text + '80'} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Featured Toggle */}
        <TouchableOpacity
          style={styles.featuredToggle}
          onPress={() => setSelectedFeatured(!selectedFeatured)}
        >
          <Ionicons
            name={selectedFeatured ? "star" : "star-outline"}
            size={24}
            color={selectedFeatured ? theme.primary : theme.text + '80'}
          />
          <Text style={[styles.featuredText, selectedFeatured && { color: theme.primary }]}>
            {t('voice.filters.featuredOnly', 'Featured voices only')}
          </Text>
        </TouchableOpacity>
        
        {/* Filter Sections */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderFilterSection(
            t('voice.filters.providers', 'Providers'),
            PROVIDERS(t),
            selectedProvider,
            setSelectedProvider
          )}
          
          {renderFilterSection(
            t('voice.filters.gender', 'Gender'),
            GENDERS(t),
            selectedGender,
            setSelectedGender
          )}
          
          {renderFilterSection(
            t('voice.filters.language', 'Language'),
            LANGUAGES(t),
            selectedLanguage,
            setSelectedLanguage
          )}
          
          {renderFilterSection(
            t('voice.filters.accent', 'Accent'),
            ACCENTS(t),
            selectedAccent,
            setSelectedAccent
          )}
          
          {renderFilterSection(
            t('voice.filters.age', 'Age'),
            AGES(t),
            selectedAge,
            setSelectedAge
          )}
          
          {renderFilterSection(
            t('voice.filters.category', 'Category'),
            CATEGORIES(t),
            selectedCategory,
            setSelectedCategory
          )}
          
          {renderFilterSection(
            t('voice.filters.useCase', 'Use Case'),
            USE_CASES(t),
            selectedUseCase,
            setSelectedUseCase
          )}
          
          {renderFilterSection(
            t('voice.filters.descriptives', 'Voice Style'),
            DESCRIPTIVES(t),
            selectedDescriptive,
            setSelectedDescriptive
          )}
        </ScrollView>
        
        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyFilters}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={styles.applyIcon} />
                <Text style={styles.applyButtonText}>
                  {activeFilterCount > 0 
                    ? t('voice.filters.applyWithCount', 'Apply {{count}} Filters', { count: activeFilterCount })
                    : t('voice.filters.apply', 'Apply Filters')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  resetButton: {
    padding: 8,
  },
  resetButtonText: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: theme.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: theme.text,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  featuredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  featuredText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.text,
  },
  scrollView: {
    flex: 1,
  },
  filterSection: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  filterList: {
    paddingBottom: 8,
  },
  filterChip: {
    backgroundColor: theme.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
    minWidth: 80,
    alignItems: 'center',
  },
  filterChipSelected: {
    backgroundColor: theme.primary + '20',
    borderColor: theme.primary,
  },
  filterChipText: {
    color: theme.text + '80',
    fontSize: 14,
  },
  filterChipTextSelected: {
    color: theme.primary,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  applyButton: {
    backgroundColor: theme.primary,
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  applyIcon: {
    marginRight: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdvancedFilterModal; 