import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { ScreenHeader } from '../../components/UI/ScreenHeader';
import PremiumBadge from '../../components/UI/PremiumBadge';
import UpgradePrompt from '../../components/UI/UpgradePrompt';
import { TutorialTarget } from '../../components/Tutorial/TutorialTarget';

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

// Custom hook to get the previous value of a prop or state
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const VoiceCollectionScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);

  // Tab state - now supporting three tabs
  type TabType = 'default' | 'all' | 'favorites';
  const [activeTab, setActiveTab] = useState<TabType>('default');
  
  // Filter states - only used for "All Voices" tab
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Advanced filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterParams>({});
  
  // Pagination states - only for "All Voices" tab
  const [page, setPage] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Voice[]>([]);

  // Voice hooks
  const {
    userSettings,
    availableVoices,
    favoriteVoices,
    loadingVoices,
    refreshSettings,
    searchVoices,
    toggleFavoriteVoice,
    profileData,
    fetchProfileData,
    updateVoiceSettings,
    // Voice access control methods
    canPreviewVoice,
    canSelectVoice,
    getVoiceAccess
  } = useVoiceSettings();
  
  const { speak, isLoading: ttsLoading, isPlaying: ttsPlaying, stopSpeaking, previewVoice } = useTextToSpeech();
  
  // Previous TTS states
  const prevTtsLoading = usePrevious(ttsLoading);
  const prevTtsPlaying = usePrevious(ttsPlaying);
  
  // Local states for voice playback
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [combinedVoices, setCombinedVoices] = useState<Voice[]>([]);
  const [favoriteOperation, setFavoriteOperation] = useState<{voiceId: string, loading: boolean} | null>(null);
  
  // Track voices in loading/playing state - this will stay true from click until sound finishes
  const [loadingVoiceIds, setLoadingVoiceIds] = useState<Set<string>>(new Set());
  
  // Separate state for each tab's voices
  const [defaultVoices, setDefaultVoices] = useState<Voice[]>([]);
  const [allVoices, setAllVoices] = useState<Voice[]>([]);
  const [favoriteVoicesList, setFavoriteVoicesList] = useState<Voice[]>([]);
  
  // Modal state for voice details
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { showToast } = useToast();

  const styles = makeStyles(theme);

  // Helper functions to manage loading states
  const addVoiceToLoading = useCallback((voiceId: string) => {
    console.log('Adding voice to loading state:', voiceId);
    setLoadingVoiceIds(prev => {
      const newSet = new Set(prev);
      newSet.add(voiceId);
      return newSet;
    });
  }, []);
  
  const removeVoiceFromLoading = useCallback((voiceId: string) => {
    console.log('Removing voice from loading state:', voiceId);
    setLoadingVoiceIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(voiceId);
      return newSet;
    });
  }, []);

  // At the start of your component, add a useEffect to fetch profile data if needed
  useEffect(() => {
    // If we don't have profile data yet, fetch it
    if (!profileData) {
      fetchProfileData();
    }
  }, [profileData, fetchProfileData]);

  // Add state to track when we're intentionally clearing search
  const [isIntentionallyClearingSearch, setIsIntentionallyClearingSearch] = useState(false);

  // Combine available voices with favorites that might not be in the main list
  useEffect(() => {
    const processVoices = async () => {
      // If we're intentionally clearing search results, skip processing
      if (isIntentionallyClearingSearch) {
        console.log('🚫 Intentionally clearing search - skipping voice processing');
        return;
      }
      
      // Handle each tab separately
      switch (activeTab) {
        case 'default':
          // Default tab: Only basic voices from voice-settings - NEVER affected by filters
          const basicVoices = availableVoices.filter(voice => !voice.isPremium && voice.accessLevel !== 'premium');
          console.log(`📋 Default tab: Using ${basicVoices.length} basic voices from voice-settings`);
          setCombinedVoices(basicVoices);
          break;
          
        case 'all':
          // All voices tab: Use search results if available, otherwise show all available voices
          if (searchResults.length > 0) {
            console.log('🔍 All tab: Using search results:', searchResults.length);
            setCombinedVoices(searchResults);
          } else {
            // Show all available voices when no search is active
            console.log(`📋 All tab: Using ${availableVoices.length} available voices`);
            setCombinedVoices(availableVoices);
          }
          break;
          
        case 'favorites':
          // Favorites tab: Only user's favorite voices - NEVER affected by filters
          const favoriteIds = userSettings?.favorites?.voices || [];
          const userFavoriteVoices = availableVoices.filter(voice => favoriteIds.includes(voice.id));
          
          // Add any missing favorites from the favoriteVoices data
          if (favoriteVoices?.length) {
            for (const favorite of favoriteVoices) {
              const exists = userFavoriteVoices.some(voice => voice.id === favorite.voiceId);
              
              if (!exists) {
                const favoriteVoice: Voice = {
                  id: favorite.voiceId,
                  name: favorite.voiceName,
                  provider: favorite.voiceProvider === 'ELEVEN_LABS' ? 'ELEVENLABS' : favorite.voiceProvider as any,
                  language: 'English',
                  previewUrl: favorite.previewUrl,
                  gender: favorite.labels?.gender === 'male' ? 'male' : 
                         favorite.labels?.gender === 'female' ? 'female' : 'neutral'
                };
                
                userFavoriteVoices.push(favoriteVoice);
              }
            }
          }
          
          console.log(`❤️ Favorites tab: Using ${userFavoriteVoices.length} favorite voices`);
          setCombinedVoices(userFavoriteVoices);
          break;
      }
    };
    
    processVoices();
  }, [availableVoices, searchResults, activeTab, userSettings?.voiceSettings?.voiceId, 
      profileData?.voiceSettings?.selectedVoice?.id, isIntentionallyClearingSearch, 
      userSettings?.favorites?.voices, favoriteVoices]);

  // Generic search handler that uses the current filter states
  const handleSearch = useCallback(async () => {
    console.log('🔍 handleSearch called with current filter states:', {
      activeTab,
      advancedFilters,
      selectedProvider,
      selectedGender,
      selectedLanguage,
      searchQuery
    });
    
    if (activeTab === 'favorites') {
      // In favorites tab, no need to search - just refresh
      console.log('📝 In favorites tab, skipping search');
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
      
      console.log('🚀 Searching with params:', params);
      
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
      console.log(`✅ Search returned ${uniqueVoices.length} voices, hasMore: ${result.hasMore}`);
      
      // If search returned no results, make sure we show the no results message
      if (!uniqueVoices.length) {
        console.log('⚠️ No voices found for search criteria');
      }
    } catch (error) {
      console.error('❌ Error searching voices:', error);
      Alert.alert(t('general.error.title'), t('voice.collection.searchError'));
    } finally {
      // Always reset search state
      setIsSearching(false);
    }
  }, [activeTab, advancedFilters, selectedProvider, selectedGender, selectedLanguage, searchQuery, searchVoices, t]);

  // Load more results when reaching the end of the list
  const handleLoadMore = useCallback(() => {
    if (hasMoreResults && !isSearching && activeTab !== 'favorites' && searchResults.length > 0) {
      // Increment page
      const nextPage = page + 1;
      setPage(nextPage);
      
      // Execute search with the next page
      handleLoadMoreSearch(nextPage);
    }
  }, [hasMoreResults, isSearching, activeTab, searchResults.length, page]);
  
  // Search handler specifically for loading more results
  const handleLoadMoreSearch = async (currentPage: number) => {
    if (activeTab === 'favorites') return;
    
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
    if (activeTab === 'favorites') {
      setSearchResults([]);
    }
  }, [activeTab]);

  // Filter voices based on selected criteria - only used for favorites tab
  const getFilteredVoices = useCallback(() => {
    // When on favorites tab, only return voices that are in user favorites
    if (activeTab === 'favorites') {
      // Get favorite voice IDs from userSettings
      const favoriteIds = userSettings?.favorites?.voices || [];
      
      // Return only voices that are in the favorites list
      return combinedVoices.filter(voice => favoriteIds.includes(voice.id));
    }
    
    // Otherwise return full list (for when no search is active)
    return combinedVoices;
  }, [combinedVoices, userSettings?.favorites?.voices, activeTab]);

  // Clear a specific filter
  const handleClearFilter = useCallback((key: keyof FilterParams) => {
    console.log(`🎯 Clearing filter: ${key}`);
    console.log('Current filter states before clear:', {
      advancedFilters,
      selectedProvider,
      selectedGender,
      selectedLanguage,
      searchQuery
    });
    
    // Set flag to prevent unwanted searches during state updates
    setIsIntentionallyClearingSearch(true);
    
    // Create a new filters object without the specified key
    const updatedFilters = { ...advancedFilters };
    delete updatedFilters[key];
    
    // Reset the corresponding state based on the key
    switch (key) {
      case 'provider':
        setSelectedProvider('all');
        break;
      case 'gender':
        setSelectedGender('all');
        break;
      case 'language':
        setSelectedLanguage('all');
        break;
      case 'search':
        setSearchQuery('');
        break;
    }
    
    // Update advanced filters
    setAdvancedFilters(updatedFilters);
    
    // Check if any filters remain active
    const hasActiveFilters = Object.keys(updatedFilters).length > 0;
    
    console.log('Filter states after clear:', {
      updatedFilters,
      hasActiveFilters,
      selectedProvider: key === 'provider' ? 'all' : selectedProvider,
      selectedGender: key === 'gender' ? 'all' : selectedGender,
      selectedLanguage: key === 'language' ? 'all' : selectedLanguage,
      searchQuery: key === 'search' ? '' : searchQuery
    });
    
    if (!hasActiveFilters) {
      // No filters left, clear search results and return to basic voices
      console.log('✅ No filters left, clearing search results and returning to basic voices');
      setSearchResults([]);
      setPage(0);
      setHasMoreResults(false);
      setIsSearching(false);
      
      // Reset all filter states to ensure clean state
      setSelectedProvider('all');
      setSelectedGender('all');
      setSelectedLanguage('all');
      setSearchQuery('');
      setAdvancedFilters({});
      
      // Reset the flag after a brief delay to allow the useEffect to skip processing
      setTimeout(() => {
        setIsIntentionallyClearingSearch(false);
      }, 100);
    } else {
      // Still have filters, perform search with updated filters
      console.log('🔄 Still have filters, performing search with updated filters');
      
      // Create a clean params object with only the remaining filters
      const params: any = {
        _: new Date().getTime() // Add cache buster
      };
      
      // Only add filters that are actually active
      Object.keys(updatedFilters).forEach(filterKey => {
        if (updatedFilters[filterKey as keyof FilterParams] !== undefined) {
          params[filterKey] = updatedFilters[filterKey as keyof FilterParams];
        }
      });
      
      console.log('🔍 Searching with cleaned params:', params);
      
      // Reset the intentionally clearing flag before the search
      setIsIntentionallyClearingSearch(false);
      
      // Execute search with clean params
      searchVoices(params)
        .then(result => {
          const uniqueVoices = ensureUniqueIds(result.voices || []);
          setSearchResults(uniqueVoices);
          setHasMoreResults(result.hasMore || false);
          console.log(`✅ Search returned ${uniqueVoices.length} voices, hasMore: ${result.hasMore}`);
        })
        .catch(error => {
          console.error('❌ Error in search:', error);
          Alert.alert(t('general.error.title'), t('voice.collection.searchError'));
        })
        .finally(() => {
          setIsSearching(false);
        });
    }
  }, [advancedFilters, selectedProvider, selectedGender, selectedLanguage, searchQuery, searchVoices, ensureUniqueIds, t]);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    console.log('🧹 Clearing all filters');
    setAdvancedFilters({});
    setSelectedProvider('all');
    setSelectedGender('all');
    setSelectedLanguage('all');
    setSearchQuery('');
    // Set flag to prevent useEffect from overriding our clear action
    setIsIntentionallyClearingSearch(true);
    // Instead of calling handleSearch(), directly clear search results
    // This prevents race condition and lets the component fall back to basic voices
    setSearchResults([]);
    setPage(0);
    setHasMoreResults(false);
    setIsSearching(false);
    
    // Reset the flag after a brief delay
    setTimeout(() => {
      setIsIntentionallyClearingSearch(false);
    }, 100);
  }, []);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    console.log('🔄 onRefresh called:', {
      activeTab,
      searchResultsLength: searchResults.length,
      refreshing,
      isIntentionallyClearingSearch
    });
    
    // Don't refresh if we're in the process of intentionally clearing search
    if (isIntentionallyClearingSearch) {
      console.log('🚫 Skipping refresh - intentionally clearing search');
      return;
    }
    
    setRefreshing(true);
    try {
      // Always refresh settings to get latest favorites/voices
      await refreshSettings();
      
      // Only refresh search if we currently have search results active
      // AND we're not in the process of clearing filters
      if (activeTab !== 'favorites' && searchResults.length > 0 && !isIntentionallyClearingSearch) {
        console.log('🔄 Refreshing active search results');
        await handleSearch();
      } else {
        console.log('📝 No active search to refresh');
      }
    } catch (err) {
      console.error("❌ Failed to refresh:", err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshSettings, handleSearch, activeTab, searchResults.length, isIntentionallyClearingSearch]);

  // Stop any speech when unmounting
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Effect to clean up when TTS process for a voice concludes
  useEffect(() => {
    const voiceIdThatWasTracked = playingVoiceId; // Capture value at the time effect runs

    if (voiceIdThatWasTracked) {
      // Case 1: Sound was playing for this tracked voice and has now stopped playing.
      if (prevTtsPlaying && !ttsPlaying) {
        console.log(`[VCS Effect] TTS playing transitioned TRUE -> FALSE for ${voiceIdThatWasTracked}. Cleaning up.`);
        removeVoiceFromLoading(voiceIdThatWasTracked);
        setPlayingVoiceId(null); // Stop tracking this voice specifically for TTS events
      }
      // Case 2: Sound was loading for this tracked voice, loading finished, but it never started playing.
      // (And it wasn't playing in the previous state either, to avoid conflict with case 1)
      else if (prevTtsLoading && !ttsLoading && !ttsPlaying && !prevTtsPlaying) {
        console.log(`[VCS Effect] TTS loading transitioned TRUE -> FALSE (and did not play) for ${voiceIdThatWasTracked}. Cleaning up.`);
        removeVoiceFromLoading(voiceIdThatWasTracked);
        setPlayingVoiceId(null); // Stop tracking this voice specifically for TTS events
      }
    }
  }, [ttsPlaying, ttsLoading, playingVoiceId, prevTtsPlaying, prevTtsLoading, removeVoiceFromLoading]);

  // Debug effect to log loading voices
  useEffect(() => {
    console.log('Loading voices updated:', Array.from(loadingVoiceIds));
  }, [loadingVoiceIds]);
  
  // Debug effect to track loading and playing states
  useEffect(() => {
    console.log('⚡ ttsLoading changed:', ttsLoading);
  }, [ttsLoading]);
  
  useEffect(() => {
    console.log('🔊 ttsPlaying changed:', ttsPlaying);
  }, [ttsPlaying]);
  
  // Effect to force re-render of voice items when loading state changes
  useEffect(() => {
    // Just having this effect depend on ttsLoading/ttsPlaying will cause
    // component updates when these values change
    console.log('Loading/Playing state changed:', { ttsLoading, ttsPlaying, playingVoiceId });
  }, [ttsLoading, ttsPlaying, playingVoiceId]);
  

  const playVoiceSample = async (voice: Voice) => {
    const currentVoiceId = voice.id;

    // If this voice is already active (in loadingVoiceIds), this click is to stop it.
    if (loadingVoiceIds.has(currentVoiceId)) {
      console.log('[VCS] Stop requested for voice:', currentVoiceId);
      stopSpeaking(); // Tell TTS hook to stop its current operation
      removeVoiceFromLoading(currentVoiceId); // Remove from our UI active set
      if (playingVoiceId === currentVoiceId) { // If TTS was specifically tracking this voice
        setPlayingVoiceId(null);
      }
      return;
    }

    // This is a new preview request. Stop any *other* active voice first.
    const anyOtherActiveVoice = Array.from(loadingVoiceIds)[0]; // Check if any voice is in the set
    if (anyOtherActiveVoice) {
      console.log('[VCS] Another voice was active:', anyOtherActiveVoice, '. Stopping it before starting new one.');
      stopSpeaking(); // Stop current TTS operation
      removeVoiceFromLoading(anyOtherActiveVoice); // Clear its UI active marker
      if (playingVoiceId === anyOtherActiveVoice) {
        setPlayingVoiceId(null); // Clear TTS tracking for it
      }
    }
    // Also, if playingVoiceId somehow has a value not in loadingVoiceIds (desync), reset TTS
    else if (playingVoiceId && !loadingVoiceIds.has(playingVoiceId)) {
        console.warn('[VCS] TTS was tracking a voice not in loadingVoiceIds. Resetting TTS state for safety.');
        stopSpeaking();
        setPlayingVoiceId(null);
    }

    console.log('[VCS] Starting new preview for voice:', currentVoiceId);
    addVoiceToLoading(currentVoiceId);     // UI: Mark as active (shows loader/stop)
    setPlayingVoiceId(currentVoiceId);     // System: Track this as the *intended* voice for upcoming TTS events

    try {
      await previewVoice( // This call will manage ttsLoading and ttsPlaying in useTextToSpeech
        currentVoiceId,
        voice.provider,
        voice.public_owner_id || voice.publicOwnerId,
        voice.name,
        voice.language || voice.languageCode
      );
      // If previewVoice resolves successfully, the voice is either playing or setup has finished.
      // The loader/stop button remains active because currentVoiceId is still in loadingVoiceIds.
      // The useEffect (with prevTtsPlaying/prevTtsLoading) will handle removing it when playback actually ends or loading fails post-initiation.
      console.log('[VCS] previewVoice call initiated/completed for:', currentVoiceId);
    } catch (error) {
      console.error('[VCS] Error during previewVoice call for:', currentVoiceId, error);
      removeVoiceFromLoading(currentVoiceId); // UI: Error, so stop showing active state
      if (playingVoiceId === currentVoiceId) { // If TTS was tracking this one
        setPlayingVoiceId(null); // System: Stop tracking
      }
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
                        t('general.error.title'),
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
        t('general.error.title'), 
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
      // Show a loading toast first
      showToast(t('voice.actions.selecting', 'Selecting voice...'), 'info', 1000);
      
      // Update voice settings via API
      await updateVoiceSettings({
        ...userSettings.voiceSettings,
        provider: voice.provider,
        voiceId: voice.id
      });
      
      // After successful update, refresh the UI
      // 1. Make sure the selected voice appears at the top of the list
      const updatedVoices = [...combinedVoices];
      const selectedIndex = updatedVoices.findIndex(v => v.id === voice.id);
      if (selectedIndex > 0) {
        const selectedVoice = updatedVoices.splice(selectedIndex, 1)[0];
        updatedVoices.unshift(selectedVoice);
        setCombinedVoices(updatedVoices);
      }
      
      // 2. Refresh profile data to get the latest voice settings
      fetchProfileData();
      
      // Show success toast for exactly 3 seconds
      showToast(t('voice.actions.voiceSelected', { name: voice.name }), 'success', 3000);
    } catch (err) {
      // Show error toast for exactly 3 seconds
      showToast(t('voice.actions.errorSelectingVoice'), 'error', 3000);
    }
  };

  // Replace the entire ListHeaderComponent with a simplified version
  const ListHeaderComponent = useCallback(() => {
    return (
      <View style={styles.voiceSectionHeader}>
        <Text style={[styles.voiceSectionTitle, { color: theme.text }]}>
          {t('voice.collection.allVoices', 'All Voices')}
        </Text>
      </View>
    );
  }, [theme]);

  // Enhance the renderVoiceItem function to better highlight selected voice
  const renderVoiceItem = ({ item }: { item: Voice }) => {
    // Only use API favorites (from userSettings.favorites.voices), not the item.isFavorite property
    const isFavorite = userSettings?.favorites?.voices?.includes(item.id);
    
    // Check if the voice is selected using both the local userSettings and profileData
    const isSelectedFromSettings = userSettings?.voiceSettings?.voiceId === item.id;
    const isSelectedFromProfile = profileData?.voiceSettings?.selectedVoice?.id === item.id;
    const isSelected = isSelectedFromSettings || isSelectedFromProfile;
    
    const isItemActiveInUI = loadingVoiceIds.has(item.id);
    const isItemActuallyPlayingViaTTS = ttsPlaying && playingVoiceId === item.id;

    const isFavoriteLoading = favoriteOperation?.voiceId === item.id && favoriteOperation.loading;
    
    // Voice access control
    const canPreview = canPreviewVoice(item.id);
    const canSelect = canSelectVoice(item.id);
    const voiceAccess = getVoiceAccess(item.id);
    const isPremiumVoice = item.isPremium || item.accessLevel === 'premium';
    
    // Try to get enhanced name from profile data
    let enhancedVoiceName = item.name;
    if (profileData?.favoriteVoices) {
      const profileVoice = profileData.favoriteVoices.find(
        (voice: any) => voice.voiceId === item.id
      );
      if (profileVoice && profileVoice.name) {
        enhancedVoiceName = profileVoice.name;
      }
    }
    
    // Generate avatar URL or placeholder
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(enhancedVoiceName)}&background=4A6FEA&color=fff`;
    
    // Get translated values for display
    const getTranslatedUseCase = (useCase?: string) => {
      if (!useCase) return t('general.general', 'General');
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
            backgroundColor: theme.primary + '10',
          },
          // Add disabled styling for inaccessible voices
          !canSelect && !isSelected && styles.voiceCardDisabled
        ]}
        onPress={() => {
          setSelectedVoice(item);
          setShowDetailModal(true);
        }}
      >
        <View style={styles.voiceCardHeader}>
          <Image 
            source={{ uri: avatarUrl }} 
            style={[
              styles.voiceAvatar,
              // Dim avatar for inaccessible voices
              !canSelect && !isSelected && styles.avatarDisabled
            ]} 
          />
          <View style={styles.voiceInfo}>
            <View style={styles.voiceNameContainer}>
              <Text style={[
                styles.voiceName,
                // Dim text for inaccessible voices
                !canSelect && !isSelected && styles.textDisabled
              ]}>
                {enhancedVoiceName}
              </Text>
              {isPremiumVoice && (
                <PremiumBadge 
                  size="small" 
                  style={styles.premiumBadge}
                  iconOnly={true}
                />
              )}
              {isSelected && (
                <Ionicons name="checkmark-circle" size={16} color={theme.primary} style={styles.voiceNameIcon} />
              )}
            </View>
            <Text style={[
              styles.voiceProvider,
              !canSelect && !isSelected && styles.textDisabled
            ]}>
              {getTranslatedUseCase(item.use_case)}
            </Text>
            <View style={styles.voiceLanguageContainer}>
              <Text style={[
                styles.voiceLanguage,
                !canSelect && !isSelected && styles.textDisabled
              ]}>
                {item.language || 'English'}
              </Text>
              {item.gender && (
                <View style={[
                  styles.genderBadge,
                  !canSelect && !isSelected && styles.badgeDisabled
                ]}>
                  <Ionicons 
                    name={item.gender === 'male' ? 'male' : item.gender === 'female' ? 'female' : 'person'} 
                    size={12} 
                    color={!canSelect && !isSelected ? "#CCCCCC" : "#FFFFFF"} 
                  />
                </View>
              )}
              {item.accent && (
                <View style={[
                  styles.accentBadge,
                  !canSelect && !isSelected && styles.badgeDisabled
                ]}>
                  <Text style={[
                    styles.accentText,
                    !canSelect && !isSelected && styles.textDisabled
                  ]}>
                    {getTranslatedAccent(item.accent)}
                  </Text>
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
            style={[
              styles.playButton,
              // Style play button based on access
              !canPreview && styles.playButtonDisabled
            ]}
            onPress={(e) => {
              e.stopPropagation();
              if (canPreview) {
                playVoiceSample(item);
              }
            }}
            disabled={!canPreview}
          >
            {isItemActiveInUI ? (
              isItemActuallyPlayingViaTTS ? (
                <Ionicons name="stop-circle-outline" size={22} color="#FFFFFF" />
              ) : (
                <ActivityIndicator size="small" color="#FFFFFF" />
              )
            ) : (
              <Ionicons 
                name={canPreview ? "play" : "lock-closed"} 
                size={16} 
                color="#FFFFFF" 
              />
            )}
            <Text style={styles.playButtonText}>
              {isItemActiveInUI ? (
                isItemActuallyPlayingViaTTS ? 
                  t('voice.actions.stop', 'Stop') : 
                  t('general.loading', 'Loading...')
              ) : canPreview ? (
                t('voice.actions.preview', 'Preview')
              ) : (
                t('voice.actions.previewLocked', 'Locked')
              )}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.selectButton, 
              isSelected && {
                backgroundColor: theme.primary,
                borderColor: theme.primary
              },
              // Style select button based on access
              !canSelect && !isSelected && styles.selectButtonDisabled
            ]}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the parent touchable
              if (canSelect || isSelected) {
                handleSelectVoice(item);
              }
            }}
            disabled={!canSelect && !isSelected}
          >
            <Text style={[
              styles.selectButtonText, 
              isSelected && { color: '#FFFFFF' },
              !canSelect && !isSelected && styles.textDisabled
            ]}>
              {isSelected ? 
                t('voice.actions.selected', 'Selected') : 
                canSelect ? 
                  t('voice.actions.select', 'Select') : 
                  t('voice.actions.selectLocked', 'Locked')
              }
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Show upgrade prompt for premium voices that require upgrade */}
        {voiceAccess?.requiresUpgrade && (
          <View style={styles.upgradeSection}>
            <UpgradePrompt
              variant="banner"
              size="small"
              title={t('upgrade.premiumRequired', 'Premium Required')}
              message={t('upgrade.upgradeForVoice', 'Upgrade to access this premium voice.')}
              ctaText={t('upgrade.upgrade', 'Upgrade')}
              style={styles.upgradePrompt}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Apply filters from the modal
  const handleApplyFilters = useCallback((filters: FilterParams) => {
    console.log('🎯 Applying filters from modal:', filters);
    console.log('Current filter states before apply:', {
      advancedFilters,
      selectedProvider,
      selectedGender,
      selectedLanguage,
      searchQuery
    });
    
    // Update all filter states first
    setAdvancedFilters(filters);
    if (filters.provider) {
      setSelectedProvider(filters.provider);
    } else {
      setSelectedProvider('all');
    }
    
    if (filters.gender) {
      setSelectedGender(filters.gender);
    } else {
      setSelectedGender('all');
    }
    
    if (filters.language) {
      setSelectedLanguage(filters.language);
    } else {
      setSelectedLanguage('all');
    }
    
    if (filters.search !== undefined) {
      setSearchQuery(filters.search);
    } else {
      setSearchQuery('');
    }
    
    // console.log('New filter states after apply:', {
    //   advancedFilters: filters,
    //   selectedProvider: filters.provider || 'all',
    //   selectedGender: filters.gender || 'all',
    //   selectedLanguage: filters.language || 'all',
    //   searchQuery: filters.search || ''
    // });
    
    // Immediately perform search with the new filters
    // We'll trigger a direct search similar to the search button logic
    
    // Skip search if in favorites tab
    if (activeTab === 'favorites') {
      console.log('📝 In favorites tab, skipping search after filter apply');
      return;
    }
    
    // Reset pagination
    setPage(0);
    
    // Clear previous results
    setSearchResults([]);
    
    // Start search
    setIsSearching(true);
    
    // Build a clean params object from the filters that were just applied
    const params: any = {
      _: new Date().getTime() // Add cache buster
    };

    
    
    // Use the filters that were just passed in
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof FilterParams] !== undefined) {
        params[key] = filters[key as keyof FilterParams];
      }
    });
    
    console.log('🚀 Applying filters and searching with params:', params);
    
    // Execute search immediately
    console.log('🚀 Applying filters and searching with params:', params);
    searchVoices(params)
      .then(result => {
        const uniqueVoices = ensureUniqueIds(result.voices || []);
        setSearchResults(uniqueVoices);
        setHasMoreResults(result.hasMore || false);
        console.log(`✅ Applied filters and search returned ${uniqueVoices.length} voices, hasMore: ${result.hasMore}`);
      })
      .catch(error => {
        console.error('❌ Error applying filters and searching:', error);
        Alert.alert(t('general.error.title'), t('voice.collection.searchError'));
      })
      .finally(() => {
        setIsSearching(false);
      });

  }, [activeTab, searchVoices, ensureUniqueIds, setIsSearching, setSearchResults, setCombinedVoices, setHasMoreResults, t, advancedFilters, selectedProvider, selectedGender, selectedLanguage, searchQuery]);

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

  // Update the renderVoiceList function to sort the selected voice to appear first
  const renderVoiceList = useCallback(() => {
    // Only use search results for the "All" tab, other tabs always use combinedVoices
    const displayVoices = activeTab === 'all' && searchResults.length > 0 
      ? searchResults 
      : combinedVoices;
    
    // Get the selected voice ID
    const selectedVoiceId = userSettings?.voiceSettings?.voiceId;
    
    // Sort the voices so the selected one is first
    const sortedVoices = [...displayVoices].sort((a, b) => {
      if (a.id === selectedVoiceId) return -1;
      if (b.id === selectedVoiceId) return 1;
      return 0;
    });
    
    if ((loadingVoices || refreshing) && !isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>{t('general.loading', 'Loading...')}</Text>
        </View>
      );
    }

    if (displayVoices.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="mic-off-outline" size={48} color={theme.text} />
          <Text style={styles.emptyText}>
            {activeTab === 'favorites' 
              ? t('voice.collection.noFavorites') 
              : isSearching 
                ? t('voice.collection.searching')
                : activeTab === 'all' && (searchQuery || Object.keys(advancedFilters).length > 0 || selectedProvider !== 'all' || selectedGender !== 'all' || selectedLanguage !== 'all')
                  ? t('voice.collection.noSearchResults')
                  : t('voice.collection.noVoicesFound')}
          </Text>
          {activeTab === 'favorites' && (
            <Text style={styles.emptySubText}>
              {t('voice.collection.addFavoritesHint')}
            </Text>
          )}
          {activeTab === 'all' && (searchQuery !== '' || Object.keys(advancedFilters).length > 0) && (
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
        data={sortedVoices}
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
          activeTab,
          userSettings?.voiceSettings?.voiceId,
          ttsLoading,
          ttsPlaying,
          playingVoiceId,
          loadingVoiceIds.size
        ]}
      />
    );
  }, [
    activeTab,
    searchResults,
    combinedVoices,
    userSettings?.voiceSettings?.voiceId,
    loadingVoices,
    refreshing,
    isSearching,
    theme,
    renderVoiceItem,
    onRefresh,
    handleLoadMore,
    ListHeaderComponent,
    renderFooter,
    handleClearFilter,
    handleClearAllFilters,
    ttsLoading,
    ttsPlaying,
    playingVoiceId,
    loadingVoiceIds.size
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScreenHeader title={t('voice.collection.title')} />

      {/* Only show search and filters on "All Voices" tab */}
      {activeTab === 'all' && (
        <>
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
                    Alert.alert(t('general.error.title'), t('voice.collection.searchError'));
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
          
          {/* Selected Filters Card - only show on All Voices tab */}
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
        </>
      )}
      
      {/* Simple tab buttons for three tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'default' && styles.activeTab]} 
          onPress={() => setActiveTab('default')}
        >
          <Text style={[styles.tabLabel, activeTab === 'default' && styles.activeTabLabel]}>
            {t('voice.collection.default', 'Default')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'all' && styles.activeTab]} 
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabLabel, activeTab === 'all' && styles.activeTabLabel]}>
            {t('voice.collection.all')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'favorites' && styles.activeTab]} 
          onPress={() => {
            setActiveTab('favorites');
            // Clear search results when switching to favorites
            if (searchResults.length > 0) {
              setSearchResults([]);
            }
          }}
        >
          <Text style={[styles.tabLabel, activeTab === 'favorites' && styles.activeTabLabel]}>
            {t('voice.collection.favorites')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content area */}
      <TutorialTarget id="voice-collection-container" fillContainer>
        <View style={styles.contentContainer}>
          {renderVoiceList()}
        </View>
      </TutorialTarget>
      
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
        isSelected={selectedVoice ? (userSettings?.voiceSettings?.voiceId === selectedVoice.id ||
                                  profileData?.voiceSettings?.selectedVoice?.id === selectedVoice.id) : false}
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
  voiceNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 2,
  },
  voiceNameIcon: {
    marginLeft: 4,
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
    padding: 10,
  },
  voiceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 3,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  voiceSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  avatarDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    opacity: 0.5,
  },
  badgeDisabled: {
    opacity: 0.5,
  },
  playButtonDisabled: {
    opacity: 0.5,
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
  upgradeSection: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  upgradePrompt: {
    backgroundColor: 'transparent',
  },
  premiumBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.primary,
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
  voiceCardDisabled: {
    opacity: 0.6,
    backgroundColor: theme.background + '40',
  },
});

export default VoiceCollectionScreen; 