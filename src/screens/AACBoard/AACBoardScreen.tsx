import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';

// Services
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useVoiceSettings } from '../../hooks/useVoiceSettings';
import { aacService } from '../../services/aacService';

// Models
import { 
  SentenceCategory, 
  SampleSentence,
  CategoryUIModel,
  SentenceUIModel,
  mapToUICategoryModel,
  mapToUISentenceModel
} from '../../models/AAC';

// Components
import SentenceFormModal from './components/SentenceFormModal';
import CategoryFormModal from './components/CategoryFormModal';

// Default categories with icons (used as fallback)
const DEFAULT_CATEGORIES: CategoryUIModel[] = [
  { id: 'basicNeeds', name: 'Basic Needs', icon: 'water-outline', color: '#4F46E5', order: 0, isGlobal: true },
  { id: 'greetings', name: 'Greetings', icon: 'hand-left-outline', color: '#F59E0B', order: 1, isGlobal: true },
  { id: 'feelings', name: 'Feelings', icon: 'happy-outline', color: '#10B981', order: 2, isGlobal: true },
  { id: 'questions', name: 'Questions', icon: 'help-circle-outline', color: '#8B5CF6', order: 3, isGlobal: true },
  { id: 'medical', name: 'Medical', icon: 'medical-outline', color: '#EF4444', order: 4, isGlobal: true },
  { id: 'activities', name: 'Activities', icon: 'bicycle-outline', color: '#EC4899', order: 5, isGlobal: true },
];

// Special "All" category
const ALL_CATEGORY: CategoryUIModel = {
  id: 'all',
  name: 'All Phrases',
  icon: 'grid-outline',
  color: '#64748B', // Slate color
  order: -1,
  isGlobal: true
};

const AACBoardScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const { speak, stopSpeaking, isPlaying: ttsIsPlaying } = useTextToSpeech();
  const { userSettings } = useVoiceSettings();
  
  // Current language from i18n
  const currentLanguage = i18n.language || 'en';
  
  // State
  const [categories, setCategories] = useState<CategoryUIModel[]>([ALL_CATEGORY, ...DEFAULT_CATEGORIES]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customMessage, setCustomMessage] = useState('');
  const [recentPhrases, setRecentPhrases] = useState<SentenceUIModel[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [phrases, setPhrases] = useState<Record<string, SentenceUIModel[]>>({});
  const [allPhrases, setAllPhrases] = useState<SentenceUIModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlayingText, setCurrentlyPlayingText] = useState<string | null>(null);
  
  // Modal state
  const [sentenceFormVisible, setSentenceFormVisible] = useState(false);
  const [editingSentence, setEditingSentence] = useState<SentenceUIModel | undefined>(undefined);
  const [categoryFormVisible, setCategoryFormVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryUIModel | undefined>(undefined);

  const styles = makeStyles(theme);

  // Use effect to update isSpeaking state based on TTS service state
  useEffect(() => {
    if (!ttsIsPlaying && !isLoadingAudio && isSpeaking) {
      // TTS has stopped playing, update our state
      setIsSpeaking(false);
      setCurrentlyPlayingText(null);
    }
  }, [ttsIsPlaying, isLoadingAudio, isSpeaking]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setError(null);
        
        // Fetch from API
        const apiCategories = await aacService.getCategories(currentLanguage);
        
        if (apiCategories.length > 0) {
          // Map to UI model and sort by order
          const uiCategories = apiCategories
            .map(mapToUICategoryModel)
            .sort((a, b) => a.order - b.order);
          
          // Add the "All" category at the beginning
          setCategories([ALL_CATEGORY, ...uiCategories]);
          
          // Select "All" category by default
          if (!selectedCategory) {
            setSelectedCategory('all');
          }
        } else {
          // Fallback to defaults if no categories found
          setCategories([ALL_CATEGORY, ...DEFAULT_CATEGORIES]);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        // Fallback to defaults on error
        setCategories([ALL_CATEGORY, ...DEFAULT_CATEGORIES]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    fetchCategories();
  }, [currentLanguage]);

  // Fetch all sentences when "all" category is selected or when categories change
  useEffect(() => {
    const fetchAllSentences = async () => {
      if (selectedCategory !== 'all') return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch all sentences without categoryId filter
        const apiSentences = await aacService.getSentences(undefined, currentLanguage);
        
        // Map to UI model
        const uiSentences = apiSentences
          .map(mapToUISentenceModel)
          .sort((a, b) => {
            // Sort by category and then by order/id
            const catA = categories.find(c => c.id === a.categoryId)?.order || 0;
            const catB = categories.find(c => c.id === b.categoryId)?.order || 0;
            if (catA !== catB) return catA - catB;
            
            // For sentences in the same category, sort by their original order if available
            const itemA = apiSentences.find(s => s.id === a.id);
            const itemB = apiSentences.find(s => s.id === b.id);
            return (itemA?.order || 0) - (itemB?.order || 0);
          });
        
        setAllPhrases(uiSentences);
      } catch (err) {
        console.error('Error fetching all sentences:', err);
        setError('Failed to load phrases');
        setAllPhrases([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllSentences();
  }, [selectedCategory, currentLanguage, categories]);

  // Fetch sentences for specific category
  useEffect(() => {
    const fetchSentences = async () => {
      if (!selectedCategory || selectedCategory === 'all') return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch from API
        const apiSentences = await aacService.getSentences(selectedCategory, currentLanguage);
        
        // Map to UI model and sort by order
        const uiSentences = apiSentences
          .map(mapToUISentenceModel)
          .sort((a, b) => {
            const itemA = apiSentences.find(s => s.id === a.id);
            const itemB = apiSentences.find(s => s.id === b.id);
            return (itemA?.order || 0) - (itemB?.order || 0);
          });
        
        // Update phrases for the selected category
        setPhrases(prev => ({
          ...prev,
          [selectedCategory]: uiSentences
        }));
      } catch (err) {
        console.error('Error fetching sentences:', err);
        setError('Failed to load phrases');
        
        // Clear phrases for this category on error
        setPhrases(prev => ({
          ...prev,
          [selectedCategory]: []
        }));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSentences();
  }, [selectedCategory, currentLanguage]);

  const speakPhrase = async (text: string, phraseId?: string) => {
    try {
      console.log('============= TTS DEBUG START =============');
      console.log('Starting speakPhrase with text:', text.substring(0, 20) + (text.length > 20 ? '...' : ''));
      
      // Stop any current speech
      if (isSpeaking) {
        console.log('Stopping previous speech');
        stopSpeaking();
      }

      setIsSpeaking(true);
      setIsLoadingAudio(true);
      setCurrentlyPlayingText(text);
      
      // If it's a saved phrase with an ID, increment its usage
      if (phraseId) {
        try {
          console.log('Incrementing usage for phrase ID:', phraseId);
          // Don't await to allow speaking to start immediately
          aacService.incrementSentenceUsage(phraseId).catch(err => 
            console.error('Failed to increment sentence usage:', err)
          );
        } catch (error) {
          // Non-critical error, just log it
          console.error('Failed to track phrase usage:', error);
        }
      }
      
      // Add phrase to recent phrases list (avoiding duplicates)
      const newRecentPhrase: SentenceUIModel = {
        id: phraseId || `recent-${Date.now()}`,
        text,
        categoryId: selectedCategory,
        isFavorite: false
      };
      
      setRecentPhrases(prev => {
        const filtered = prev.filter(p => p.text !== text);
        return [newRecentPhrase, ...filtered].slice(0, 5);
      });
      
      // Try to use the backend TTS API first with a timeout to ensure responsiveness
      console.log('Voice settings check:', {
        hasSettings: !!userSettings,
        hasVoiceSettings: !!userSettings?.voiceSettings,
        provider: userSettings?.voiceSettings?.provider,
        voiceId: userSettings?.voiceSettings?.voiceId
      });
      
      // Always try to use the backend TTS API, even if provider/voiceId aren't defined
      try {
        console.log('Attempting to use backend TTS API');
        
        // Create a promise that resolves after the TTS API timeout threshold (4 seconds)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            console.log('TTS API timeout reached (4s)');
            reject(new Error('TTS API timeout'));
          }, 4000);
        });
        
        console.log('Calling speak function with:', {
          text: text.substring(0, 20) + (text.length > 20 ? '...' : ''),
          language: currentLanguage,
          voiceId: userSettings?.voiceSettings?.voiceId, // Might be undefined
          provider: userSettings?.voiceSettings?.provider // Might be undefined
        });
        
        // Try to use the backend TTS API with timeout
        await Promise.race([
          speak(
            text,
            userSettings?.voiceSettings?.voiceId, // Pass this even if undefined
            userSettings?.voiceSettings?.provider as any, // Pass this even if undefined
            currentLanguage // Add language parameter
          ),
          timeoutPromise
        ]);
        
        // If we reach here, backend TTS was successful
        console.log('Backend TTS API call successful');
        setIsLoadingAudio(false);
        // Keep isSpeaking true as the audio is now playing
        console.log('============= TTS DEBUG END =============');
        return;
      } catch (ttsError) {
        // Log the error and fall back to local Speech API
        console.log('Backend TTS failed or timed out:', ttsError);
        console.log('Falling back to local Speech API');
        // Continue to fallback option below
      }
      
      // Fallback to local Speech API
      console.log('Using local Speech API fallback with language:', currentLanguage);
      setIsLoadingAudio(false);
      Speech.speak(text, {
        language: currentLanguage,
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          console.log('Local Speech API finished speaking');
          setIsSpeaking(false);
          setCurrentlyPlayingText(null);
        },
        onError: (error) => {
          console.log('Local Speech API error:', error);
          setIsSpeaking(false);
          setCurrentlyPlayingText(null);
        },
      });
      console.log('============= TTS DEBUG END =============');
    } catch (error) {
      console.error('Failed to speak phrase', error);
      Alert.alert(t('general.error'), 'Failed to speak phrase');
      
      // Ensure we're not stuck in speaking state
      setIsSpeaking(false);
      setIsLoadingAudio(false);
      setCurrentlyPlayingText(null);
      console.log('============= TTS DEBUG END WITH ERROR =============');
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    Speech.stop();
    setIsSpeaking(false);
    setIsLoadingAudio(false);
    setCurrentlyPlayingText(null);
  };

  const speakCustomMessage = () => {
    if (!customMessage.trim()) return;
    
    speakPhrase(customMessage);
    setCustomMessage('');
  };

  const handleAddPhrase = () => {
    setEditingSentence(undefined);
    setSentenceFormVisible(true);
  };
  
  const handleEditPhrase = (sentence: SentenceUIModel) => {
    setEditingSentence(sentence);
    setSentenceFormVisible(true);
  };
  
  const handleDeletePhrase = (sentence: SentenceUIModel) => {
    Alert.alert(
      t('aacBoard.deletePhrase'),
      t('aacBoard.deleteConfirm'),
      [
        {
          text: t('general.cancel'),
          style: 'cancel'
        },
        {
          text: t('general.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await aacService.deleteSentence(sentence.id);
              
              // Update local state
              setPhrases(prev => {
                const categoryPhrases = [...(prev[sentence.categoryId] || [])];
                const updatedPhrases = categoryPhrases.filter(p => p.id !== sentence.id);
                
                return {
                  ...prev,
                  [sentence.categoryId]: updatedPhrases
                };
              });
              
              // Also remove from recent phrases if present
              setRecentPhrases(prev => prev.filter(p => p.id !== sentence.id));
              
            } catch (error) {
              console.error('Error deleting phrase:', error);
              Alert.alert(
                t('general.error'),
                t('aacBoard.errorDeletingPhrase')
              );
            }
          }
        }
      ]
    );
  };
  
  const handleSaveSentence = (sentence: SentenceUIModel) => {
    // Update local state with the new/updated sentence
    setPhrases(prev => {
      const categoryPhrases = [...(prev[sentence.categoryId] || [])];
      
      // Check if this is an update or a new sentence
      const existingIndex = categoryPhrases.findIndex(p => p.id === sentence.id);
      
      if (existingIndex >= 0) {
        // Update existing sentence
        categoryPhrases[existingIndex] = sentence;
      } else {
        // Add new sentence
        categoryPhrases.push(sentence);
      }
      
      return {
        ...prev,
        [sentence.categoryId]: categoryPhrases
      };
    });
    
    // If we're currently viewing the category this sentence belongs to,
    // make sure the UI updates (not strictly necessary with the above code,
    // but added for clarity)
    if (selectedCategory === sentence.categoryId) {
      setSelectedCategory(prev => {
        // This trick forces a re-render without actually changing the state
        const temp = '';
        setTimeout(() => setSelectedCategory(prev), 10);
        return temp;
      });
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(undefined);
    setCategoryFormVisible(true);
  };
  
  const handleEditCategory = (category: CategoryUIModel) => {
    setEditingCategory(category);
    setCategoryFormVisible(true);
  };
  
  const handleDeleteCategory = (category: CategoryUIModel) => {
    // Don't allow deleting if it has phrases
    const hasPhrases = phrases[category.id] && phrases[category.id].length > 0;
    
    if (hasPhrases) {
      Alert.alert(
        t('aacBoard.cannotDeleteCategory'),
        t('aacBoard.categoryHasPhrases'),
        [{ text: t('general.ok') }]
      );
      return;
    }
    
    Alert.alert(
      t('aacBoard.deleteCategory'),
      t('aacBoard.deleteCategoryConfirm'),
      [
        {
          text: t('general.cancel'),
          style: 'cancel'
        },
        {
          text: t('general.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await aacService.deleteCategory(category.id);
              
              // Update local state
              setCategories(prev => prev.filter(c => c.id !== category.id));
              
              // If we're currently viewing this category, switch to another one
              if (selectedCategory === category.id) {
                const remainingCategories = categories.filter(c => c.id !== category.id);
                if (remainingCategories.length > 0) {
                  setSelectedCategory(remainingCategories[0].id);
                } else {
                  setSelectedCategory('');
                }
              }
              
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert(
                t('general.error'),
                t('aacBoard.errorDeletingCategory')
              );
            }
          }
        }
      ]
    );
  };
  
  const handleSaveCategory = (category: CategoryUIModel) => {
    // Update local state with the new/updated category
    setCategories(prev => {
      const existingIndex = prev.findIndex(c => c.id === category.id);
      
      if (existingIndex >= 0) {
        // Update existing category
        const updatedCategories = [...prev];
        updatedCategories[existingIndex] = category;
        return updatedCategories;
      } else {
        // Add new category
        return [...prev, category].sort((a, b) => a.order - b.order);
      }
    });
  };
  
  const handleCategoryLongPress = (category: CategoryUIModel) => {
    // Don't allow editing global categories
    if (category.isGlobal) {
      Alert.alert(
        t('aacBoard.cannotModifyCategory'),
        t('aacBoard.globalCategoryInfo'),
        [{ text: t('general.ok') }]
      );
      return;
    }
    
    Alert.alert(
      category.name,
      t('aacBoard.selectCategoryAction'),
      [
        {
          text: t('general.cancel'),
          style: 'cancel'
        },
        {
          text: t('general.edit'),
          onPress: () => handleEditCategory(category)
        },
        {
          text: t('general.delete'),
          style: 'destructive',
          onPress: () => handleDeleteCategory(category)
        }
      ]
    );
  };

  const renderCategoryItem = ({ item }: { item: CategoryUIModel }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.selectedCategoryButton,
        { backgroundColor: selectedCategory === item.id ? item.color : theme.card }
      ]}
      onPress={() => setSelectedCategory(item.id)}
      onLongPress={() => handleCategoryLongPress(item)}
    >
      <Ionicons
        name={item.icon as any}
        size={28}
        color={selectedCategory === item.id ? '#FFFFFF' : theme.text}
      />
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText,
        ]}
      >
        {item.isGlobal ? t(`aac.categories.${item.id}`) : item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderPhraseItem = ({ item }: { item: SentenceUIModel }) => (
    <TouchableOpacity
      style={[
        styles.phraseButton,
        currentlyPlayingText === item.text && styles.playingPhraseButton
      ]}
      onPress={() => speakPhrase(item.text, item.id)}
      onLongPress={() => handlePhraseActions(item)}
    >
      <Text style={styles.phraseText} numberOfLines={2}>
        {item.text}
      </Text>
      {currentlyPlayingText === item.text && (
        <View style={styles.playingIndicatorContainer}>
          {isLoadingAudio ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopSpeaking}
            >
              <Ionicons name="stop" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
  
  const handlePhraseActions = (sentence: SentenceUIModel) => {
    Alert.alert(
      sentence.text,
      t('aacBoard.selectAction'),
      [
        {
          text: t('general.cancel'),
          style: 'cancel'
        },
        {
          text: t('aac.phrases.edit'),
          onPress: () => handleEditPhrase(sentence)
        },
        {
          text: t('aac.phrases.delete'),
          style: 'destructive',
          onPress: () => handleDeletePhrase(sentence)
        }
      ]
    );
  };

  // Render empty state when no phrases are found
  const renderEmptyPhrases = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.emptyText}>{t('general.loading')}</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={theme.text} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              // Re-fetch sentences for this category
              setSelectedCategory(prevCat => {
                // Toggle state to trigger re-fetch
                const temp = '';
                setTimeout(() => setSelectedCategory(prevCat), 10);
                return temp;
              });
            }}
          >
            <Text style={styles.retryText}>{t('general.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-outline" size={40} color={theme.text} />
        <Text style={styles.emptyText}>{t('aacBoard.noPhrases')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPhrase}>
          <Ionicons name="add-outline" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>{t('aac.phrases.add')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{t('aac.title')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddCategory}>
            <Ionicons name="folder-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddPhrase}>
            <Ionicons name="add-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.categoriesContainer}>
        {isCategoriesLoading ? (
          <View style={styles.loadingCategories}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addCategoryButton}
                onPress={handleAddCategory}
              >
                <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                <Text style={styles.addCategoryText}>{t('aacBoard.addCategory')}</Text>
              </TouchableOpacity>
            }
          />
        )}
      </View>
      
      {recentPhrases.length > 0 && (
        <View style={styles.recentContainer}>
          <Text style={styles.sectionTitle}>{t('aacBoard.recentPhrases')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentScrollView}
          >
            {recentPhrases.map((phrase) => (
              <TouchableOpacity
                key={phrase.id}
                style={styles.recentButton}
                onPress={() => speakPhrase(phrase.text, phrase.id)}
                onLongPress={() => handlePhraseActions(phrase)}
              >
                <Text style={styles.recentText} numberOfLines={1}>
                  {phrase.text}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.phrasesContainer}>
        <Text style={styles.sectionTitle}>
          {selectedCategory ? (
            selectedCategory === 'all' ?
            t('aacBoard.allPhrases') :
            (categories.find(c => c.id === selectedCategory)?.isGlobal 
              ? t(`aac.categories.${selectedCategory}`) 
              : categories.find(c => c.id === selectedCategory)?.name || '')
          ) : t('aac.title')}
        </Text>
        <FlatList
          data={selectedCategory === 'all' ? allPhrases : (phrases[selectedCategory] || [])}
          renderItem={renderPhraseItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.phrasesList}
          ListEmptyComponent={renderEmptyPhrases}
        />
      </View>
      
      <View style={styles.customMessageContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={isSpeaking ? t('general.loading') : t('aacBoard.customMessage')}
            placeholderTextColor={theme.text + '80'}
            value={customMessage}
            onChangeText={setCustomMessage}
            multiline
            maxLength={100}
            editable={!isSpeaking}
          />
          {customMessage.length > 0 && !isSpeaking && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setCustomMessage('')}>
              <Ionicons name="close-circle" size={20} color={theme.text + '80'} />
            </TouchableOpacity>
          )}
          {isSpeaking && (
            <TouchableOpacity style={styles.clearButton} onPress={handleStopSpeaking}>
              <Ionicons name="stop-circle" size={20} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.speakButton,
            (!customMessage.trim() || isSpeaking) && styles.speakButtonDisabled,
          ]}
          onPress={speakCustomMessage}
          disabled={!customMessage.trim() || isSpeaking}
        >
          {isLoadingAudio && isSpeaking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="volume-high" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Sentence Form Modal */}
      <SentenceFormModal
        visible={sentenceFormVisible}
        onClose={() => setSentenceFormVisible(false)}
        onSave={handleSaveSentence}
        categories={categories}
        editSentence={editingSentence}
        currentLanguage={currentLanguage}
      />
      
      {/* Category Form Modal */}
      <CategoryFormModal
        visible={categoryFormVisible}
        onClose={() => setCategoryFormVisible(false)}
        onSave={handleSaveCategory}
        editCategory={editingCategory}
        currentLanguage={currentLanguage}
      />
    </SafeAreaView>
  );
};

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  categoriesContainer: {
    height: 90,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  loadingCategories: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesList: {
    paddingHorizontal: 15,
    alignItems: 'center',
    height: 90,
  },
  categoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: theme.card,
    width: 100,
    height: 70,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedCategoryButton: {
    backgroundColor: theme.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.text,
    marginTop: 4,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  recentContainer: {
    marginTop: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 10,
  },
  recentScrollView: {
    paddingBottom: 10,
  },
  recentButton: {
    backgroundColor: theme.card,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: theme.border,
  },
  recentText: {
    color: theme.text,
    fontSize: 14,
  },
  phrasesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 15,
  },
  phrasesList: {
    paddingBottom: 20,
  },
  phraseButton: {
    flex: 1,
    backgroundColor: theme.card,
    margin: 6,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  phraseText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  customMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.card,
    ...Platform.select({
      ios: {
        paddingBottom: 30,
      },
    }),
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
    minHeight: 50,
    borderWidth: 1,
    borderColor: theme.border,
  },
  input: {
    flex: 1,
    color: theme.text,
    fontSize: 16,
    maxHeight: 80,
  },
  clearButton: {
    padding: 5,
  },
  speakButton: {
    backgroundColor: theme.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  speakButtonDisabled: {
    backgroundColor: theme.primary + '80',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    color: theme.text,
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: theme.primary,
    borderRadius: 20,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 15,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 5,
  },
  addCategoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: theme.card,
    width: 100,
    height: 70,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  addCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  playingPhraseButton: {
    borderColor: theme.primary,
    borderWidth: 2,
    backgroundColor: theme.card,
  },
  playingIndicatorContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopButton: {
    padding: 2,
  },
});

export default AACBoardScreen; 