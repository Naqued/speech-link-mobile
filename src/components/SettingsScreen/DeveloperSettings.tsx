import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Linking, ScrollView } from 'react-native';
import { ThemeContext } from '../../contexts/ThemeContext';
import { resetService } from '../../services/resetService';
import { AuthContext } from '../../contexts/AuthContext';
import { NativeModuleChecker } from '../../utils/audio/NativeModuleChecker';

const DeveloperSettings = () => {
  const { theme } = useContext(ThemeContext);
  const { signOut } = useContext(AuthContext);
  const [nativeModules, setNativeModules] = useState<string[]>([]);
  const [showModules, setShowModules] = useState(false);

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'How would you like to reset the app?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear & Reload',
          onPress: async () => {
            try {
              await resetService.resetAppCompletely();
            } catch (error) {
              console.error('Failed to reset app:', error);
              Alert.alert(
                'Reset Failed',
                'Something went wrong while resetting the app. Please try again or restart manually.'
              );
            }
          }
        },
        {
          text: 'Clear & Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetService.clearAsyncStorage();
              await resetService.clearCacheDirectories();
              // Sign out to fully reset the auth state
              signOut();
              
              Alert.alert(
                'Reset Complete',
                'App data has been cleared and you have been signed out. The app will now reload.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Try to force reload using DevSettings
                      try {
                        const DevSettings = require('react-native').DevSettings;
                        if (DevSettings && DevSettings.reload) {
                          DevSettings.reload();
                        }
                      } catch (e) {
                        console.warn('Could not reload automatically', e);
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Failed to reset app:', error);
              Alert.alert(
                'Reset Failed',
                'Something went wrong while resetting the app. Please try again or restart manually.'
              );
            }
          }
        },
        {
          text: 'Nuclear Option',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetService.clearAsyncStorage();
              await resetService.clearCacheDirectories();
              
              Alert.alert(
                'App Data Cleared',
                'All app data has been cleared. For a complete reset, please force close the app and relaunch it.',
                [
                  {
                    text: 'OK',
                  }
                ]
              );
            } catch (error) {
              console.error('Failed to clear app data:', error);
              Alert.alert(
                'Reset Failed',
                'Something went wrong while clearing app data.'
              );
            }
          }
        }
      ]
    );
  };

  const checkNativeModules = () => {
    const modules = NativeModuleChecker.listAvailableModules();
    setNativeModules(modules);
    setShowModules(true);
    
    // Also check for AudioRouterModule specifically
    const isAudioRouterAvailable = NativeModuleChecker.isAudioRouterModuleAvailable();
    Alert.alert(
      'AudioRouterModule Check',
      isAudioRouterAvailable 
        ? 'AudioRouterModule is available! ✅' 
        : 'AudioRouterModule is NOT available! ❌\n\nCheck the list of available modules below.'
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Developer Settings</Text>
      
      <View style={styles.settingRow}>
        <TouchableOpacity 
          style={[styles.resetButton, { backgroundColor: theme.error }]}
          onPress={handleResetApp}
        >
          <Text style={styles.resetButtonText}>Reset App Data</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.warningText, { color: theme.error }]}>
        Warning: Resetting the app will clear all cached data and preferences.
      </Text>
      
      <View style={[styles.section, { marginTop: 24 }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Native Module Checker</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={checkNativeModules}
        >
          <Text style={styles.buttonText}>Check Native Modules</Text>
        </TouchableOpacity>
        
        {showModules && (
          <View style={[styles.modulesContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.modulesTitle, { color: theme.text }]}>
              Available Native Modules ({nativeModules.length}):
            </Text>
            <ScrollView style={styles.modulesList}>
              {nativeModules.map((moduleName, index) => (
                <Text key={index} style={[styles.moduleItem, { color: moduleName === 'AudioRouterModule' ? theme.success : theme.text }]}>
                  {moduleName} {moduleName === 'AudioRouterModule' ? '✓' : ''}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  resetButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  warningText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modulesContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    maxHeight: 250,
  },
  modulesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modulesList: {
    maxHeight: 200,
  },
  moduleItem: {
    fontSize: 12,
    paddingVertical: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  }
});

export default DeveloperSettings; 