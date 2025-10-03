import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';

// Components
import AddEditEntryModal from '../../components/Dictionary/AddEditEntryModal';

// API
import * as dictionaryAPI from '../../api/dictionary';

// Types
type DictionaryEntry = dictionaryAPI.DictionaryEntry;

const DictionaryScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useContext(ThemeContext);
  
  // State
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DictionaryEntry | undefined>();

  const styles = makeStyles(theme);

  // Get current language
  const currentLanguage = i18n.language || 'en';

  // Filter entries based on search query
  const filteredEntries = entries.filter(entry =>
    entry.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.pronunciation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load dictionary entries
  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const entries = await dictionaryAPI.getDictionaryEntries(currentLanguage);
      setEntries(entries);
    } catch (error) {
      console.error('Failed to load dictionary entries:', error);
      Alert.alert(
        t('general.error') || 'Error',
        error instanceof Error ? error.message : 'Failed to load dictionary entries'
      );
    } finally {
      setLoading(false);
    }
  }, [currentLanguage, t]);

  // Refresh entries
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  }, [loadEntries]);

  // Delete entry
  const handleDeleteEntry = useCallback((entry: DictionaryEntry) => {
    Alert.alert(
      t('dictionary.deleteEntry') || 'Delete Entry',
      `Are you sure you want to delete "${entry.word}"?`,
      [
        {
          text: t('general.cancel') || 'Cancel',
          style: 'cancel'
        },
        {
          text: t('general.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dictionaryAPI.deleteDictionaryEntry(entry.id);
              setEntries(prev => prev.filter(e => e.id !== entry.id));
              Alert.alert(
                t('general.success') || 'Success',
                t('dictionary.entryDeleted') || 'Dictionary entry deleted successfully'
              );
            } catch (error) {
              Alert.alert(
                t('general.error') || 'Error',
                error instanceof Error ? error.message : 'Failed to delete entry'
              );
            }
          }
        }
      ]
    );
  }, [t]);

  // Preview pronunciation
  const handlePreview = useCallback(async (entry: DictionaryEntry) => {
    try {
      await dictionaryAPI.previewPronunciation(entry.pronunciation, entry.language);
    } catch (error) {
      console.error('Failed to preview pronunciation:', error);
      Alert.alert(
        t('general.error') || 'Error',
        error instanceof Error ? error.message : 'Failed to preview pronunciation'
      );
    }
  }, [t]);

  // Handle edit entry
  const handleEditEntry = useCallback((entry: DictionaryEntry) => {
    setEditingEntry(entry);
    setShowAddModal(true);
  }, []);

  // Handle save entry (add or edit)
  const handleSaveEntry = useCallback(async (entryData: Omit<DictionaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingEntry) {
        // Update existing entry
        const updatedEntry = await dictionaryAPI.updateDictionaryEntry(editingEntry.id, {
          word: entryData.word,
          pronunciation: entryData.pronunciation,
          language: entryData.language
        });
        setEntries(prev => prev.map(e => 
          e.id === editingEntry.id ? updatedEntry : e
        ));
        Alert.alert(
          t('general.success') || 'Success',
          t('dictionary.entryUpdated') || 'Dictionary entry updated successfully'
        );
      } else {
        // Add new entry
        const newEntry = await dictionaryAPI.createDictionaryEntry({
          word: entryData.word,
          pronunciation: entryData.pronunciation,
          language: entryData.language
        });
        setEntries(prev => [newEntry, ...prev]);
        Alert.alert(
          t('general.success') || 'Success',
          t('dictionary.entryAdded') || 'Dictionary entry added successfully'
        );
      }
    } catch (error) {
      throw error; // Re-throw to be handled by the modal
    } finally {
      setEditingEntry(undefined);
    }
  }, [editingEntry, t]);

  // Handle close modal
  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setEditingEntry(undefined);
  }, []);

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Render dictionary entry item
  const renderEntryItem = ({ item }: { item: DictionaryEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryContent}>
        <View style={styles.entryTextContainer}>
          <Text style={styles.wordText}>{item.word}</Text>
          <Text style={styles.pronunciationText}>→ {item.pronunciation}</Text>
        </View>
        
        <View style={styles.entryActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePreview(item)}
          >
            <Ionicons name="play-circle-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditEntry(item)}
          >
            <Ionicons name="create-outline" size={22} color={theme.text + '80'} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteEntry(item)}
          >
            <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="book-outline" size={80} color={theme.text + '40'} />
      <Text style={styles.emptyStateTitle}>
        {t('dictionary.emptyTitle') || 'No Dictionary Entries'}
      </Text>
      <Text style={styles.emptyStateDescription}>
        {t('dictionary.emptyDescription') || 'Add words and pronunciations to improve speech recognition'}
      </Text>
      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={() => {
          setEditingEntry(undefined);
          setShowAddModal(true);
        }}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addFirstButtonText}>
          {t('dictionary.addFirst') || 'Add Your First Entry'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('dictionary.title') || 'Dictionary'}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingEntry(undefined);
            setShowAddModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.text + '60'} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('dictionary.searchPlaceholder') || 'Search words or pronunciations...'}
            placeholderTextColor={theme.text + '60'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchButton}
            >
              <Ionicons name="close-circle" size={20} color={theme.text + '60'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Language Indicator */}
      <View style={styles.languageIndicator}>
        <Ionicons name="globe-outline" size={16} color={theme.primary} />
        <Text style={styles.languageText}>
          {t(`languages.${currentLanguage}`) || currentLanguage.toUpperCase()}
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>
            {t('dictionary.loading') || 'Loading dictionary...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntryItem}
          contentContainerStyle={[
            styles.listContainer,
            filteredEntries.length === 0 && styles.emptyListContainer
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add/Edit Entry Modal */}
      <AddEditEntryModal
        visible={showAddModal}
        onClose={handleCloseModal}
        onSave={handleSaveEntry}
        entry={editingEntry}
        language={currentLanguage}
      />
    </SafeAreaView>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  addButton: {
    backgroundColor: theme.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: theme.text,
  },
  clearSearchButton: {
    padding: 4,
  },
  languageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  languageText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  emptyListContainer: {
    flex: 1,
  },
  entryCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  entryTextContainer: {
    flex: 1,
  },
  wordText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  pronunciationText: {
    fontSize: 14,
    color: theme.text + '80',
    fontStyle: 'italic',
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.text + '80',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: theme.text + '80',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addFirstButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DictionaryScreen; 