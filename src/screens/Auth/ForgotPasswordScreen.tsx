import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';

// Types
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { theme } = useContext(ThemeContext);

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(t('general.error'), 'Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      // For demonstration, we're just showing success
      // In a real app, you'd make an API call here
      setTimeout(() => {
        setResetSent(true);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      Alert.alert(t('general.error'), 'Failed to send reset email');
      console.error(error);
      setIsLoading(false);
    }
  };

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('auth.forgotPassword')}</Text>
              <View style={styles.emptySpace} />
            </View>

            <View style={styles.contentContainer}>
              {!resetSent ? (
                <>
                  <Text style={styles.instructionText}>
                    Enter your email address and we'll send you a link to reset your password.
                  </Text>
                  
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color={theme.text} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('auth.email')}
                      placeholderTextColor={theme.text + '80'}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                  
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleResetPassword}
                    disabled={isLoading}
                  >
                    <Text style={styles.resetButtonText}>Send Reset Link</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={80} color={theme.success} style={styles.successIcon} />
                  <Text style={styles.successTitle}>Reset Email Sent</Text>
                  <Text style={styles.successText}>
                    We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                  </Text>
                  <TouchableOpacity
                    style={styles.backToLoginButton}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <Text style={styles.backToLoginText}>Back to Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingTop: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  emptySpace: {
    width: 34, // Same width as the back button for proper centering
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  instructionText: {
    fontSize: 16,
    color: theme.text,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 10,
    marginBottom: 25,
    height: 55,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  inputIcon: {
    marginLeft: 15,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.text,
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 15,
  },
  successText: {
    fontSize: 16,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  backToLoginButton: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  backToLoginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen; 