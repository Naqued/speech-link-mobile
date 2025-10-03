import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  buttonText?: string;
  showIcon?: boolean;
  style?: object;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  buttonText,
  showIcon = true,
  style
}) => {
  const { t } = useTranslation();
  const { loginWithGoogle, isAuthenticatingWithGoogle } = useContext(AuthContext);

  const handlePress = async () => {
    try {
      const success = await loginWithGoogle();
      if (success) {
        onSuccess?.();
      } else {
        onError?.('Failed to authenticate with Google. Please try again.');
      }
    } catch (error) {
      console.error('Error in Google login:', error);
      onError?.('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={isAuthenticatingWithGoogle}
    >
      {isAuthenticatingWithGoogle ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.buttonContent}>
          {showIcon && (
            <Ionicons
              name="logo-google"
              size={20}
              color="#fff"
              style={styles.icon}
            />
          )}
          <Text style={styles.buttonText}>
            {buttonText || t('login.continueWithGoogle', 'Continue with Google')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginRight: 10,
  },
});

export default GoogleAuthButton; 