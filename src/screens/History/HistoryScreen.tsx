import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  SectionList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { apiService } from '../../services/apiService';

// Define types for the history data
interface HistoryItem {
  id: string;
  text: string;
  timestamp: string;
  type: 'aac' | 'recording';
  voiceId?: string;
  voiceName?: string;
}

interface HistorySection {
  title: string;
  data: HistoryItem[];
}

const HistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const { speak, stopSpeaking } = useTextToSpeech();
  
  const [historyData, setHistoryData] = useState<HistorySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Attempt to fetch history from API
      const response = await apiService.get<{ history: HistoryItem[] }>('/api/history');
      
      if (response && Array.isArray(response.history)) {
        // Group history items by day
        const groupedData = groupHistoryByDay(response.history);
        setHistoryData(groupedData);
      } else {
        // No data or unexpected format
        setHistoryData([]);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load history data');
      setHistoryData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group history items by day (today, yesterday, last week)
  const groupHistoryByDay = (items: HistoryItem[]): HistorySection[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 24 * 60 * 60 * 1000;
    const lastWeek = today - 7 * 24 * 60 * 60 * 1000;
    
    const sections: HistorySection[] = [
      { title: 'today', data: [] },
      { title: 'yesterday', data: [] },
      { title: 'lastWeek', data: [] },
      { title: 'older', data: [] }
    ];
    
    // Sort items by timestamp, newest first
    const sortedItems = [...items].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Group items into appropriate sections
    sortedItems.forEach(item => {
      const itemDate = new Date(item.timestamp).getTime();
      
      if (itemDate >= today) {
        sections[0].data.push(item);
      } else if (itemDate >= yesterday) {
        sections[1].data.push(item);
      } else if (itemDate >= lastWeek) {
        sections[2].data.push(item);
      } else {
        sections[3].data.push(item);
      }
    });
    
    // Remove empty sections
    return sections.filter(section => section.data.length > 0);
  };

  const styles = makeStyles(theme);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const playHistoryItem = async (text: string, id: string, voiceId?: string) => {
    try {
      // Stop any current speech
      if (isSpeaking) {
        stopSpeaking();
      }
      
      if (playingItemId === id) {
        setIsSpeaking(false);
        setPlayingItemId(null);
        return;
      }
      
      setIsSpeaking(true);
      setPlayingItemId(id);
      
      // Use TTS service if we have a voice ID
      if (voiceId) {
        try {
          const soundObject = await speak(text, voiceId, 'ELEVENLABS');
          
          // Set up a listener to update state when playback finishes
          soundObject.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsSpeaking(false);
              setPlayingItemId(null);
            }
          });
        } catch (error) {
          // Fallback to default speech if TTS fails
          console.error('Failed to play with TTS, using fallback', error);
          useFallbackSpeech(text);
        }
      } else {
        // Use default speech if no voice ID
        useFallbackSpeech(text);
      }
    } catch (error) {
      console.error('Failed to play history item', error);
      Alert.alert(t('general.error'), 'Failed to play history item');
      setIsSpeaking(false);
      setPlayingItemId(null);
    }
  };
  
  const useFallbackSpeech = (text: string) => {
    const ExpoSpeech = require('expo-speech');
    ExpoSpeech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => {
        setIsSpeaking(false);
        setPlayingItemId(null);
      },
      onError: () => {
        setIsSpeaking(false);
        setPlayingItemId(null);
      },
    });
  };

  const handleClearHistory = async () => {
    Alert.alert(
      t('general.confirm'),
      t('history.clearAll') + '?',
      [
        {
          text: t('general.cancel'),
          style: 'cancel',
        },
        {
          text: t('general.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              // Call API to clear history
              await apiService.delete('/api/history');
              setHistoryData([]);
              console.log('History cleared');
            } catch (error) {
              console.error('Failed to clear history', error);
              Alert.alert(t('general.error'), 'Failed to clear history');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    const isPlaying = playingItemId === item.id;
    
    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => playHistoryItem(item.text, item.id, item.voiceId)}
      >
        <View style={styles.historyItemContent}>
          <View style={styles.historyItemIconContainer}>
            <Ionicons
              name={item.type === 'recording' ? 'mic' : 'chatbox'}
              size={24}
              color={theme.text}
            />
          </View>
          <View style={styles.historyItemTextContainer}>
            <Text style={styles.historyItemText} numberOfLines={2}>
              {item.text}
            </Text>
            <View style={styles.historyItemDetailsContainer}>
              <Text style={styles.historyItemVoice}>{item.voiceName || 'System Voice'}</Text>
              <Text style={styles.historyItemTime}>{formatTime(item.timestamp)}</Text>
            </View>
          </View>
          <View style={styles.historyItemAction}>
            {isPlaying ? (
              <Ionicons name="pause" size={24} color={theme.primary} />
            ) : (
              <Ionicons name="play" size={24} color={theme.primary} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{t(`history.${title}`)}</Text>
    </View>
  );

  // Loading state
  if (isLoading && historyData.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>{t('history.title')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>{t('general.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{t('history.title')}</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleClearHistory}
          disabled={isLoading || historyData.length === 0}
        >
          <Ionicons 
            name="trash-outline" 
            size={24} 
            color={historyData.length === 0 ? theme.text + '40' : theme.error} 
          />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={historyData}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.historyList}
        stickySectionHeadersEnabled={true}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Ionicons name="time-outline" size={50} color={theme.text + '50'} />
            <Text style={styles.emptyStateText}>
              {error ? error : t('history.noItems')}
            </Text>
            {error && (
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchHistoryData}
              >
                <Text style={styles.retryText}>{t('general.retry')}</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        onRefresh={fetchHistoryData}
        refreshing={isLoading}
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
  headerButton: {
    padding: 8,
  },
  historyList: {
    paddingBottom: 40,
  },
  sectionHeader: {
    backgroundColor: theme.background,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
  },
  historyItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: theme.border,
  },
  historyItemTextContainer: {
    flex: 1,
  },
  historyItemText: {
    fontSize: 16,
    color: theme.text,
    marginBottom: 4,
  },
  historyItemDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemVoice: {
    fontSize: 14,
    color: theme.primary,
    marginRight: 10,
  },
  historyItemTime: {
    fontSize: 12,
    color: theme.text + '80',
  },
  historyItemAction: {
    paddingLeft: 10,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    paddingTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: theme.text,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.primary,
    borderRadius: 20,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default HistoryScreen; 