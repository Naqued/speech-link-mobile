import React, { useContext, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';

const TermsOfServiceScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);

  const styles = makeStyles(theme);

  const termsOfServiceUrl = `https://speech-aac.link/${i18n.language}/terms`;

  useEffect(() => {
    // Open the terms page in the in-app browser
    const openTerms = async () => {
      try {
        await WebBrowser.openBrowserAsync(termsOfServiceUrl);
        // Navigate back when the browser is closed
        navigation.goBack();
      } catch (error) {
        console.error('Error opening terms:', error);
        navigation.goBack();
      }
    };

    openTerms();
  }, [termsOfServiceUrl, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>{t('general.loading', 'Loading...')}</Text>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.text,
  },
});

export default TermsOfServiceScreen; 