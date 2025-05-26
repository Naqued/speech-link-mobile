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
  ActivityIndicator,
  Linking,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';
import { useDiscord } from '../../contexts/DiscordContext';

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
import DiscordIndicator from '../../components/UI/DiscordIndicator';
import { SafeAreaWrapper } from '../../components/UI/SafeAreaWrapper';

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
  const { isAuthenticated, isConnected, streamSpeech } = useDiscord();
  
  // Current language from i18n
  const currentLanguage = i18n.language || 'en';
  
  // Orientation state
  const [orientation, setOrientation] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'landscape' : 'portrait'
  );
  
  // Log language for debugging
  useEffect(() => {
    console.log('=================== AAC LANGUAGE DEBUG ===================');
    console.log('AACBoardScreen mounted/updated with language:', currentLanguage);
    console.log('i18n.language:', i18n.language);
    console.log('i18n supported languages:', i18n.languages);
    console.log('=================== AAC LANGUAGE DEBUG ===================');
  }, [currentLanguage, i18n.language]);

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const newOrientation = window.width > window.height ? 'landscape' : 'portrait';
      if (newOrientation !== orientation) {
        setOrientation(newOrientation);
      }
    });

    return () => subscription?.remove();
  }, [orientation]);

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
  
  // Track subscription limit status
  const [subscriptionLimitReached, setSubscriptionLimitReached] = useState(false);
  
  // Modal state
  const [sentenceFormVisible, setSentenceFormVisible] = useState(false);
  const [editingSentence, setEditingSentence] = useState<SentenceUIModel | undefined>(undefined);
  const [categoryFormVisible, setCategoryFormVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryUIModel | undefined>(undefined);

  // Add state for Discord streaming
  const [isStreamingToDiscord, setIsStreamingToDiscord] = useState(false);

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
        
        // Debug log
        console.log('[AACBoard] fetchCategories - using language:', currentLanguage);
        
        // Fetch from API
        const apiCategories = await aacService.getCategories(currentLanguage);
        
        console.log('[AACBoard] fetchCategories - received categories:', apiCategories.length);
        
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
          console.log('[AACBoard] No categories found for language:', currentLanguage, '- using defaults');
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
        
        // Debug log
        console.log('[AACBoard] fetchAllSentences - using language:', currentLanguage);
        
        // Fetch all sentences without categoryId filter
        const apiSentences = await aacService.getSentences(undefined, currentLanguage);
        
        console.log('[AACBoard] fetchAllSentences - received sentences:', apiSentences.length);
        
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
        
        // Debug log
        console.log('[AACBoard] fetchSentences - using language:', currentLanguage, 'category:', selectedCategory);
        
        // Fetch from API
        const apiSentences = await aacService.getSentences(selectedCategory, currentLanguage);
        
        console.log('[AACBoard] fetchSentences - received sentences for category:', apiSentences.length);
        
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
      if (isSpeaking) {
        handleStopSpeaking();
        return;
      }
      
      // Don't speak empty text
      if (!text.trim()) {
        return;
      }
      
      // Check if we've reached the subscription limit
      if (subscriptionLimitReached) {
        Alert.alert(
          t('general.subscriptionRequired'),
          t('aac.subscriptionLimitReachedMessage'),
          [
            {
              text: t('general.upgrade'),
              onPress: () => handleSubscriptionUpgrade(),
            },
            {
              text: t('general.cancel'),
              style: 'cancel',
            },
          ]
        );
        return;
      }
      
      // Log for debugging
      console.log('[AACBoard] Speaking phrase:', text);
      
      // Set state to indicate speaking has started
      setIsSpeaking(true);
      setIsLoadingAudio(true);
      setCurrentlyPlayingText(text);
      
      // Update recent phrases (add to the beginning, keep only last 5)
      if (phraseId) {
        const sentenceToAdd = allPhrases.find(p => p.id === phraseId);
        if (sentenceToAdd) {
          // Only add if not already in the list or not at the top
          if (!recentPhrases.find(p => p.id === sentenceToAdd.id)) {
            setRecentPhrases([sentenceToAdd, ...recentPhrases.slice(0, 4)]);
          } else if (recentPhrases[0].id !== sentenceToAdd.id) {
            // Move to top if already in list but not at top
            setRecentPhrases([
              sentenceToAdd,
              ...recentPhrases.filter(p => p.id !== sentenceToAdd.id).slice(0, 4)
            ]);
          }
        }
      }
      
      // Stream to Discord if connected
      if (isConnected) {
        setIsStreamingToDiscord(true);
        try {
          // Show streaming indicator
          console.log('[AACBoard] Streaming to Discord:', text);
          
          // Start streaming to Discord - don't await this to avoid blocking the speech
          // The direct streaming API will handle this independently
          streamSpeech(text).catch(err => {
            console.log('[AACBoard] Discord streaming error (not critical):', err);
            // Non-critical error, no need to show to the user
          });
        } catch (discordError) {
          // This should never happen since we're catching errors in the streamSpeech call
          console.log('[AACBoard] Discord streaming catch block (should not occur):', discordError);
          // Continue with normal speech even if Discord streaming fails
        } finally {
          // Short delay before hiding the streaming indicator
          setTimeout(() => {
            setIsStreamingToDiscord(false);
          }, 1000); // Short delay to show the indicator
        }
      }
      
      // Use TTS service to speak
      await speak(text);
      
      // Increment usage count for the sentence if it has an ID
      if (phraseId) {
        try {
          await aacService.incrementSentenceUsage(phraseId);
        } catch (err) {
          console.error('Failed to increment sentence usage:', err);
          // Non-critical error, don't show to user
        }
      }
    } catch (err) {
      console.error('Error speaking phrase:', err);
      setError('Failed to speak phrase');
      setIsSpeaking(false);
      setCurrentlyPlayingText(null);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    Speech.stop();
    setIsSpeaking(false);
    setIsLoadingAudio(false);
    setCurrentlyPlayingText(null);
  };

  const handleSubscriptionUpgrade = () => {
    // Navigate to subscription page or open a web link
    Linking.openURL('https://speechlink.example.com/subscribe');
  };

  const speakCustomMessage = async () => {
    if (customMessage.trim()) {
      try {
        // Don't continue if we're already speaking
        if (isSpeaking) {
          handleStopSpeaking();
          return;
        }
        
        // Check subscription limit
        if (subscriptionLimitReached) {
          Alert.alert(
            t('general.subscriptionRequired'),
            t('aac.subscriptionLimitReachedMessage'),
            [
              {
                text: t('general.upgrade'),
                onPress: () => handleSubscriptionUpgrade(),
              },
              {
                text: t('general.cancel'),
                style: 'cancel',
              },
            ]
          );
          return;
        }
        
        // Create a temporary SentenceUIModel for the custom message
        const customSentence: SentenceUIModel = {
          id: `custom-${Date.now()}`,
          text: customMessage.trim(),
          categoryId: 'custom', // Use a special category ID for custom messages
          isFavorite: false
        };
        
        // Update recent phrases (add to beginning, keep only last 5)
        if (!recentPhrases.find(p => p.text === customMessage.trim())) {
          setRecentPhrases([customSentence, ...recentPhrases.slice(0, 4)]);
        }
        
        // Set state to indicate speaking has started
        setIsSpeaking(true);
        setIsLoadingAudio(true);
        setCurrentlyPlayingText(customMessage.trim());
        
        // Stream to Discord if connected
        if (isConnected) {
          setIsStreamingToDiscord(true);
          try {
            console.log('[AACBoard] Streaming custom message to Discord:', customMessage);
            streamSpeech(customMessage).catch(err => {
              console.log('[AACBoard] Discord streaming error (not critical):', err);
            });
          } catch (discordError) {
            console.log('[AACBoard] Discord streaming catch block (should not occur):', discordError);
          } finally {
            setTimeout(() => {
              setIsStreamingToDiscord(false);
            }, 1000);
          }
        }
        
        // Speak the message directly
        await speak(customMessage);
        
        // Clear the input
        setCustomMessage('');
      } catch (err) {
        console.error('Error speaking custom message:', err);
        setError('Failed to speak custom message');
        setIsSpeaking(false);
        setCurrentlyPlayingText(null);
      } finally {
        setIsLoadingAudio(false);
      }
    }
  };

  const handleAddPhrase = () => {
    // Create a new sentence with pre-filled text if customMessage is set
    if (customMessage.trim()) {
      const newSentence: SentenceUIModel = {
        id: '', // Empty ID indicates it's a new sentence
        text: customMessage.trim(),
        categoryId: categories.find(c => c.id !== 'all')?.id || '', // Default to first real category
        isFavorite: false
      };
      setEditingSentence(newSentence);
    } else {
      setEditingSentence(undefined);
    }
    setSentenceFormVisible(true);
  };
  
  const handleAddPhraseWithText = (prefillText: string) => {
    const newSentence: SentenceUIModel = {
      id: '', // Empty ID indicates it's a new sentence
      text: prefillText,
      categoryId: categories.find(c => c.id !== 'all')?.id || '', // Default to first real category
      isFavorite: false
    };
    setEditingSentence(newSentence);
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
                t('general.error.title'),
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
      const existingIndex = sentence.id ? categoryPhrases.findIndex(p => p.id === sentence.id) : -1;
      
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
    
    // Clear the custom message after saving
    setCustomMessage('');
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
                t('general.error.title'),
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
        orientation === 'landscape' ? styles.categoryButtonLandscape : styles.categoryButton,
        selectedCategory === item.id && (orientation === 'landscape' ? styles.selectedCategoryButtonLandscape : styles.selectedCategoryButton),
        { backgroundColor: selectedCategory === item.id ? item.color : theme.card }
      ]}
      onPress={() => setSelectedCategory(item.id)}
      onLongPress={() => handleCategoryLongPress(item)}
    >
      <Ionicons
        name={item.icon as any}
        size={orientation === 'landscape' ? 16 : 28}
        color={selectedCategory === item.id ? '#FFFFFF' : theme.text}
      />
      <Text
        style={[
          orientation === 'landscape' ? styles.categoryTextLandscape : styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText,
        ]}
        numberOfLines={orientation === 'landscape' ? 2 : 1}
      >
        {item.name}
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
    // Check if this is a custom message (ID starts with "custom-")
    const isCustomMessage = sentence.id.startsWith('custom-');
    
    if (isCustomMessage) {
      // For custom messages, offer speak and save options
      Alert.alert(
        sentence.text,
        t('aacBoard.customMessage'),
        [
          {
            text: t('general.cancel'),
            style: 'cancel'
          },
          {
            text: t('aacBoard.speak'),
            onPress: () => speakPhrase(sentence.text, sentence.id)
          },
          {
            text: t('general.save'),
            onPress: () => {
              // Use handleAddPhraseWithText to open the add form with pre-filled text
              handleAddPhraseWithText(sentence.text);
            }
          }
        ]
      );
      return;
    }
    
    // For regular phrases, show all options
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
    <SafeAreaWrapper 
      style={styles.container}
      edges={orientation === 'landscape' ? ['bottom'] : ['top', 'bottom']}
    >
      <View style={styles.header}>
        <View style={styles.headerRightContainer}>
          {isAuthenticated && (
            <DiscordIndicator 
              size="medium" 
              showLabel={isConnected}
              isStreaming={isStreamingToDiscord} 
            />
          )}
        </View>
      </View>
      {subscriptionLimitReached && (
        <TouchableOpacity 
          style={styles.limitBanner} 
          onPress={() => {
            // Open the profile page to upgrade
            // For development, link to local profile, for production, link to website
            const upgradeUrl = __DEV__ 
              ? '/profile?upgrade=true' 
              : 'https://speech-aac.link/en/profile?upgrade=true';
            
            // You'd need to implement navigation to the profile page here
            // For example, using Linking.openURL for the website version:
            // Linking.openURL(upgradeUrl);
            Alert.alert(
              t('subscription.limitTitle', 'Subscription Limit Reached'),
              t('subscription.limitMessage', 'You have reached your monthly TTS usage limit. Upgrade your plan for unlimited access.'),
              [
                {
                  text: t('general.later', 'Later'),
                  style: 'cancel'
                },
                {
                  text: t('subscription.upgrade', 'Upgrade'),
                  onPress: () => {
                    // Implementation depends on your navigation setup
                    // This is a placeholder - replace with actual navigation
                    const url = 'https://speech-aac.link/en/profile?upgrade=true';
                    Linking.openURL(url).catch(err => {
                      console.error('Failed to open upgrade URL:', err);
                      Alert.alert(t('general.error.title'), t('general.couldNotOpenBrowser'));
                    });
                  }
                }
              ]
            );
          }}
        >
          <View style={styles.limitBannerContent}>
            <Ionicons name="warning-outline" size={20} color="#FFFFFF" />
            <Text style={styles.limitBannerText}>
              {t('subscription.limitReached', 'Subscription limit reached. Upgrade for more.')}
            </Text>
            <View style={styles.limitBannerButton}>
              <Text style={styles.limitBannerButtonText}>
                {t('subscription.upgrade', 'Upgrade')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
      
      {/* Header with title and actions - always full width */}
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
      
      {orientation === 'landscape' ? (
        // Landscape layout: horizontal split with categories on left
        <View style={styles.landscapeContainer}>
          <View style={styles.landscapeLeft}>
            <View style={styles.categoriesContainerLandscape}>
              {isCategoriesLoading ? (
                <View style={styles.loadingCategories}>
                  <ActivityIndicator size="small" color={theme.primary} />
                </View>
              ) : (
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesListLandscape}
                >
                  {categories.map((item) => renderCategoryItem({ item }))}
                  <TouchableOpacity
                    style={styles.addCategoryButtonLandscape}
                    onPress={handleAddCategory}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                    <Text style={styles.addCategoryTextLandscapeStyle}>{t('aacBoard.addCategory')}</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
          
          <View style={styles.landscapeRight}>
            {recentPhrases.length > 0 && (
              <View style={styles.recentContainerLandscape}>
                <Text style={styles.sectionTitleSmall}>{t('aacBoard.recentPhrases')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentScrollViewLandscape}
                >
                  {recentPhrases.slice(0, 3).map((phrase) => (
                    <TouchableOpacity
                      key={phrase.id}
                      style={[
                        styles.recentButtonSmall,
                        phrase.id.startsWith('custom-') && styles.customRecentButton
                      ]}
                      onPress={() => speakPhrase(phrase.text, phrase.id)}
                      onLongPress={() => handlePhraseActions(phrase)}
                    >
                      {phrase.id.startsWith('custom-') && (
                        <Ionicons name="chatbox-outline" size={10} color={theme.primary} style={styles.customIcon} />
                      )}
                      <Text style={styles.recentTextSmall} numberOfLines={1}>
                        {phrase.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.phrasesContainerLandscape}>
              <Text style={styles.sectionTitleSmall}>
                {selectedCategory ? (
                  selectedCategory === 'all' ?
                  t('aacBoard.allPhrases') :
                  (categories.find(c => c.id === selectedCategory)?.isGlobal 
                    ? t(`aac.categories.${selectedCategory}`) 
                    : categories.find(c => c.id === selectedCategory)?.name || '')
                ) : t('aac.title') || 'AAC Board'}
              </Text>
              <FlatList
                data={selectedCategory === 'all' ? allPhrases : (phrases[selectedCategory] || [])}
                renderItem={renderPhraseItem}
                keyExtractor={(item) => item.id}
                numColumns={3}
                contentContainerStyle={styles.phrasesList}
                ListEmptyComponent={renderEmptyPhrases}
              />
            </View>
          </View>
        </View>
      ) : (
        // Portrait layout: original vertical stack
        <View style={styles.portraitContainer}>
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
                    style={[
                      styles.recentButton,
                      phrase.id.startsWith('custom-') && styles.customRecentButton
                    ]}
                    onPress={() => speakPhrase(phrase.text, phrase.id)}
                    onLongPress={() => handlePhraseActions(phrase)}
                  >
                    {phrase.id.startsWith('custom-') && (
                      <Ionicons name="chatbox-outline" size={12} color={theme.primary} style={styles.customIcon} />
                    )}
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
              ) : t('aac.title') || 'AAC Board'}
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
        </View>
      )}
      
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
            <View style={styles.inputActions}>
              <TouchableOpacity style={styles.inputActionButton} onPress={() => handleAddPhraseWithText(customMessage.trim())}>
                <Ionicons name="bookmark-outline" size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.inputActionButton} onPress={() => setCustomMessage('')}>
                <Ionicons name="close-circle" size={20} color={theme.text + '80'} />
              </TouchableOpacity>
            </View>
          )}
          {isSpeaking && (
            <TouchableOpacity style={styles.inputActionButton} onPress={handleStopSpeaking}>
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
        categories={categories.filter(cat => cat.id !== 'all')}
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
    </SafeAreaWrapper>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitBanner: {
    backgroundColor: theme.error || '#EF4444',
    padding: 8,
    width: '100%',
  },
  limitBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginHorizontal: 8,
  },
  limitBannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  limitBannerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  customRecentButton: {
    borderColor: theme.primary,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
  },
  customIcon: {
    marginRight: 5,
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
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputActionButton: {
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
  helpButton: {
    padding: 8,
  },
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  landscapeLeft: {
    width: 120, // Fixed narrow width for categories
    borderRightWidth: 1,
    borderRightColor: theme.border,
    backgroundColor: theme.card,
  },
  categoriesContainerLandscape: {
    flex: 1,
    paddingVertical: 10,
  },
  categoriesListLandscape: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addCategoryButtonLandscape: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    padding: 6,
    borderRadius: 8,
    backgroundColor: theme.card,
    width: 80,
    height: 50,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCategoryButtonLandscape: {
    backgroundColor: theme.primary,
  },
  categoryTextLandscape: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.text,
    marginTop: 2,
    textAlign: 'center',
    lineHeight: 12,
  },
  landscapeRight: {
    flex: 1,
    backgroundColor: theme.background,
  },
  recentContainerLandscape: {
    marginTop: 15,
    paddingHorizontal: 20,
  },
  sectionTitleSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  recentScrollViewLandscape: {
    paddingBottom: 8,
  },
  recentButtonSmall: {
    backgroundColor: theme.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    maxWidth: 150,
    borderWidth: 1,
    borderColor: theme.border,
  },
  recentTextSmall: {
    color: theme.text,
    fontSize: 12,
  },
  phrasesContainerLandscape: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 15,
  },
  portraitContainer: {
    flex: 1,
  },
  categoryButtonLandscape: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    padding: 6,
    borderRadius: 8,
    backgroundColor: theme.card,
    width: 80,
    height: 50,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  addCategoryTextLandscapeStyle: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.primary,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default AACBoardScreen; 