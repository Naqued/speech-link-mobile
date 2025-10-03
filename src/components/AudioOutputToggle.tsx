import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { audioOutputService } from '../services/audioOutputService';
import { AudioOutputMode } from '../utils/audio/audioConfig';

interface AudioOutputToggleProps {
  size?: number;
  color?: string;
  onToggle?: (mode: AudioOutputMode) => void;
}

/**
 * Audio Output Toggle Button
 * - Click: Toggle force speaker on/off
 * - Long press: Navigate to audio settings
 */
export const AudioOutputToggle: React.FC<AudioOutputToggleProps> = ({ 
  size = 24, 
  color = '#007AFF',
  onToggle 
}) => {
  const navigation = useNavigation();
  const [isForceSpeaker, setIsForceSpeaker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize and get current mode
    const initializeMode = async () => {
      await audioOutputService.initialize();
      setIsForceSpeaker(audioOutputService.isForceSpeakerEnabled());
    };
    initializeMode();
  }, []);

  const handlePress = async () => {
    try {
      setIsLoading(true);
      const newMode = await audioOutputService.toggleForceSpeaker();
      setIsForceSpeaker(newMode === AudioOutputMode.FORCE_SPEAKER);
      onToggle?.(newMode);
    } catch (error) {
      console.error('Error toggling force speaker:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLongPress = () => {
    // Navigate to audio output settings screen
    navigation.navigate('AudioOutputSettings' as never);
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (isForceSpeaker) {
      return 'volume-high'; // Speaker icon when force speaker is on
    }
    return 'volume-medium-outline'; // Default volume icon
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      style={styles.button}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons 
          name={getIconName()} 
          size={size} 
          color={isForceSpeaker ? '#FF9500' : color} // Orange when active, default color otherwise
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
});

