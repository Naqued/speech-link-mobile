import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDiscord } from '../../contexts/DiscordContext';

interface DiscordIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  isStreaming?: boolean;
  onPress?: () => void;
}

const DiscordIndicator: React.FC<DiscordIndicatorProps> = ({
  size = 'medium',
  showLabel = true,
  isStreaming = false,
  onPress
}) => {
  const navigation = useNavigation();
  const { isConnected, isAuthenticated, connectionStatus } = useDiscord();

  const iconSizes = {
    small: 16,
    medium: 24,
    large: 32
  };

  const iconSize = iconSizes[size];

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Navigate to Discord settings if no custom onPress handler
      navigation.navigate('DiscordSettings' as never);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isConnected ? styles.connected : styles.disconnected,
        isStreaming && styles.streaming
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {isStreaming ? (
        <View style={styles.streamingIconContainer}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : (
        <Ionicons
          name={isConnected ? "logo-discord" : "logo-discord"}
          size={iconSize}
          color={isConnected ? "#ffffff" : "#7289DA"}
        />
      )}
      {showLabel && (
        <Text style={[
          styles.label,
          isConnected ? styles.connectedLabel : styles.disconnectedLabel
        ]}>
          {isStreaming ? 'Streaming' : isConnected ? 'Discord' : ''}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  connected: {
    backgroundColor: '#43B581', // Discord green
  },
  disconnected: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7289DA',
  },
  streaming: {
    backgroundColor: '#F47FFF', // Purple color for streaming
  },
  streamingIconContainer: {
    height: 24,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 12,
  },
  connectedLabel: {
    color: '#ffffff',
  },
  disconnectedLabel: {
    color: '#7289DA',
  },
});

export default DiscordIndicator; 