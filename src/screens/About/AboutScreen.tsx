import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';

const AboutScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.about')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>{t('app.name')}</Text>
          <Text style={styles.version}>{t('settings.version')} 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.description}>
            {t('about.description', 'Speech Link is a powerful voice enhancement application that helps you communicate more effectively. With features like text-to-speech, speech-to-text, and voice customization, you can express yourself clearly and confidently in any situation.')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.features', 'Features')}</Text>
          <View style={styles.featureItem}>
            <Ionicons name="mic" size={24} color={theme.primary} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>{t('about.voiceEnhancement', 'Voice Enhancement')}</Text>
              <Text style={styles.featureDescription}>
                {t('about.voiceEnhancementDesc', 'Crystal clear voice output with customizable settings')}
              </Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="text" size={24} color={theme.primary} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>{t('about.textToSpeech', 'Text to Speech')}</Text>
              <Text style={styles.featureDescription}>
                {t('about.textToSpeechDesc', 'Convert text to natural-sounding speech')}
              </Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="grid" size={24} color={theme.primary} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>{t('about.aacBoard', 'AAC Board')}</Text>
              <Text style={styles.featureDescription}>
                {t('about.aacBoardDesc', 'Quick access to commonly used phrases')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.legal', 'Legal')}</Text>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => Linking.openURL(`${process.env.APP_DOMAIN || 'https://speech-aac.link'}/${t('languages.en') === 'English' ? 'en' : 'fr'}/privacy-policy`)}
          >
            <Text style={styles.legalText}>{t('settings.privacy')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.text + '80'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => Linking.openURL(`${process.env.APP_DOMAIN || 'https://speech-aac.link'}/${t('languages.en') === 'English' ? 'en' : 'fr'}/terms-of-service`)}
          >
            <Text style={styles.legalText}>{t('settings.terms')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.text + '80'} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.primary,
    marginTop: 15,
  },
  version: {
    fontSize: 16,
    color: theme.text + '80',
    marginTop: 5,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  description: {
    fontSize: 16,
    color: theme.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: theme.text + '80',
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  legalText: {
    fontSize: 16,
    color: theme.text,
  },
});

export default AboutScreen; 