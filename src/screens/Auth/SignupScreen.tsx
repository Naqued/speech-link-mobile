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
  Alert,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';

// Types
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type SignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Signup'>;

const SignupScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const { theme } = useContext(ThemeContext);
  const { signIn } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert(t('general.error'), 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('general.error'), 'Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert(t('general.error'), 'Please agree to the terms and conditions');
      return;
    }

    try {
      setIsLoading(true);
      // For demonstration, we're using a mock token
      // In a real app, you'd make an API call here
      await signIn('mock-token');
    } catch (error) {
      Alert.alert(t('general.error'), 'Signup failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('auth.createAccount')}</Text>
              <View style={styles.emptySpace} />
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={theme.text} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={theme.text + '80'}
                  value={name}
                  onChangeText={setName}
                />
              </View>
              
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
              
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.text} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.password')}
                  placeholderTextColor={theme.text + '80'}
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={togglePasswordVisibility} style={styles.visibilityIcon}>
                  <Ionicons 
                    name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color={theme.text}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.text} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor={theme.text + '80'}
                  secureTextEntry={!isConfirmPasswordVisible}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.visibilityIcon}>
                  <Ionicons 
                    name={isConfirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color={theme.text}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.termsContainer}>
                <TouchableOpacity 
                  style={styles.checkbox}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                >
                  {agreedToTerms ? (
                    <Ionicons name="checkbox" size={24} color={theme.primary} />
                  ) : (
                    <Ionicons name="square-outline" size={24} color={theme.text} />
                  )}
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  I agree to the 
                  <Text style={styles.termsLink}> Terms of Service </Text>
                  and
                  <Text style={styles.termsLink}> Privacy Policy</Text>
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSignup}
                disabled={isLoading}
              >
                <Text style={styles.signupButtonText}>{t('auth.signUp')}</Text>
              </TouchableOpacity>
              
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>{t('auth.alreadyHaveAccount')} </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  scrollViewContent: {
    flexGrow: 1,
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
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 10,
    marginBottom: 15,
    height: 55,
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
  visibilityIcon: {
    padding: 10,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 10,
  },
  termsText: {
    color: theme.text,
    fontSize: 14,
    flex: 1,
  },
  termsLink: {
    color: theme.primary,
    fontWeight: '500',
  },
  signupButton: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: theme.text,
    fontSize: 14,
  },
  loginLink: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SignupScreen; 