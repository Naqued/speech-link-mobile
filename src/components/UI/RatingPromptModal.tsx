import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

interface RatingPromptModalProps {
  visible: boolean;
  onRate: () => void;
  onDismiss: () => void;
  theme: any;
}

const RatingPromptModal: React.FC<RatingPromptModalProps> = ({
  visible,
  onRate,
  onDismiss,
  theme,
}) => {
  const { t } = useTranslation();
  const isDark = theme.background === '#121212';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.card }]}>
          {/* Header with gradient */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="star" size={48} color="#FFD700" />
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.text }]}>
              {t('rating.title')}
            </Text>
            
            <Text style={[styles.message, { color: theme.textLight }]}>
              {t('rating.message')}
            </Text>

            <Text style={[styles.subMessage, { color: theme.textLight }]}>
              {t('rating.subMessage')}
            </Text>

            {/* Star Icons */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={32}
                  color="#FFD700"
                  style={styles.star}
                />
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.rateButton]}
              onPress={onRate}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rateButtonGradient}
              >
                <Ionicons name="heart" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.rateButtonText}>
                  {t('rating.rateButton')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dismissButton, 
                { 
                  borderColor: theme.border,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                }
              ]}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Text style={[styles.dismissButtonText, { color: theme.text }]}>
                {t('rating.dismissButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: Math.min(width - 40, 400),
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  star: {
    marginHorizontal: 4,
  },
  actions: {
    padding: 20,
    paddingTop: 0,
  },
  rateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  rateButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default RatingPromptModal;



