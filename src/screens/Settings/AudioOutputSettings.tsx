import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../../contexts/ThemeContext';
import { audioOutputService } from '../../services/audioOutputService';
import { AudioOutputMode } from '../../utils/audio/audioConfig';

const AudioOutputSettings: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const [currentMode, setCurrentMode] = useState<AudioOutputMode>(AudioOutputMode.DEFAULT);
  const [isLoading, setIsLoading] = useState(false);

  const styles = makeStyles(theme);

  useEffect(() => {
    loadCurrentMode();
  }, []);

  const loadCurrentMode = async () => {
    try {
      await audioOutputService.initialize();
      setCurrentMode(audioOutputService.getCurrentMode());
    } catch (error) {
      console.error('Error loading audio output mode:', error);
    }
  };

  const handleModeSelect = async (mode: AudioOutputMode) => {
    try {
      setIsLoading(true);
      await audioOutputService.setOutputMode(mode);
      setCurrentMode(mode);
      
      // Show confirmation
      Alert.alert(
        t('audioOutput.modeChanged'),
        t('audioOutput.modeChangedDescription'),
        [{ text: t('general.ok'), style: 'default' }]
      );
    } catch (error) {
      console.error('Error setting audio output mode:', error);
      Alert.alert(
        t('general.error'),
        t('audioOutput.errorChangingMode')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getModeIcon = (mode: AudioOutputMode): keyof typeof Ionicons.glyphMap => {
    switch (mode) {
      case AudioOutputMode.FORCE_SPEAKER:
        return 'volume-high';
      case AudioOutputMode.FORCE_EARPIECE:
        return 'headset';
      case AudioOutputMode.DEFAULT:
      default:
        return 'swap-horizontal';
    }
  };

  const availableModes = audioOutputService.getAvailableModes();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('audioOutput.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionDescription}>
            {t('audioOutput.description')}
          </Text>

          {availableModes.map((mode) => (
            <TouchableOpacity
              key={mode.value}
              style={[
                styles.modeOption,
                currentMode === mode.value && styles.modeOptionSelected,
              ]}
              onPress={() => handleModeSelect(mode.value)}
              disabled={isLoading}
            >
              <View style={styles.modeIconContainer}>
                <Ionicons
                  name={getModeIcon(mode.value)}
                  size={32}
                  color={currentMode === mode.value ? theme.primary : theme.text}
                />
              </View>

              <View style={styles.modeContent}>
                <View style={styles.modeTitleRow}>
                  <Text style={[
                    styles.modeTitle,
                    currentMode === mode.value && styles.modeTitleSelected
                  ]}>
                    {t(`audioOutput.modes.${mode.value}.label`)}
                  </Text>
                  {currentMode === mode.value && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                  )}
                </View>
                <Text style={styles.modeDescription}>
                  {t(`audioOutput.modes.${mode.value}.description`)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={theme.primary} />
            <Text style={styles.infoText}>
              {t('audioOutput.helpText')}
            </Text>
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
      fontWeight: '600',
      color: theme.text,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      padding: 16,
    },
    sectionDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 20,
      lineHeight: 20,
    },
    modeOption: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    modeOptionSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '10',
    },
    modeIconContainer: {
      marginRight: 16,
      justifyContent: 'center',
    },
    modeContent: {
      flex: 1,
    },
    modeTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    modeTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    modeTitleSelected: {
      color: theme.primary,
    },
    modeDescription: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    infoSection: {
      padding: 16,
      paddingTop: 8,
    },
    infoCard: {
      flexDirection: 'row',
      backgroundColor: theme.primary + '15',
      borderRadius: 12,
      padding: 16,
      alignItems: 'flex-start',
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
      marginLeft: 12,
      lineHeight: 18,
    },
  });

export default AudioOutputSettings;

