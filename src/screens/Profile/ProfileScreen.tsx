import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';

// Mock user data
const USER_DATA = {
  name: 'John Smith',
  email: 'john.smith@example.com',
  subscription: 'Premium',
  subscriptionExpiry: '2024-12-31',
  createdAt: '2023-04-15',
  imageUrl: 'https://ui-avatars.com/api/?name=John+Smith&background=4A6FEA&color=fff&size=200',
};

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(USER_DATA.name);
  const [email, setEmail] = useState(USER_DATA.email);

  const styles = makeStyles(theme);

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert(t('general.error'), 'Name and email are required');
      return;
    }
    
    // In a real app, you'd make an API call to update the profile
    USER_DATA.name = name;
    USER_DATA.email = email;
    
    Alert.alert(t('general.success'), 'Profile updated successfully');
    setIsEditing(false);
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // Revert changes if canceling edit mode
      setName(USER_DATA.name);
      setEmail(USER_DATA.email);
    }
    setIsEditing(!isEditing);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

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
            source={{ uri: USER_DATA.imageUrl }}
            style={styles.profileImage}
          />
          {isEditing ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
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
                placeholder="Your email"
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
              <Text style={styles.infoValue}>{USER_DATA.subscription}</Text>
              <View style={styles.subscriptionBadge}>
                <Text style={styles.subscriptionBadgeText}>Active</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Subscription Expiry</Text>
            <Text style={styles.infoValue}>{formatDate(USER_DATA.subscriptionExpiry)}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>{formatDate(USER_DATA.createdAt)}</Text>
          </View>
        </View>

        {isEditing && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t('general.save')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>Usage Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>124</Text>
              <Text style={styles.statLabel}>Phrases Used</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>37</Text>
              <Text style={styles.statLabel}>Recordings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>18</Text>
              <Text style={styles.statLabel}>Custom Voices</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>5h 12m</Text>
              <Text style={styles.statLabel}>Total Usage</Text>
            </View>
          </View>
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
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: theme.card,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: theme.text + '80',
  },
});

export default ProfileScreen; 