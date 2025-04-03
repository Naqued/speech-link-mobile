import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';

// Services
import { profileService } from '../../services/profileService';
import { UserProfile } from '../../types/profile';

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const styles = makeStyles(theme);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
      setName(data.user.name || '');
      setEmail(data.user.email);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert(t('general.error'), t('profile.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert(t('general.error'), t('profile.requiredFields'));
      return;
    }
    
    try {
      setIsLoading(true);
      await profileService.updateProfile({
        name: name.trim(),
        email: email.trim()
      });
      
      Alert.alert(t('general.success'), t('profile.updateSuccess'));
      setIsEditing(false);
      loadProfile(); // Reload profile to get latest data
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(t('general.error'), t('profile.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // Revert changes if canceling edit mode
      setName(profile?.user.name || '');
      setEmail(profile?.user.email || '');
    }
    setIsEditing(!isEditing);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('profile.loadError')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>{t('general.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <TouchableOpacity style={styles.editButton} onPress={toggleEditMode}>
          <Text style={styles.editButtonText}>
            {isEditing ? t('general.cancel') : t('general.edit')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <Image
            source={{ 
              uri: profile.user.image || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4A6FEA&color=fff&size=200` 
            }}
            style={styles.profileImage}
          />
          {isEditing ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder={t('profile.namePlaceholder')}
                placeholderTextColor={theme.text + '80'}
              />
            </View>
          ) : (
            <Text style={styles.profileName}>{name}</Text>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('profile.email')}</Text>
            {isEditing ? (
              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={setEmail}
                placeholder={t('profile.emailPlaceholder')}
                placeholderTextColor={theme.text + '80'}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.infoValue}>{email}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('profile.subscription')}</Text>
            <View style={styles.subscriptionContainer}>
              <Text style={styles.infoValue}>
                {profile.subscription?.tier || t('profile.freeTier')}
              </Text>
              {profile.subscription?.status === 'active' && (
                <View style={styles.subscriptionBadge}>
                  <Text style={styles.subscriptionBadgeText}>
                    {t('profile.active')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {profile.subscription?.currentPeriodEnd && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('profile.subscriptionExpiry')}</Text>
              <Text style={styles.infoValue}>
                {formatDate(profile.subscription.currentPeriodEnd)}
              </Text>
            </View>
          )}

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('profile.memberSince')}</Text>
            <Text style={styles.infoValue}>
              {formatDate(profile.user.memberSince)}
            </Text>
          </View>

          {profile.usage && (
            <>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('profile.creditsUsed')}</Text>
                <Text style={styles.infoValue}>
                  {profile.usage.creditsUsed.total} / {profile.usage.creditsTotal}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('profile.nextReset')}</Text>
                <Text style={styles.infoValue}>
                  {formatDate(profile.usage.nextResetDate)}
                </Text>
              </View>
            </>
          )}
        </View>

        {isEditing && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t('general.save')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: theme.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.buttonText,
    fontSize: 16,
    fontWeight: '500',
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
  editButton: {
    padding: 8,
  },
  editButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: theme.primary,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  editNameContainer: {
    width: '70%',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginBottom: 5,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    padding: 8,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  infoItem: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.text + '80',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 18,
    color: theme.text,
  },
  emailInput: {
    fontSize: 18,
    color: theme.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    padding: 8,
    paddingLeft: 0,
  },
  subscriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionBadge: {
    backgroundColor: theme.success,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  subscriptionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: theme.primary,
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 