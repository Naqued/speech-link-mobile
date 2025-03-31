import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';

// Initialize audio recorder player
const audioRecorderPlayer = new AudioRecorderPlayer();

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');
  const [pulseAnim] = useState(new Animated.Value(1));
  
  // Effect for pulse animation
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 700,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }).stop();
    }
  }, [isRecording, pulseAnim]);

  const onStartRecord = async () => {
    try {
      setIsRecording(true);
      
      // Start recording
      const result = await audioRecorderPlayer.startRecorder();
      audioRecorderPlayer.addRecordBackListener((e: any) => {
        const time = audioRecorderPlayer.mmssss(Math.floor(e.currentPosition));
        setRecordTime(time.substring(0, 5));
      });
      
      console.log('Recording started', result);
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert(t('general.error'), 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const onStopRecord = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      
      // Stop recording
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecordTime('00:00');
      
      console.log('Recording stopped', result);
      
      // Simulate processing with the backend
      setTimeout(() => {
        // Simulate success response
        setIsProcessing(false);
        
        // Example of using speech synthesis
        Speech.speak('Hello, I am your voice assistant. How can I help you today?', {
          language: 'en',
          pitch: 1.0,
          rate: 0.9,
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert(t('general.error'), 'Failed to stop recording');
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const onCancelRecord = async () => {
    try {
      // Cancel recording
      await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecordTime('00:00');
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to cancel recording', error);
    }
  };

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{t('home.title')}</Text>
        
        <View style={styles.stateContainer}>
          {isProcessing ? (
            <>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.stateText}>{t('home.processing')}</Text>
            </>
          ) : (
            <Text style={styles.stateText}>
              {isRecording ? recordTime : t('home.ready')}
            </Text>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          {isRecording ? (
            <>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancelRecord}>
                <Text style={styles.cancelButtonText}>{t('home.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.stopButton} onPress={onStopRecord}>
                <View style={styles.stopIcon} />
              </TouchableOpacity>
            </>
          ) : (
            <Animated.View 
              style={[
                styles.recordButtonWrapper,
                { transform: [{ scale: isProcessing ? 1 : pulseAnim }] }
              ]}
            >
              <TouchableOpacity 
                style={[
                  styles.recordButton,
                  isProcessing && styles.recordButtonDisabled
                ]} 
                onPress={onStartRecord}
                disabled={isProcessing}
              >
                <Ionicons name="mic" size={40} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
        
        <Text style={styles.tapToSpeakText}>
          {isRecording ? '' : t('home.tap_to_speak')}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const buttonSize = width * 0.2 < 80 ? width * 0.2 : 80;

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 30,
  },
  stateContainer: {
    alignItems: 'center',
    marginBottom: 50,
    minHeight: 60,
    justifyContent: 'center',
  },
  stateText: {
    fontSize: 18,
    color: theme.text,
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  recordButtonWrapper: {
    borderRadius: buttonSize + 20,
    borderWidth: 1,
    borderColor: theme.primary + '40',
    width: buttonSize + 20,
    height: buttonSize + 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    backgroundColor: theme.primary,
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recordButtonDisabled: {
    backgroundColor: theme.primary + '80',
  },
  stopButton: {
    backgroundColor: theme.error,
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  stopIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  cancelButton: {
    marginRight: 20,
    padding: 10,
  },
  cancelButtonText: {
    color: theme.error,
    fontSize: 16,
    fontWeight: '600',
  },
  tapToSpeakText: {
    fontSize: 16,
    color: theme.text + '80',
    marginTop: 20,
  },
});

export default HomeScreen; 