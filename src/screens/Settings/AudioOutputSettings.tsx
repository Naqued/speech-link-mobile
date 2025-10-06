import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../../contexts/ThemeContext';
import { ScreenHeader } from '../../components/UI/ScreenHeader';
import { Audio } from 'expo-av';
import nativeAudioOutput from '../../services/nativeAudioOutputService';

const AudioOutputSettings: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const styles = makeStyles(theme);

  // Audio routing - now with native Android support!

  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('speaker');
  const [hasNativeSupport, setHasNativeSupport] = useState<boolean>(false);

  useEffect(() => {
    loadAudioDevices();
    loadSavedDevicePreference();
    checkNativeSupport();
  }, []);

  const checkNativeSupport = () => {
    const hasNative = nativeAudioOutput.isAvailable();
    setHasNativeSupport(hasNative);
    console.log('[AudioOutput] Native audio routing available:', hasNative);
  };

  const loadSavedDevicePreference = async () => {
    try {
      const savedDevice = await AsyncStorage.getItem('selectedAudioDevice');
      if (savedDevice) {
        setSelectedDevice(savedDevice);
        console.log('[Audio] Loaded saved device preference:', savedDevice);
      }
    } catch (error) {
      console.error('[Audio] Failed to load device preference:', error);
    }
  };

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


  const handleSelectDevice = async (device: string) => {
    try {
      setSelectedDevice(device);
      
      // Configure Expo AV audio mode based on selected device
      // Base configuration that applies to all modes
      // IMPORTANT: Use DUCK_OTHERS (2) instead of DO_NOT_MIX (1) to avoid AudioFocusNotAcquiredException
      let audioMode: any = {
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: 2, // DUCK_OTHERS - lower volume of other apps
        interruptionModeAndroid: 2, // DUCK_OTHERS - prevents AudioFocusNotAcquiredException
      };

      if (Platform.OS === 'android') {
        // SIMPLE APPROACH: Let native module handle routing
        // Just configure Expo AV for normal media playback
        audioMode.shouldDuckAndroid = false;
        audioMode.playThroughEarpieceAndroid = false; // NEVER use earpiece for media!
        console.log('[Audio] Android: Configured for NORMAL media playback');
        console.log('[Audio] Native module will control routing to:', device);
      } else if (Platform.OS === 'ios') {
        switch (device) {
          case 'speaker':
            // On iOS, use playback category without mixing
            audioMode.allowsRecordingIOS = false;
            audioMode.interruptionModeIOS = 2; // DUCK_OTHERS
            console.log('[Audio] iOS: Configured for SPEAKER');
            break;
          case 'earpiece':
            // Earpiece mode
            audioMode.allowsRecordingIOS = false;
            audioMode.interruptionModeIOS = 2; // DUCK_OTHERS
            console.log('[Audio] iOS: Configured for EARPIECE');
            break;
          case 'bluetooth':
          case 'airplay':
            // Allow recording enables Bluetooth audio routing
            audioMode.allowsRecordingIOS = true;
            audioMode.interruptionModeIOS = 2; // DUCK_OTHERS
            console.log('[Audio] iOS: Configured for BLUETOOTH/AIRPLAY');
            break;
        }
      }

      await Audio.setAudioModeAsync(audioMode);
      console.log('[Audio] Audio mode set:', JSON.stringify(audioMode));

      // Save preference locally only (device-specific, not synced to backend)
      await AsyncStorage.setItem('selectedAudioDevice', device);
      
      console.log('[Audio] Device preference saved locally:', device);

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
                  'Select your preferred audio output device. This determines where you\'ll hear the synthesized speech. For communication during calls, use the Discord integration feature which provides better quality.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bluetooth Warning Section - Only show if native support is NOT available */}
        {!hasNativeSupport && (
          <View style={styles.section}>
            <View style={[styles.helpContainer, { borderLeftColor: theme.warning || '#FFA500' }]}>
              <Ionicons name="warning-outline" size={24} color={theme.warning || '#FFA500'} />
              <View style={styles.helpTextContainer}>
                <Text style={[styles.helpTitle, { color: theme.warning || '#FFA500' }]}>
                  {t('audioOutput.bluetoothWarning') || 'Limited Audio Control'}
                </Text>
                <Text style={styles.helpText}>
                  {t('audioOutput.bluetoothWarningText') ||
                    'Note: Native audio control is not available. When Bluetooth devices are connected, Android may automatically route audio to them. To use phone speaker, please disconnect or turn off Bluetooth devices.'}
                </Text>
              </View>
            </View>
          </View>
        )}
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

