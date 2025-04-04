import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
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
import AdvancedFilterModal, { FilterParams } from '../../components/VoiceSearch/AdvancedFilterModal';
import SelectedFiltersCard from '../../components/VoiceSearch/SelectedFiltersCard';
import VoiceDetailModal from '../../components/VoiceCollection/VoiceDetailModal';
import SelectedVoiceCard from '../../components/VoiceCollection/SelectedVoiceCard';
import { useToast } from '../../components/UI/ToastProvider';

// Hooks and Services
import { useVoiceSettings } from '../../hooks/useVoiceSettings';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { Voice } from '../../services/ttsService';
import { voiceSettingsService } from '../../services/voiceSettingsService';
import { apiService } from '../../services/apiService';

// Voice provider options
const VOICE_PROVIDERS = [
  { id: 'all', name: 'All Providers' },
  { id: 'ELEVENLABS', name: 'ElevenLabs' },
  { id: 'OPENAI', name: 'OpenAI' }
];

// Language options
const LANGUAGES = [
  { id: 'all', name: 'All Languages' },
  { id: 'en', name: 'English' },
  { id: 'fr', name: 'French' },
  { id: 'es', name: 'Spanish' },
  { id: 'de', name: 'German' },
  { id: 'it', name: 'Italian' },
  { id: 'ja', name: 'Japanese' }
];

// Gender options
const GENDERS = [
  { id: 'all', name: 'All Genders' },
  { id: 'male', name: 'Male' },
  { id: 'female', name: 'Female' },
  { id: 'neutral', name: 'Neutral' }
];

const VoiceCollectionScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);

  // Tab state (using simple toggle instead of TabView)
  const [showFavorites, setShowFavorites] = useState(false);
  
  // Filter states - keep these as they're used by the advanced filter
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Advanced filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterParams>({});
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Voice[]>([]);

  // Voice hooks
  const { 
    userSettings, 
    availableVoices, 
    loadingVoices, 
    error, 
    toggleFavoriteVoice,
    refreshSettings,
    updateVoiceSettings,
    favoriteVoices,
    searchVoices
  } = useVoiceSettings();
  
  const { speak, isLoading: isSpeaking, stopSpeaking, previewVoice } = useTextToSpeech();
  
  // Local states for voice playback
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [combinedVoices, setCombinedVoices] = useState<Voice[]>([]);
  const [favoriteOperation, setFavoriteOperation] = useState<{voiceId: string, loading: boolean} | null>(null);

  // Modal state for voice details
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { showToast } = useToast();

  const styles = makeStyles(theme);

  // Combine available voices with favorites that might not be in the main list
  useEffect(() => {
    const processVoices = async () => {
      // If we have search results, use those instead and return early
      if (searchResults.length > 0 && !showFavorites) {
        console.log('Using search results:', searchResults.length);
        setCombinedVoices(searchResults);
        return;
      }
      
      // Create a copy of the available voices
      const voices = [...availableVoices];
      
      // If we have favorites data from the API
      if (userSettings?.favorites?.voices?.length && favoriteVoices?.length) {
        console.log(`Processing ${favoriteVoices.length} favorites from API`);
        
        // Check if any favorite is missing from available voices
        for (const favorite of favoriteVoices) {
          const exists = voices.some(voice => voice.id === favorite.voiceId);
          
          if (!exists) {
            console.log(`Creating Voice object for missing favorite: ${favorite.voiceId} - ${favorite.voiceName}`);
            
            // Create a Voice object from the favorite data
            const favoriteVoice: Voice = {
              id: favorite.voiceId,
              name: favorite.voiceName,
              provider: favorite.voiceProvider === 'ELEVEN_LABS' ? 'ELEVENLABS' : favorite.voiceProvider as any,
              language: 'English', // Default if not provided
              previewUrl: favorite.previewUrl,
              // Use any additional data from labels if available
              gender: favorite.labels?.gender === 'male' ? 'male' : 
                     favorite.labels?.gender === 'female' ? 'female' : 'neutral'
            };
            
            // Add to the voices array
            voices.push(favoriteVoice);
          }
        }
        
        // Update the combined voices
        setCombinedVoices(voices);
      } else {
        // If no favorites or userSettings, just use available voices
        setCombinedVoices(availableVoices);
      }
    };
    
    processVoices();
  }, [availableVoices, userSettings?.favorites?.voices, favoriteVoices, searchResults, showFavorites]);

  // Generic search handler that uses the current filter states
  const handleSearch = async () => {
    if (showFavorites) {
      // In favorites tab, no need to search - just refresh
      return;
    }
    
    // Reset pagination and clear previous results
    setPage(0);
    setSearchResults([]);
    
    // Set search state
    setIsSearching(true);
    
    try {
      // Build query params from all filter states
      const params: any = {};
      
      // Include advanced filters
      Object.keys(advancedFilters).forEach(key => {
        params[key] = advancedFilters[key as keyof FilterParams];
      });
      
      // Add basic filters if they're not in advanced filters
      if (!params.provider && selectedProvider !== 'all') {
        params.provider = selectedProvider;
      }
      
      if (!params.language && selectedLanguage !== 'all') {
        params.language = selectedLanguage;
      }
      
      if (!params.gender && selectedGender !== 'all') {
        params.gender = selectedGender;
      }
      
      // Always include search query if it exists
      if (searchQuery && !params.search) {
        params.search = searchQuery;
      }
      
      // Add a cache buster to prevent caching
      params._ = new Date().getTime();
      
      console.log('Searching with params:', params);
      
      // Execute search with service
      const result = await searchVoices(params);
      
      // Verify each voice has a unique ID to avoid duplicate key warnings
      const uniqueVoices = ensureUniqueIds(result.voices || []);
      
      // Important: Set combinedVoices to empty array first to force a re-render
      setCombinedVoices([]);
      
      // Update results
      setSearchResults(uniqueVoices);
      setHasMoreResults(result.hasMore || false);
      
      // Log the results for debugging
      console.log(`Search returned ${uniqueVoices.length} voices, hasMore: ${result.hasMore}`);
      
      // If search returned no results, make sure we show the no results message
      if (!uniqueVoices.length) {
        console.log('No voices found for search criteria');
      }
    } catch (error) {
      console.error('Error searching voices:', error);
      Alert.alert(t('general.error'), t('voice.collection.searchError'));
    } finally {
      // Always reset search state
      setIsSearching(false);
    }
  };

  // Load more results when reaching the end of the list
  const handleLoadMore = useCallback(() => {
    if (hasMoreResults && !isSearching && !showFavorites && searchResults.length > 0) {
      // Increment page
      const nextPage = page + 1;
      setPage(nextPage);
      
      // Execute search with the next page
      handleLoadMoreSearch(nextPage);
    }
  }, [hasMoreResults, isSearching, showFavorites, searchResults.length, page]);
  
  // Search handler specifically for loading more results
  const handleLoadMoreSearch = async (currentPage: number) => {
    if (showFavorites) return;
    
    // Set search state
    setIsSearching(true);
    
    try {
      // Build query params from all filter states
      const params: any = {
        page: currentPage,
        page_size: 20
      };
      
      // Include advanced filters
      Object.keys(advancedFilters).forEach(key => {
        params[key] = advancedFilters[key as keyof FilterParams];
      });
      
      // Add basic filters if they're not in advanced filters
      if (!params.provider && selectedProvider !== 'all') {
        params.provider = selectedProvider;
      }
      
      if (!params.language && selectedLanguage !== 'all') {
        params.language = selectedLanguage;
      }
      
      if (!params.gender && selectedGender !== 'all') {
        params.gender = selectedGender;
      }
      
      // Always include search query if it exists
      if (searchQuery && !params.search) {
        params.search = searchQuery;
      }
      
      // Add a cache buster to prevent caching
      params._ = new Date().getTime();
      
      console.log('Loading more with params:', params);
      
      // Execute search with service
      const result = await searchVoices(params);
      
      // Verify each voice has a unique ID and doesn't already exist in our results
      const newVoices = result.voices || [];
      const existingIds = new Set(searchResults.map(voice => voice.id));
      const uniqueNewVoices = newVoices
        .filter(voice => !existingIds.has(voice.id))
        .map((voice, index) => ({
          ...voice,
          // Add a unique identifier for pagination
          id: voice.id + (voice.id.includes('_page') ? '' : `_page${currentPage}_${index}`)
        }));
      
      // Append to existing results
      setSearchResults(prevResults => [...prevResults, ...uniqueNewVoices]);
      setHasMoreResults(result.hasMore || false);
      
      // Log the results for debugging
      console.log(`Load more returned ${uniqueNewVoices.length} additional voices, hasMore: ${result.hasMore}`);
    } catch (error) {
      console.error('Error loading more voices:', error);
    } finally {
      // Always reset search state
      setIsSearching(false);
    }
  };

  // Utility function to ensure each voice has a unique ID
  const ensureUniqueIds = (voices: Voice[]): Voice[] => {
    const idMap = new Map<string, number>();
    
    return voices.map(voice => {
      // If this ID already exists, create a unique version
      if (idMap.has(voice.id)) {
        const count = idMap.get(voice.id)! + 1;
        idMap.set(voice.id, count);
        
        // Create a new voice object with a unique ID
        return {
          ...voice,
          id: `${voice.id}_${count}`
        };
      } else {
        // Track this ID
        idMap.set(voice.id, 1);
        return voice;
      }
    });
  };

  // Clear search results when switching to favorites tab
  useEffect(() => {
    if (showFavorites) {
      setSearchResults([]);
    }
  }, [showFavorites]);

  // Filter voices based on selected criteria - only used for favorites tab
  const getFilteredVoices = useCallback(() => {
    // When on favorites tab, only return voices that are in user favorites
    if (showFavorites) {
      // Get favorite voice IDs from userSettings
      const favoriteIds = userSettings?.favorites?.voices || [];
      
      // Return only voices that are in the favorites list
      return combinedVoices.filter(voice => favoriteIds.includes(voice.id));
    }
    
    // Otherwise return full list (for when no search is active)
    return combinedVoices;
  }, [combinedVoices, userSettings?.favorites?.voices, showFavorites]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Always refresh settings to get latest favorites/voices
      await refreshSettings();
      
      // If we're in search mode, refresh the search
      if (!showFavorites && (searchQuery !== '' || Object.keys(advancedFilters).length > 0 || 
          selectedProvider !== 'all' || selectedGender !== 'all' || selectedLanguage !== 'all')) {
        await handleSearch();
      }
    } catch (err) {
      console.error("Failed to refresh:", err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshSettings, handleSearch, showFavorites, searchQuery, advancedFilters, 
      selectedProvider, selectedGender, selectedLanguage]);

  // Stop any speech when unmounting
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Update playingVoiceId when speech stops
  useEffect(() => {
    if (!isSpeaking && playingVoiceId) {
      setPlayingVoiceId(null);
    }
  }, [isSpeaking, playingVoiceId]);

  // Refresh the filtered voices based on current settings
  const refreshFilteredVoices = useCallback(() => {
    // Get the filtered voices using the current filter settings
    const filteredVoices = getFilteredVoices();
    
    // Update combined voices
    setCombinedVoices(filteredVoices);
    
    // Reset loading states
    setIsSearching(false);
    setRefreshing(false);
  }, [getFilteredVoices, setCombinedVoices, setIsSearching, setRefreshing]);

  const playVoiceSample = async (voice: Voice) => {
    try {
      // Always stop current speech first
      stopSpeaking();
      
      // If we're already playing this voice, just stop (we already called stopSpeaking)
      console.log('playingVoiceId', playingVoiceId);
      console.log('voice.id', voice.id);
      if (playingVoiceId === voice.id) {
        setPlayingVoiceId(null);
        return;
      }
      
      // Otherwise, play the new voice
      setPlayingVoiceId(voice.id);
      
      // Use previewVoice instead of speak for samples
      // Pass the publicOwnerId and voiceName for shared voices
      await previewVoice(
        voice.id, 
        voice.provider, 
        voice.public_owner_id || voice.publicOwnerId, 
        voice.name,
        voice.language || voice.languageCode
      );
    } catch (error) {
      console.error('Failed to play voice sample', error);
      setPlayingVoiceId(null);
    }
  };

  const handleToggleFavorite = async (voice: Voice) => {
    // Only use API favorites (from userSettings.favorites.voices), not the voice.isFavorite property
    const isFavorite = !userSettings?.favorites?.voices?.includes(voice.id);
    
    try {
      // Show a loading indicator
      setFavoriteOperation({ voiceId: voice.id, loading: true });
      
      // Show a loading indicator or feedback to the user
      if (isFavorite) {
        // Adding to favorites
        console.log(`Adding voice to favorites: ${voice.id} (${voice.name})`);
      } else {
        // Removing from favorites
        console.log(`Removing voice from favorites: ${voice.id} (${voice.name})`);
      }
      
      // Gather all available metadata from the voice object
      const voiceDetails = {
        gender: voice.gender,
        accent: voice.accent,
        age: voice.age,
        use_case: voice.use_case,
        description: voice.description,
        publicOwnerId: voice.publicOwnerId || voice.public_owner_id,
        previewUrl: voice.previewUrl
      };
      
      // Call the toggleFavoriteVoice hook function with all metadata
      // The hook already handles state updates even if the API call fails
      await toggleFavoriteVoice(voice.id, isFavorite, voice.name, voiceDetails);
    } catch (error) {
      console.error('Failed to toggle favorite', error);
      
      // If adding a favorite failed and we're using a custom voice, try a direct approach
      if (isFavorite) {
        try {
          // Check if we can get the voice details directly
          const voiceDetails = await checkVoiceDetails(voice.id);
          
          if (voiceDetails) {
            Alert.alert(
              t('voice.collection.retryFavorite'),
              t('voice.collection.retryFavoriteMessage'),
              [
                {
                  text: t('general.cancel'),
                  style: 'cancel'
                },
                {
                  text: t('general.retry'),
                  onPress: async () => {
                    try {
                      setFavoriteOperation({ voiceId: voice.id, loading: true });
                      
                      // Create a manual favorite request with the details we found
                      const favoriteRequest = {
                        voiceId: voice.id,
                        voiceName: voiceDetails.name || voice.name, // Use voice.name as fallback
                        voiceProvider: 'ELEVEN_LABS',
                        publicOwnerId: voiceDetails.publicOwnerId,
                        labels: {
                          gender: voiceDetails.gender || 'neutral',
                          accent: voiceDetails.accent || 'american',
                          age: voiceDetails.age || 'young',
                          use_case: voiceDetails.use_case || 'general'
                        }
                      };
                      
                      console.log('Directly adding favorite with manual data:', favoriteRequest);
                      await apiService.post('/api/favorites', favoriteRequest);
                      
                      // Refresh the favorites list
                      await refreshSettings();
                      
                      // Show success message
                      Alert.alert(
                        t('general.success'),
                        t('voice.collection.favoriteAdded', { name: voiceDetails.name })
                      );
                    } catch (retryError) {
                      console.error('Failed to add favorite on retry:', retryError);
                      Alert.alert(
                        t('general.error'),
                        t('voice.collection.errorAddingFavorite', { 
                          error: retryError instanceof Error ? retryError.message : String(retryError) 
                        })
                      );
                    } finally {
                      setFavoriteOperation(null);
                    }
                  }
                }
              ]
            );
            return; // Exit early, we'll handle this via the alert
          }
        } catch (checkError) {
          console.error('Failed to check voice details:', checkError);
        }
      }
      
      // Show a more detailed error message to help diagnose issues
      Alert.alert(
        t('general.error'), 
        isFavorite ? 
          t('voice.collection.errorAddingFavorite', { error: error instanceof Error ? error.message : String(error) }) :
          t('voice.collection.errorRemovingFavorite', { error: error instanceof Error ? error.message : String(error) })
      );
    } finally {
      // Hide the loading indicator
      setFavoriteOperation(null);
    }
  };

  const handleSelectVoice = async (voice: Voice) => {
    if (!userSettings?.voiceSettings) return;
    
    try {
      await updateVoiceSettings({
        ...userSettings.voiceSettings,
        provider: voice.provider,
        voiceId: voice.id
      });
      
      // Show success toast instead of alert
      showToast(t('voice.actions.voiceSelected', { name: voice.name }), 'success', 2000);
    } catch (err) {
      // Show error toast
      showToast(t('voice.actions.errorSelectingVoice'), 'error', 3000);
    }
  };

  // Render voice item with updated UI
  const renderVoiceItem = ({ item }: { item: Voice }) => {
    // Only use API favorites (from userSettings.favorites.voices), not the item.isFavorite property
    const isFavorite = userSettings?.favorites?.voices?.includes(item.id);
    const isSelected = userSettings?.voiceSettings?.voiceId === item.id;
    const isPlaying = playingVoiceId === item.id;
    const isFavoriteLoading = favoriteOperation?.voiceId === item.id && favoriteOperation.loading;
    
    // Generate avatar URL or placeholder
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=4A6FEA&color=fff`;
    
    // Get translated values for display
    const getTranslatedUseCase = (useCase?: string) => {
      if (!useCase) return t('general.general');
      return t(`voice.metadata.useCase.${useCase}`, useCase.charAt(0).toUpperCase() + useCase.slice(1));
    };

    const getTranslatedAccent = (accent?: string) => {
      if (!accent) return null;
      return t(`voice.metadata.accent.${accent}`, accent.charAt(0).toUpperCase() + accent.slice(1));
    };
    
    return (
      <TouchableOpacity 
        style={[
          styles.voiceCard,
          isSelected && {
            borderColor: theme.primary,
            borderWidth: 2,
            backgroundColor: theme.primary + '08',
          }
        ]}
        onPress={() => {
          setSelectedVoice(item);
          setShowDetailModal(true);
        }}
      >
        <View style={styles.voiceCardHeader}>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
              <Text style={styles.selectedText}>{t('voice.actions.currentVoice')}</Text>
            </View>
          )}
          <Image source={{ uri: avatarUrl }} style={styles.voiceAvatar} />
          <View style={styles.voiceInfo}>
            <Text style={styles.voiceName}>{item.name}</Text>
            <Text style={styles.voiceProvider}>
              {getTranslatedUseCase(item.use_case)}
            </Text>
            <View style={styles.voiceLanguageContainer}>
              <Text style={styles.voiceLanguage}>{item.language || 'English'}</Text>
              {item.gender && (
                <View style={styles.genderBadge}>
                  <Ionicons 
                    name={item.gender === 'male' ? 'male' : item.gender === 'female' ? 'female' : 'person'} 
                    size={12} 
                    color="#FFFFFF" 
                  />
                </View>
              )}
              {item.accent && (
                <View style={styles.accentBadge}>
                  <Text style={styles.accentText}>{getTranslatedAccent(item.accent)}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the parent touchable
              handleToggleFavorite(item);
            }}
            disabled={isFavoriteLoading}
          >
            {isFavoriteLoading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? theme.error : theme.text}
              />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.voiceCardFooter}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the parent touchable
              playVoiceSample(item);
            }}
            disabled={isSpeaking && playingVoiceId !== item.id}
          >
            {isPlaying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="play" size={16} color="#FFFFFF" />
            )}
            <Text style={styles.playButtonText}>
              {isPlaying ? t('general.loading') : t('voice.actions.preview')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.selectButton, 
              isSelected && {
                backgroundColor: theme.primary,
                borderColor: theme.primary
              }
            ]}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the parent touchable
              handleSelectVoice(item);
            }}
          >
            <Text style={[
              styles.selectButtonText, 
              isSelected && { color: '#FFFFFF' }
            ]}>
              {isSelected ? t('voice.actions.selected') : t('voice.actions.select')}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Clear a specific filter
  const handleClearFilter = useCallback((key: keyof FilterParams) => {
    // Create a new filters object without the specified key
    const updatedFilters = { ...advancedFilters };
    delete updatedFilters[key];
    
    // Also reset the main filter states if applicable
    if (key === 'provider') {
      setSelectedProvider('all');
    } else if (key === 'gender') {
      setSelectedGender('all');
    } else if (key === 'language') {
      setSelectedLanguage('all');
    } else if (key === 'search') {
      setSearchQuery('');
    }
    
    setAdvancedFilters(updatedFilters);
    handleSearch();
  }, [advancedFilters, setSelectedProvider, setSelectedGender, setSelectedLanguage, setSearchQuery, handleSearch]);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setAdvancedFilters({});
    setSelectedProvider('all');
    setSelectedGender('all');
    setSelectedLanguage('all');
    setSearchQuery('');
    handleSearch();
  }, [setAdvancedFilters, setSelectedProvider, setSelectedGender, setSelectedLanguage, setSearchQuery, handleSearch]);

  // Apply filters from the modal
  const handleApplyFilters = useCallback((filters: FilterParams) => {
    setAdvancedFilters(filters);
    if (filters.provider) {
      setSelectedProvider(filters.provider);
    }
    if (filters.gender) {
      setSelectedGender(filters.gender);
    }
    if (filters.language) {
      setSelectedLanguage(filters.language);
    }
    if (filters.search !== undefined) {
      setSearchQuery(filters.search);
    }
    handleSearch();
  }, [setAdvancedFilters, setSelectedProvider, setSelectedGender, setSelectedLanguage, setSearchQuery, handleSearch]);

  // Render footer component
  const renderFooter = useCallback(() => {
    if (loadingVoices) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color={theme.text} />
        </View>
      );
    }
    return null;
  }, [loadingVoices, theme.text]);

  // Memoized header component
  const ListHeaderComponent = useCallback(() => {
    const currentVoice = (showFavorites ? getFilteredVoices() : (searchResults.length > 0 ? searchResults : combinedVoices))
      .find(voice => voice.id === userSettings?.voiceSettings?.voiceId);

    if (!currentVoice) return null;
    
    return (
      <>
        <View style={styles.voiceSectionHeader}>
          <Text style={[styles.voiceSectionTitle, { color: theme.text }]}>
            {t('voice.collection.currentVoice')}
          </Text>
        </View>
        <SelectedVoiceCard
          voice={currentVoice}
          theme={theme}
          onChangeVoice={() => {
            setSelectedVoice(currentVoice);
            setShowDetailModal(true);
          }}
        />
        <View style={styles.voiceSectionHeader}>
          <Text style={[styles.voiceSectionTitle, { color: theme.text }]}>
            {t('voice.collection.allVoices')}
          </Text>
        </View>
      </>
    );
  }, [
    showFavorites,
    searchResults,
    combinedVoices,
    userSettings?.voiceSettings?.voiceId,
    theme,
    t,
    getFilteredVoices,
    setSelectedVoice,
    setShowDetailModal
  ]);

  // Voice list component
  const renderVoiceList = useCallback(() => {
    const displayVoices = showFavorites ? getFilteredVoices() : (searchResults.length > 0 ? searchResults : combinedVoices);
    
    // Remove the selected voice from the list if it exists
    const otherVoices = displayVoices.filter(voice => voice.id !== userSettings?.voiceSettings?.voiceId);
    
    if ((loadingVoices || refreshing) && !isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>{t('general.loading')}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
          <Text style={styles.errorText}>{t('general.error')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>{t('general.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (displayVoices.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="mic-off-outline" size={48} color={theme.text} />
          <Text style={styles.emptyText}>
            {showFavorites 
              ? t('voice.collection.noFavorites') 
              : isSearching 
                ? t('voice.collection.searching')
                : searchQuery || Object.keys(advancedFilters).length > 0 || selectedProvider !== 'all' || selectedGender !== 'all' || selectedLanguage !== 'all'
                  ? t('voice.collection.noSearchResults')
                  : t('voice.collection.noVoicesFound')}
          </Text>
          {showFavorites && (
            <Text style={styles.emptySubText}>
              {t('voice.collection.addFavoritesHint')}
            </Text>
          )}
          {!showFavorites && (searchQuery !== '' || Object.keys(advancedFilters).length > 0) && (
            <TouchableOpacity style={styles.retryButton} onPress={handleClearAllFilters}>
              <Text style={styles.retryButtonText}>
                {t('voice.collection.clearSearch')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={otherVoices}
        renderItem={renderVoiceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.voiceList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={renderFooter}
        extraData={[
          searchResults.length,
          combinedVoices.length,
          showFavorites,
          userSettings?.voiceSettings?.voiceId
        ]}
      />
    );
  }, [
    showFavorites,
    getFilteredVoices,
    searchResults,
    combinedVoices,
    userSettings?.voiceSettings?.voiceId,
    loadingVoices,
    refreshing,
    isSearching,
    theme,
    t,
    renderVoiceItem,
    onRefresh,
    handleLoadMore,
    ListHeaderComponent,
    renderFooter,
    handleClearFilter,
    handleClearAllFilters
  ]);

  // Additional function to handle checking voice details
  const checkVoiceDetails = useCallback(async (voiceId: string) => {
    try {
      // This is a fallback method to check voice details directly from the API
      // when there's a failure with the standard methods
      const response = await apiService.get<{ voices: any[] }>(
        `/api/shared-voices?voice_id=${voiceId}`
      );
      
      const voice = response.voices?.find(v => v.voice_id === voiceId);
      if (voice) {
        console.log('Found voice details:', {
          id: voice.voice_id,
          name: voice.name,
          publicOwnerId: voice.public_owner_id
        });
        
        return {
          id: voice.voice_id,
          name: voice.name,
          publicOwnerId: voice.public_owner_id,
          gender: voice.gender,
          accent: voice.accent,
          age: voice.age,
          use_case: voice.use_case
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to check voice details:', error);
      return null;
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('voice.collection.title')}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.fullSearchBtn}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="search" size={20} color={theme.text + '80'} style={styles.searchIcon} />
          <Text 
            style={[
              styles.searchInput, 
              searchQuery ? styles.searchInputWithText : styles.searchInputPlaceholder
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {searchQuery || t('voice.collection.searchPlaceholder')}
          </Text>
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              handleClearFilter('search');
            }} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={theme.text + '80'} />
            </TouchableOpacity>
          )}
          {!searchQuery && (
            <Ionicons name="options-outline" size={18} color={theme.text + '60'} style={styles.filterIcon} />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={() => {
            // Reset pagination
            setPage(0);
            // Clear existing search results
            setSearchResults([]);
            // Show loading state
            setIsSearching(true);
            
            // Build a clean params object from current filters
            const cleanParams: any = {
              _: new Date().getTime() // Add cache buster
            };
            
            // Include advanced filters
            Object.keys(advancedFilters).forEach(key => {
              cleanParams[key] = advancedFilters[key as keyof FilterParams];
            });
            
            // Add basic filters if they're not in advanced filters
            if (!cleanParams.provider && selectedProvider !== 'all') {
              cleanParams.provider = selectedProvider;
            }
            
            if (!cleanParams.language && selectedLanguage !== 'all') {
              cleanParams.language = selectedLanguage;
            }
            
            if (!cleanParams.gender && selectedGender !== 'all') {
              cleanParams.gender = selectedGender;
            }
            
            // Always include search query if it exists
            if (searchQuery && !cleanParams.search) {
              cleanParams.search = searchQuery;
            }
            
            console.log('Search button pressed with params:', cleanParams);
            
            // If we're in favorites tab, switch to all voices
            if (showFavorites) {
              setShowFavorites(false);
            }
            
            // Execute search directly
            searchVoices(cleanParams)
              .then(result => {
                // Process results as normal
                const uniqueVoices = ensureUniqueIds(result.voices || []);
                setSearchResults(uniqueVoices);
                setHasMoreResults(result.hasMore || false);
                console.log(`Search returned ${uniqueVoices.length} voices, hasMore: ${result.hasMore}`);
              })
              .catch(error => {
                console.error('Error in search button press:', error);
                Alert.alert(t('general.error'), t('voice.collection.searchError'));
              })
              .finally(() => {
                setIsSearching(false);
              });
          }}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="search" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Selected Filters Card */}
      {(searchQuery !== '' || Object.keys(advancedFilters).length > 0 || 
        selectedProvider !== 'all' || selectedGender !== 'all' || selectedLanguage !== 'all') && (
        <SelectedFiltersCard
          filters={{
            ...(searchQuery !== '' && { search: searchQuery }),
            ...(selectedProvider !== 'all' && { provider: selectedProvider }),
            ...(selectedGender !== 'all' && { gender: selectedGender }),
            ...(selectedLanguage !== 'all' && { language: selectedLanguage }),
            ...advancedFilters
          }}
          onClearFilter={handleClearFilter}
          onClearAll={handleClearAllFilters}
          theme={theme}
        />
      )}
      
      {/* Simple tab buttons instead of TabView */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabButton, !showFavorites && styles.activeTab]} 
          onPress={() => setShowFavorites(false)}
        >
          <Text style={[styles.tabLabel, !showFavorites && styles.activeTabLabel]}>
            {t('voice.collection.all')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, showFavorites && styles.activeTab]} 
          onPress={() => {
            setShowFavorites(true);
            // Clear search results when switching to favorites
            if (searchResults.length > 0) {
              setSearchResults([]);
            }
          }}
        >
          <Text style={[styles.tabLabel, showFavorites && styles.activeTabLabel]}>
            {t('voice.collection.favorites')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content area */}
      <View style={styles.contentContainer}>
        {renderVoiceList()}
      </View>
      
      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={{
          search: searchQuery,
          provider: selectedProvider,
          gender: selectedGender,
          language: selectedLanguage,
          ...advancedFilters
        }}
        theme={theme}
      />

      {/* Voice Detail Modal */}
      <VoiceDetailModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        voice={selectedVoice}
        onToggleFavorite={handleToggleFavorite}
        onSelectVoice={handleSelectVoice}
        isFavorite={selectedVoice ? userSettings?.favorites?.voices?.includes(selectedVoice.id) || false : false}
        isSelected={selectedVoice ? userSettings?.voiceSettings?.voiceId === selectedVoice.id : false}
        theme={theme}
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
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    paddingHorizontal: 12,
  },
  fullSearchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    fontSize: 16,
  },
  searchInputWithText: {
    color: theme.text,
    fontWeight: '400',
  },
  searchInputPlaceholder: {
    color: theme.text + '50',
    fontWeight: '300',
  },
  clearButton: {
    padding: 8,
  },
  filterIcon: {
    marginLeft: 8,
    marginRight: 4,
  },
  filterButton: {
    backgroundColor: theme.primary,
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  contentContainer: {
    flex: 1,
  },
  voiceList: {
    padding: 10,
  },
  voiceCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  voiceCardSelected: {
    borderColor: theme.primary,
    borderWidth: 2,
    shadowColor: theme.primary,
    shadowOpacity: 0.2,
  },
  voiceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 2,
  },
  voiceProvider: {
    fontSize: 14,
    color: theme.text + '80',
    marginBottom: 4,
  },
  voiceLanguageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceLanguage: {
    fontSize: 12,
    color: theme.text + '60',
    backgroundColor: theme.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  genderBadge: {
    marginLeft: 6,
    backgroundColor: theme.text + '60',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    padding: 8,
  },
  voiceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectButtonSelected: {
    backgroundColor: theme.primary + '20',
  },
  selectButtonText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectButtonTextSelected: {
    color: theme.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: theme.text,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: theme.error,
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    color: theme.text,
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 8,
    color: theme.text + '80',
    fontSize: 14,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: theme.primary,
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  loadMoreText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.background,
  },
  searchResultsText: {
    color: theme.text,
    fontSize: 14,
  },
  clearSearchButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  clearSearchButtonText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  advancedFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary + '10',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  advancedFiltersText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.primary,
    marginLeft: 4,
  },
  expandFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary + '15',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: theme.primary + '30',
  },
  expandFiltersText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.primary,
  },
  tabLabel: {
    fontSize: 16,
    color: theme.text,
  },
  activeTabLabel: {
    color: theme.primary,
    fontWeight: 'bold',
  },
  accentBadge: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentText: {
    color: theme.text + '90',
    fontSize: 10,
    fontWeight: '500',
  },
  selectedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 1,
  },
  selectedText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  voiceSectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  voiceSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
});

export default VoiceCollectionScreen; 