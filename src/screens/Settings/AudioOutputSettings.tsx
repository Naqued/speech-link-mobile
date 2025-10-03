import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../../contexts/ThemeContext';
import { ScreenHeader } from '../../components/UI/ScreenHeader';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useVoiceSettings } from '../../hooks/useVoiceSettings';
import { Audio } from 'expo-av';

const AudioOutputSettings: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const styles = makeStyles(theme);

  const { isAudioRoutingEnabled, toggleAudioRouting } = useTextToSpeech();
  const { userSettings, updateVoiceSettings } = useVoiceSettings();

  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('speaker');

  useEffect(() => {
    loadAudioDevices();
  }, []);

  const loadAudioDevices = async () => {
    try {
      if (Platform.OS === 'android') {
        // On Android, we have these main options via Expo AV
        setAvailableDevices(['speaker', 'earpiece', 'bluetooth', 'wired']);
      } else if (Platform.OS === 'ios') {
        setAvailableDevices(['speaker', 'earpiece', 'bluetooth', 'airplay']);
      }
    } catch (error) {
      console.error('Failed to load audio devices:', error);
    }
  };

  const handleToggleAudioRouting = async (value: boolean) => {
    if (value) {
      // Show confirmation dialog when enabling
      Alert.alert(
        t('audioOutput.confirmEnableTitle') || 'Enable Audio Routing',
        t('audioOutput.confirmEnableMessage') || 'This will route audio output to the selected device. Some apps may hear your TTS voice.',
        [
          {
            text: t('general.cancel') || 'Cancel',
            style: 'cancel',
          },
          {
            text: t('general.enable') || 'Enable',
            onPress: async () => {
              const success = await toggleAudioRouting(true);
              if (!success) {
                Alert.alert(
                  t('general.error') || 'Error',
                  t('audioOutput.enableFailed') || 'Failed to enable audio routing'
                );
              }
            },
          },
        ]
      );
    } else {
      // No confirmation needed when disabling
      const success = await toggleAudioRouting(false);
      if (!success) {
        Alert.alert(
          t('general.error') || 'Error',
          t('audioOutput.disableFailed') || 'Failed to disable audio routing'
        );
      }
    }
  };

  const handleSelectDevice = async (device: string) => {
    try {
      setSelectedDevice(device);
      
      // Configure Expo AV audio mode based on selected device
      let audioMode: any = {
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      };

      if (Platform.OS === 'android') {
        switch (device) {
          case 'speaker':
            audioMode.androidAudioMode = 'speakerphone';
            break;
          case 'earpiece':
            audioMode.androidAudioMode = 'in_call';
            break;
          case 'bluetooth':
            audioMode.androidAudioMode = 'bluetooth';
            break;
          case 'wired':
            audioMode.androidAudioMode = 'wired';
            break;
        }
      } else if (Platform.OS === 'ios') {
        switch (device) {
          case 'speaker':
            audioMode.allowsRecordingIOS = false;
            audioMode.interruptionModeIOS = Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX;
            break;
          case 'earpiece':
            audioMode.allowsRecordingIOS = false;
            audioMode.interruptionModeIOS = Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX;
            break;
          case 'bluetooth':
            audioMode.allowsRecordingIOS = true;
            audioMode.interruptionModeIOS = Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS;
            break;
        }
      }

      await Audio.setAudioModeAsync(audioMode);

      // Save preference
      if (userSettings?.voiceSettings) {
        await updateVoiceSettings({
          ...userSettings.voiceSettings,
          audioOutputDevice: device,
        });
      }

      Alert.alert(
        t('audioOutput.success') || 'Success',
        t('audioOutput.deviceChanged') || `Audio output device changed to ${getDeviceDisplayName(device)}`
      );
    } catch (error) {
      console.error('Failed to select audio device:', error);
      Alert.alert(
        t('general.error') || 'Error',
        t('audioOutput.selectFailed') || 'Failed to select audio device'
      );
    }
  };

  const getDeviceDisplayName = (device: string): string => {
    const names: Record<string, string> = {
      speaker: t('audioOutput.speaker') || 'Speaker',
      earpiece: t('audioOutput.earpiece') || 'Earpiece',
      bluetooth: t('audioOutput.bluetooth') || 'Bluetooth',
      wired: t('audioOutput.wired') || 'Wired Headset',
      airplay: t('audioOutput.airplay') || 'AirPlay',
    };
    return names[device] || device;
  };

  const getDeviceIcon = (device: string): string => {
    const icons: Record<string, string> = {
      speaker: 'volume-high',
      earpiece: 'phone-portrait',
      bluetooth: 'bluetooth',
      wired: 'headset',
      airplay: 'logo-airplay',
    };
    return icons[device] || 'volume-high';
  };

  const getDeviceDescription = (device: string): string => {
    const descriptions: Record<string, string> = {
      speaker: t('audioOutput.speakerDesc') || 'Play audio through device speaker',
      earpiece: t('audioOutput.earpieceDesc') || 'Play audio through earpiece (for phone calls)',
      bluetooth: t('audioOutput.bluetoothDesc') || 'Route audio to connected Bluetooth device',
      wired: t('audioOutput.wiredDesc') || 'Route audio to wired headphones',
      airplay: t('audioOutput.airplayDesc') || 'Route audio to AirPlay device',
    };
    return descriptions[device] || '';
  };

  const renderDeviceOption = (device: string) => (
    <TouchableOpacity
      key={device}
      style={[
        styles.deviceOption,
        selectedDevice === device && styles.deviceOptionSelected,
      ]}
      onPress={() => handleSelectDevice(device)}
    >
      <View style={styles.deviceIconContainer}>
        <Ionicons
          name={getDeviceIcon(device) as any}
          size={28}
          color={selectedDevice === device ? theme.primary : theme.text}
        />
      </View>
      <View style={styles.deviceInfo}>
        <Text
          style={[
            styles.deviceName,
            selectedDevice === device && styles.deviceNameSelected,
          ]}
        >
          {getDeviceDisplayName(device)}
        </Text>
        <Text style={styles.deviceDescription}>
          {getDeviceDescription(device)}
        </Text>
      </View>
      {selectedDevice === device && (
        <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('audioOutput.title') || 'Audio Output'} showBackButton />

      <ScrollView style={styles.scrollView}>
        {/* Audio Routing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('audioOutput.audioRouting') || 'Audio Routing'}
          </Text>
          <Text style={styles.sectionDescription}>
            {t('audioOutput.audioRoutingDesc') ||
              'Route synthesized speech to virtual audio input (microphone) so other apps can hear it'}
          </Text>
          <View style={styles.routingToggle}>
            <View style={styles.routingInfo}>
              <Ionicons name="mic-outline" size={24} color={theme.primary} />
              <View style={styles.routingTextContainer}>
                <Text style={styles.routingTitle}>
                  {t('audioOutput.routeToMicrophone') || 'Route to Microphone'}
                </Text>
                <Text style={styles.routingDescription}>
                  {t('audioOutput.routeToMicrophoneDesc') ||
                    'Enable to use with Discord, Zoom, etc.'}
                </Text>
              </View>
            </View>
            <Switch
              value={isAudioRoutingEnabled}
              onValueChange={handleToggleAudioRouting}
              trackColor={{ false: theme.border, true: theme.primary + '80' }}
              thumbColor={isAudioRoutingEnabled ? theme.primary : '#f4f3f4'}
              ios_backgroundColor={theme.border}
            />
          </View>
          {Platform.OS === 'android' && (
            <View style={styles.warningContainer}>
              <Ionicons name="information-circle-outline" size={20} color={theme.warning} />
              <Text style={styles.warningText}>
                {t('audioOutput.androidNote') ||
                  'Android only: Requires microphone permissions and may not work on all devices'}
              </Text>
            </View>
          )}
        </View>

        {/* Audio Output Device Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('audioOutput.outputDevice') || 'Output Device'}
          </Text>
          <Text style={styles.sectionDescription}>
            {t('audioOutput.outputDeviceDesc') ||
              'Select where you want to hear the synthesized speech'}
          </Text>
          <View style={styles.devicesContainer}>
            {availableDevices.map((device) => renderDeviceOption(device))}
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <View style={styles.helpContainer}>
            <Ionicons name="help-circle-outline" size={24} color={theme.primary} />
            <View style={styles.helpTextContainer}>
              <Text style={styles.helpTitle}>
                {t('audioOutput.helpTitle') || 'How does this work?'}
              </Text>
              <Text style={styles.helpText}>
                {t('audioOutput.helpText') ||
                  'Audio routing allows you to use your synthesized voice in video calls, voice chats, and other apps that use your microphone. When enabled, the audio is sent to a virtual microphone input that other apps can access.'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 8,
    },
    sectionDescription: {
      fontSize: 14,
      color: theme.text + '80',
      marginBottom: 16,
      lineHeight: 20,
    },
    routingToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    routingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    routingTextContainer: {
      flex: 1,
      marginLeft: 12,
    },
    routingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    routingDescription: {
      fontSize: 13,
      color: theme.text + '60',
    },
    warningContainer: {
      flexDirection: 'row',
      backgroundColor: theme.warning + '15',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
      gap: 8,
    },
    warningText: {
      flex: 1,
      fontSize: 13,
      color: theme.warning,
      lineHeight: 18,
    },
    devicesContainer: {
      gap: 12,
    },
    deviceOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.border,
    },
    deviceOptionSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '10',
    },
    deviceIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    deviceInfo: {
      flex: 1,
    },
    deviceName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    deviceNameSelected: {
      color: theme.primary,
    },
    deviceDescription: {
      fontSize: 13,
      color: theme.text + '60',
      lineHeight: 18,
    },
    helpContainer: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
      gap: 12,
    },
    helpTextContainer: {
      flex: 1,
    },
    helpTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    helpText: {
      fontSize: 14,
      color: theme.text + '80',
      lineHeight: 20,
    },
  });

export default AudioOutputSettings;

