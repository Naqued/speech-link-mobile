import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export const LoginScreen = () => {
  const { login, isLoading, error } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.devButton}
          onPress={login}
          disabled={isLoading}
        >
          <Text style={styles.devButtonText}>🔧 Dev Login</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Speech Link</Text>
          <Text style={styles.subtitle}>Voice Enhancement App</Text>
          
          {error && (
            <Text style={styles.error}>{error}</Text>
          )}
          
          <TouchableOpacity
            style={styles.loginButton}
            onPress={login}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login with Development Token</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  devButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  devButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4A6FEA',
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: '#4A6FEA',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#FF3B30',
    marginBottom: 20,
    textAlign: 'center',
  },
}); 