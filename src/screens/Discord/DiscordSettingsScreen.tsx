import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  FlatList,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect } from '@react-navigation/native';

// Context
import { useDiscord } from '../../contexts/DiscordContext';
import { ThemeContext, themes } from '../../contexts/ThemeContext';
import { useContext } from 'react';

// Types from service
import { DiscordServer, DiscordChannel } from '../../services/discordService';

const DiscordSettingsScreen: React.FC = () => {
  // Move all hooks to the top level of the component function
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const isDarkMode = theme === themes.dark;
  
  const {
    isLoading,
    isAuthenticated,
    isConnected,
    connectionStatus,
    servers,
    channels,
    currentServer,
    currentChannel,
    error,
    getDiscordAuthUrl,
    handleDiscordCallback,
    loadServers,
    loadChannels,
    loadSettings,
    selectServer,
    selectChannel,
    saveSettings,
    connect,
    disconnect
  } = useDiscord();

  // State hooks
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [channelModalVisible, setChannelModalVisible] = useState(false);
  const [authInProgress, setAuthInProgress] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Create refs outside of useEffect
  const wasConnectedRef = useRef(false);
  const styles = makeStyles(theme, isDarkMode);

  // Create stable versions of Discord context functions
  const stableLoadSettings = useCallback(() => {
    return loadSettings();
  }, [loadSettings]);
  
  const stableConnect = useCallback(() => {
    return connect();
  }, [connect]);
  
  const stableDisconnect = useCallback(() => {
    return disconnect();
  }, [disconnect]);
  
  const stableSaveSettings = useCallback(() => {
    return saveSettings();
  }, [saveSettings]);
  
  // Load settings once when the screen is focused
  // REMOVING THIS useFocusEffect BLOCK
  
  // Extract handleDeepLink to a stable callback
  const handleDeepLink = useCallback(async (event: { url: string }) => {
    const url = event.url;
    if (url.includes('discord-callback')) {
      setAuthInProgress(false);
      const code = url.split('code=')[1]?.split('&')[0];
      if (code) {
        try {
          const success = await handleDiscordCallback(code);
          if (success) {
            Alert.alert(
              t('discord.authSuccess'),
              t('discord.authSuccessMessage')
            );
            // Reload settings after successful authentication
            await stableLoadSettings();
          } else {
            Alert.alert(
              t('discord.authFailed'),
              t('discord.authFailedMessage')
            );
          }
        } catch (err) {
          console.error('Error handling Discord callback:', err);
          Alert.alert(
            t('discord.authFailed'),
            t('discord.authFailedMessage')
          );
        }
      }
    }
  }, [handleDiscordCallback, stableLoadSettings]);

  // Handle deep link for Discord OAuth callback
  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  // Connect Discord Account
  const handleConnectToDiscord = useCallback(async () => {
    try {
      if (isAuthenticated) {
        // If already authenticated, just load settings
        await stableLoadSettings();
        return;
      }
      
      // Start OAuth flow
      setAuthInProgress(true);
      try {
        // Get auth URL from backend
        const authUrl = await getDiscordAuthUrl();
        if (!authUrl) {
          throw new Error('Failed to get Discord authorization URL');
        }
        
        console.log('Opening Discord auth URL:', authUrl);
        await WebBrowser.openBrowserAsync(authUrl);
        
        // When control returns here, the user has closed the browser
        console.log('Browser closed, checking for successful authentication');
        setAuthInProgress(true);
        
        let attempts = 0;
        const maxAttempts = 10; // Try for about 10 seconds
        
        while (attempts < maxAttempts) {
          try {
            const success = await handleDiscordCallback("");
            
            if (success) {
              Alert.alert(
                t('discord.authSuccess'),
                t('discord.authSuccessMessage')
              );
              await stableLoadSettings();
              setAuthInProgress(false);
              return;
            }
          } catch (err) {
            console.error('Error checking auth status:', err);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
        
        // If we get here, authentication likely failed
        setAuthInProgress(false);
        Alert.alert(
          t('discord.authFailed'),
          t('discord.authFailedMessage')
        );
      } catch (err) {
        console.error('Error during Discord authentication:', err);
        Alert.alert(
          t('general.error'),
          t('discord.authError', 'Failed to connect to Discord. Please try again.')
        );
        setAuthInProgress(false);
      }
    } catch (err) {
      setAuthInProgress(false);
      Alert.alert(
        t('general.error'),
        err instanceof Error ? err.message : 'Failed to connect to Discord'
      );
    }
  }, [isAuthenticated, getDiscordAuthUrl, handleDiscordCallback, stableLoadSettings]);

  // Invite Discord Bot
  const handleInviteBot = useCallback(async () => {
    try {
      const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID || '1372876918713483326'}&permissions=36700160&scope=bot`;
      if (Platform.OS === 'web') {
        window.open(inviteUrl, '_blank');
      } else {
        await Linking.openURL(inviteUrl);
      }
    } catch (err) {
      Alert.alert(t('general.error'), 'Failed to open invite URL');
    }
  }, []);

  // Select Server
  const handleSelectServer = useCallback((server: DiscordServer) => {
    // If currently connected to voice, disconnect first
    if (isConnected) {
      stableDisconnect().then(() => {
        selectServer(server);
        setServerModalVisible(false);
      });
    } else {
      selectServer(server);
      setServerModalVisible(false);
    }
  }, [isConnected, stableDisconnect, selectServer]);

  // Select Channel and Auto-Save
  const handleSelectChannel = useCallback(async (channel: DiscordChannel) => {
    // If currently connected to voice, disconnect first
    if (isConnected) {
      await stableDisconnect();
    }
    
    // Set the selected channel
    selectChannel(channel);
    setChannelModalVisible(false);

    // Auto-save settings if we have both server and channel
    if (currentServer) {
      console.log('Auto-saving Discord settings after channel selection...');
      try {
        const success = await stableSaveSettings();
        if (success) {
          console.log('Settings auto-saved successfully');
        } else {
          console.error('Failed to auto-save settings');
          Alert.alert(
            t('general.error'),
            t('discord.failedToSaveSettings', 'Failed to save Discord settings. Please try again.')
          );
        }
      } catch (err) {
        console.error('Error auto-saving settings:', err);
      }
    }
  }, [currentServer, isConnected, stableDisconnect, selectChannel, stableSaveSettings]);

  // Join or Disconnect Voice Channel
  const handleJoinOrDisconnect = useCallback(async () => {
    try {
      if (isConnected) {
        // If connected, disconnect
        const success = await stableDisconnect();
        if (success) {
          console.log('Successfully disconnected from Discord voice channel');
          // Manual refresh of connection status
          await stableLoadSettings();
        } else {
          Alert.alert(
            t('general.error'),
            t('discord.disconnectFailed', 'Failed to disconnect from Discord voice channel')
          );
        }
      } else {
        // Check if server and channel are selected
        if (!currentServer || !currentChannel) {
          Alert.alert(
            t('general.error'),
            t('discord.selectServerAndChannel', 'Please select a server and channel first')
          );
          return;
        }

        // Join the voice channel
        const success = await stableConnect();
        if (success) {
          console.log('Successfully joined Discord voice channel');
          // Manual refresh of connection status
          await stableLoadSettings();
        } else {
          Alert.alert(
            t('general.error'),
            t('discord.joinFailed', 'Failed to join Discord voice channel')
          );
        }
      }
    } catch (err) {
      console.error('Error joining/disconnecting voice channel:', err);
      Alert.alert(
        t('general.error'),
        t('discord.connectionError', 'An error occurred while managing the Discord connection')
      );
    }
  }, [isConnected, currentServer, currentChannel, stableConnect, stableDisconnect, stableLoadSettings]);
  
  // Join/Disconnect Button
  const renderJoinButton = useCallback(() => {
    if (!currentServer || !currentChannel) {
      return null;
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.actionButton,
          isConnected ? styles.disconnectButton : styles.joinButton
        ]}
        onPress={handleJoinOrDisconnect}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons
              name={isConnected ? "exit-outline" : "enter-outline"}
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.actionButtonText}>
              {isConnected
                ? t('discord.leaveVoice', 'Leave Voice Channel')
                : t('discord.joinVoice', 'Join Voice Channel')}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }, [currentServer, currentChannel, isConnected, isLoading, handleJoinOrDisconnect, styles, t]);

  const renderServerModal = useCallback(() => (
    <Modal
      visible={serverModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setServerModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('discord.selectServer')}</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : servers.length > 0 ? (
            <FlatList
              data={servers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    currentServer?.id === item.id && styles.selectedItem
                  ]}
                  onPress={() => handleSelectServer(item)}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {currentServer?.id === item.id && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyListContainer}>
              <Ionicons name="alert-circle-outline" size={24} color={theme.text} />
              <Text style={styles.emptyListText}>
                {error || t('discord.noServersFound', 'No Discord servers found')}
              </Text>
              <Text style={styles.emptyListSubtext}>
                {t('discord.checkDiscordConnection', 'Make sure your Discord account is properly connected')}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setServerModalVisible(false)}
          >
            <Text style={styles.modalCloseButtonText}>{t('general.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  ), [serverModalVisible, isLoading, servers, currentServer, error, handleSelectServer, styles, theme, t]);

  const renderChannelModal = useCallback(() => (
    <Modal
      visible={channelModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setChannelModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('discord.selectChannel')}</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : channels.length > 0 ? (
            <FlatList
              data={channels}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    currentChannel?.id === item.id && styles.selectedItem
                  ]}
                  onPress={() => handleSelectChannel(item)}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {currentChannel?.id === item.id && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyListContainer}>
              <Ionicons name="alert-circle-outline" size={24} color={theme.text} />
              <Text style={styles.emptyListText}>
                {error || t('discord.noChannelsFound', 'No voice channels found in this server')}
              </Text>
              <Text style={styles.emptyListSubtext}>
                {t('discord.createVoiceChannel', 'Make sure this server has at least one voice channel')}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setChannelModalVisible(false)}
          >
            <Text style={styles.modalCloseButtonText}>{t('general.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  ), [channelModalVisible, isLoading, channels, currentChannel, error, handleSelectChannel, styles, theme, t]);

  const renderSettingItem = useCallback((
    icon: string,
    title: string,
    value?: React.ReactNode,
    onPress?: () => void,
    showArrow: boolean = true
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon as any} size={24} color={theme.text} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <View style={styles.settingValueContainer}>
        {value}
        {showArrow && onPress && (
          <Ionicons name="chevron-forward" size={20} color={theme.text} />
        )}
      </View>
    </TouchableOpacity>
  ), [styles, theme.text]);
  
  // Standard componentDidMount-style effect to prevent duplicate initialization
  useEffect(() => {
    // This will run exactly once when the component mounts
    if (!initialLoadComplete) {
      console.log('Component mounted, loading settings once');
      stableLoadSettings().then(() => {
        setInitialLoadComplete(true);
      }).catch(err => {
        console.error('Error in initial load:', err);
        setInitialLoadComplete(true);
      });
    }
    // No dependencies means this runs only once when component mounts
  }, []);

  // Show loading state before initial load complete
  if (!initialLoadComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('discord.discordSettings')}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>{t('general.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render the main UI
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('discord.discordSettings')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('discord.connection')}</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Stage 1: Connect Discord Account */}
          <TouchableOpacity
            style={[
              styles.accountButton,
              isAuthenticated ? styles.accountConnectedButton : styles.accountDisconnectedButton
            ]}
            onPress={handleConnectToDiscord}
            disabled={isLoading || authInProgress}
          >
            {isLoading || authInProgress ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="logo-discord"
                  size={24}
                  color="#fff"
                />
                <Text style={styles.accountButtonText}>
                  {isAuthenticated
                    ? t('discord.accountConnected', 'Discord Account Connected')
                    : t('discord.linkAccount', 'Connect Discord Account')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!isAuthenticated ? (
            <View style={styles.notConnectedContainer}>
              <Ionicons name="information-circle-outline" size={24} color={theme.text} />
              <Text style={styles.notConnectedText}>
                {t('discord.notConnectedHelp', 'Connect your Discord account to stream your voice to Discord voice channels')}
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.inviteBotButton}
                onPress={handleInviteBot}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.inviteBotButtonText}>
                  {t('discord.inviteBot')}
                </Text>
              </TouchableOpacity>

              {/* Stage 2: Server and Channel Selection */}
              <Text style={styles.sectionSubtitle}>{t('discord.configuration')}</Text>
              
              {renderSettingItem(
                'server-outline',
                t('discord.server'),
                <Text style={styles.settingValue}>
                  {currentServer?.name || t('discord.selectServer')}
                </Text>,
                () => {
                  loadServers();
                  setServerModalVisible(true);
                }
              )}
              
              {currentServer && renderSettingItem(
                'chatbubbles-outline',
                t('discord.voiceChannel'),
                <Text style={styles.settingValue}>
                  {currentChannel?.name || t('discord.selectChannel')}
                </Text>,
                () => {
                  if (currentServer) {
                    loadChannels(currentServer.id);
                    setChannelModalVisible(true);
                  } else {
                    Alert.alert(t('general.error'), t('discord.selectServerFirst'));
                  }
                }
              )}
              
              {/* Stage 3: Join/Leave Voice Channel */}
              {renderJoinButton()}
            </>
          )}
        </View>

        {/* Connection Status Section (only shown when connected) */}
        {isConnected && connectionStatus?.connectionDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('discord.connectionStatus')}</Text>
            
            <View style={styles.connectionInfoItem}>
              <Text style={styles.connectionInfoLabel}>{t('discord.connectedTo')}</Text>
              <Text style={styles.connectionInfoValue}>
                {connectionStatus.connectionDetails.serverName} / {connectionStatus.connectionDetails.channelName}
              </Text>
            </View>
            
            <View style={styles.connectionInfoItem}>
              <Text style={styles.connectionInfoLabel}>{t('discord.connectedSince')}</Text>
              <Text style={styles.connectionInfoValue}>
                {new Date(connectionStatus.connectionDetails.connectedAt).toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.connectionInfoItem}>
              <Text style={styles.connectionInfoLabel}>{t('discord.connectionDuration')}</Text>
              <Text style={styles.connectionInfoValue}>
                {Math.floor(connectionStatus.connectionDetails.durationMs / 60000)} {t('discord.minutes')}
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('discord.about')}</Text>
          <Text style={styles.helpText}>
            {t('discord.helpText', 'Discord integration allows you to stream your synthesized speech directly to Discord voice channels. Connect your account, select a server and channel, and start speaking!')}
          </Text>
          
          <View style={styles.noticeContainer}>
            <Ionicons name="information-circle-outline" size={20} color={theme.text} />
            <Text style={styles.noticeText}>
              {t('discord.autoDisconnectNotice', 'Discord will automatically disconnect when not in use to save resources.')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {renderServerModal()}
      {renderChannelModal()}
    </SafeAreaView>
  );
};

const makeStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textLight,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginTop: 20,
    marginBottom: 12,
  },
  errorContainer: {
    backgroundColor: isDarkMode ? '#593431' : '#fdecea',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: isDarkMode ? '#ff6b6b' : '#d32f2f',
    fontSize: 14,
  },
  notConnectedContainer: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? '#383838' : theme.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    alignItems: 'center',
  },
  notConnectedText: {
    marginLeft: 8,
    flex: 1,
    color: theme.text,
    fontSize: 14,
    lineHeight: 20,
  },
  // Account connection button
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  accountDisconnectedButton: {
    backgroundColor: '#7289DA', // Discord color
  },
  accountConnectedButton: {
    backgroundColor: '#43B581', // Discord green
  },
  accountButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  // Server selection
  inviteBotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#36393F', // Discord dark
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  inviteBotButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  settingIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: theme.text,
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: theme.textLight,
    marginRight: 8,
  },
  // Join/Disconnect button
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  joinButton: {
    backgroundColor: '#43B581', // Discord green
  },
  disconnectButton: {
    backgroundColor: '#ff3b30', // Red color for disconnect
  },
  buttonIcon: {
    marginRight: 8,
  },
  // Connection status
  connectionInfoItem: {
    marginBottom: 12,
  },
  connectionInfoLabel: {
    fontSize: 14,
    color: theme.textLight,
    marginBottom: 4,
  },
  connectionInfoValue: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.textLight,
  },
  // Modals
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  selectedItem: {
    backgroundColor: isDarkMode ? '#2a2a2a' : theme.highlightBackground,
  },
  modalItemText: {
    fontSize: 16,
    color: theme.text,
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
  },
  noticeText: {
    fontSize: 14,
    color: theme.text,
    marginLeft: 8,
    flex: 1,
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 150,
  },
  emptyListText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyListSubtext: {
    fontSize: 14,
    color: theme.text,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default DiscordSettingsScreen; 