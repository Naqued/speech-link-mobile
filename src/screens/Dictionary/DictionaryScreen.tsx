import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../../contexts/ThemeContext';
import { ScreenHeader } from '../../components/UI/ScreenHeader';
import * as dictionaryAPI from '../../api/dictionary';
import AddEditEntryModal from '../../components/Dictionary/AddEditEntryModal';

const DictionaryScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const styles = makeStyles(theme);

  const [entries, setEntries] = useState<dictionaryAPI.DictionaryEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<dictionaryAPI.DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<dictionaryAPI.DictionaryEntry | undefined>();
  // Normalize language code (e.g., 'fr-FR' -> 'fr', 'en-US' -> 'en')
  const currentLanguage = (i18n.language || 'en').split('-')[0];

  // Load entries when component mounts or language changes
  useEffect(() => {
    loadEntries();
  }, [currentLanguage]);

  // Filter entries when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEntries(entries);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = entries.filter(
        (entry) =>
          entry.word.toLowerCase().includes(query) ||
          entry.pronunciation.toLowerCase().includes(query)
      );
      setFilteredEntries(filtered);
    }
  }, [searchQuery, entries]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const fetchedEntries = await dictionaryAPI.getDictionaryEntries(currentLanguage);
      setEntries(fetchedEntries);
      setFilteredEntries(fetchedEntries);
    } catch (error) {
      console.error('Failed to load pronunciation entries:', error);
      Alert.alert(
        t('pronunciation.error') || 'Error',
        t('pronunciation.loadError') || 'Failed to load pronunciation entries'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (word: string, pronunciation: string) => {
    try {
      await dictionaryAPI.createDictionaryEntry({
        word,
        pronunciation,
        language: currentLanguage,
      });
      setShowAddModal(false);
      loadEntries();
      Alert.alert(
        t('pronunciation.success') || 'Success',
        t('pronunciation.entryAdded') || 'Entry added successfully'
      );
    } catch (error) {
      Alert.alert(
        t('pronunciation.error') || 'Error',
        error instanceof Error ? error.message : 'Failed to add entry'
      );
    }
  };

  const handleEditEntry = async (word: string, pronunciation: string) => {
    if (!editingEntry) return;

    try {
      await dictionaryAPI.updateDictionaryEntry(editingEntry.id, {
        word,
        pronunciation,
      });
      setShowAddModal(false);
      setEditingEntry(undefined);
      loadEntries();
      Alert.alert(
        t('pronunciation.success') || 'Success',
        t('pronunciation.entryUpdated') || 'Entry updated successfully'
      );
    } catch (error) {
      Alert.alert(
        t('pronunciation.error') || 'Error',
        error instanceof Error ? error.message : 'Failed to update entry'
      );
    }
  };

  const handleDeleteEntry = (entry: dictionaryAPI.DictionaryEntry) => {
    Alert.alert(
      t('pronunciation.confirmDelete') || 'Delete Entry',
      t('pronunciation.confirmDeleteMessage') || `Delete "${entry.word}"?`,
      [
        {
          text: t('pronunciation.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('pronunciation.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dictionaryAPI.deleteDictionaryEntry(entry.id);
              loadEntries();
              Alert.alert(
                t('pronunciation.success') || 'Success',
                t('pronunciation.entryDeleted') || 'Entry deleted successfully'
              );
            } catch (error) {
              Alert.alert(
                t('pronunciation.error') || 'Error',
                error instanceof Error ? error.message : 'Failed to delete entry'
              );
            }
          },
        },
      ]
    );
  };

  const handlePreview = async (pronunciation: string) => {
    try {
      console.log('[DictionaryScreen] Previewing with language:', currentLanguage);
      await dictionaryAPI.previewPronunciation(pronunciation, currentLanguage);
    } catch (error) {
      console.error('[DictionaryScreen] Preview error:', error);
      Alert.alert(
        t('pronunciation.error') || 'Error',
        t('pronunciation.previewError') || 'Failed to preview pronunciation'
      );
    }
  };

  const renderEntry = ({ item }: { item: dictionaryAPI.DictionaryEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryContent}>
        <View style={styles.entryTexts}>
          <Text style={styles.wordText}>{item.word}</Text>
          <Text style={styles.pronunciationText}>→ {item.pronunciation}</Text>
        </View>
        <View style={styles.entryActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePreview(item.pronunciation)}
          >
            <Ionicons name="play-circle-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setEditingEntry(item);
              setShowAddModal(true);
            }}
          >
            <Ionicons name="pencil-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteEntry(item)}
          >
            <Ionicons name="trash-outline" size={24} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="book-outline" size={64} color={theme.text + '40'} />
      <Text style={styles.emptyTitle}>
        {searchQuery ? t('pronunciation.noResults') || 'No results found' : t('pronunciation.emptyTitle') || 'No entries yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? t('pronunciation.tryDifferentSearch') || 'Try a different search'
          : t('pronunciation.emptySubtitle') || 'Add words and pronunciations to improve voice accuracy'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => {
            setEditingEntry(undefined);
            setShowAddModal(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.emptyButtonText}>{t('pronunciation.addFirst') || 'Add Your First Entry'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <ScreenHeader 
        title={t('pronunciation.title') || 'Pronunciation'}
        rightComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingEntry(undefined);
              setShowAddModal(true);
            }}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.text + '60'} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('pronunciation.searchPlaceholder') || 'Search words or pronunciations...'}
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
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            filteredEntries.length === 0 && styles.emptyListContainer,
          ]}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Add/Edit Modal */}
      <AddEditEntryModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingEntry(undefined);
        }}
        onSave={editingEntry ? handleEditEntry : handleAddEntry}
        onPreview={handlePreview}
        initialWord={editingEntry?.word}
        initialPronunciation={editingEntry?.pronunciation}
        isEditing={!!editingEntry}
        language={currentLanguage}
      />
    </SafeAreaView>
  );
};

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    addButton: {
      backgroundColor: theme.primary,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
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
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
    },
    clearSearchButton: {
      padding: 4,
    },
    languageIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    languageText: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      padding: 20,
    },
    emptyListContainer: {
      flex: 1,
    },
    entryCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    entryContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    entryTexts: {
      flex: 1,
      gap: 4,
    },
    wordText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    pronunciationText: {
      fontSize: 16,
      color: theme.primary,
    },
    entryActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.text + '80',
      marginTop: 8,
      textAlign: 'center',
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 24,
    },
    emptyButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default DictionaryScreen;

