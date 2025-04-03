import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'success',
  duration = 3000, // Default duration is 3 seconds
  onHide,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible && !isVisible) {
      setIsVisible(true);
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // Auto-hide after duration
      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    } else if (!visible && isVisible) {
      hideToast();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, isVisible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsVisible(false);
      if (onHide) {
        onHide();
      }
    });
  };

  if (!isVisible) return null;

  // Determine icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={24} color="#fff" />;
      case 'error':
        return <Ionicons name="alert-circle" size={24} color="#fff" />;
      case 'info':
        return <Ionicons name="information-circle" size={24} color="#fff" />;
      default:
        return <Ionicons name="checkmark-circle" size={24} color="#fff" />;
    }
  };

  // Determine background color based on type
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#28a745';
      case 'error':
        return '#dc3545';
      case 'info':
        return '#17a2b8';
      default:
        return '#28a745';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <View style={styles.content}>
        {getIcon()}
        <Text style={styles.message}>{message}</Text>
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={hideToast}>
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: '#28a745',
    borderRadius: 8,
    minWidth: width * 0.8,
    maxWidth: width * 0.9,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    flexShrink: 1,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default Toast; 