import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Context
import { ThemeContext } from '../../contexts/ThemeContext';

interface ScreenHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
  style?: any;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBackButton = false,
  rightComponent,
  onBackPress,
  style,
}) => {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Track orientation changes for responsive design
  const [orientation, setOrientation] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'landscape' : 'portrait'
  );
  
  // Get screen dimensions for responsive header height
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;
  
  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const newOrientation = window.width > window.height ? 'landscape' : 'portrait';
      if (newOrientation !== orientation) {
        setOrientation(newOrientation);
      }
    });

    return () => subscription?.remove();
  }, [orientation]);
  
  const styles = makeStyles(theme, insets, isLandscape);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.headerContainer, style]}>
      <View style={styles.headerContent}>
        {showBackButton ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerLeft} />
        )}
        
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        
        <View style={styles.headerRight}>
          {rightComponent}
        </View>
      </View>
    </View>
  );
};

const makeStyles = (theme: any, insets: any, isLandscape: boolean) => StyleSheet.create({
  headerContainer: {
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: isLandscape ? 50 : 60, // Reduced height in landscape mode
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    fontSize: isLandscape ? 16 : 20, // Smaller font in landscape
    fontWeight: 'bold',
    color: theme.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});

export default ScreenHeader; 