import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext, themes } from '../../contexts/ThemeContext';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
  textStyle?: any;
  iconOnly?: boolean;
  showText?: boolean;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  size = 'medium',
  style,
  textStyle,
  iconOnly = false,
  showText = true,
}) => {
  const { theme } = useContext(ThemeContext);
  const styles = makeStyles(theme);
  const isDark = theme === themes.dark;

  const sizeConfig = {
    small: {
      iconSize: 12,
      fontSize: 10,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
    },
    medium: {
      iconSize: 16,
      fontSize: 12,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
    },
    large: {
      iconSize: 20,
      fontSize: 14,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
  };

  const config = sizeConfig[size];

  const badgeStyle = [
    styles.badge,
    {
      paddingHorizontal: config.paddingHorizontal,
      paddingVertical: config.paddingVertical,
      borderRadius: config.borderRadius,
    },
    style,
  ];

  const iconColor = isDark ? '#FFD700' : '#FFA500';

  if (iconOnly) {
    return (
      <View style={[styles.iconOnlyContainer, style]}>
        <MaterialIcons 
          name="workspace-premium" 
          size={config.iconSize} 
          color={iconColor}
        />
      </View>
    );
  }

  return (
    <View style={badgeStyle}>
      <MaterialIcons 
        name="workspace-premium" 
        size={config.iconSize} 
        color={iconColor}
        style={styles.icon}
      />
      {showText && (
        <Text style={[styles.text, { fontSize: config.fontSize }, textStyle]}>
          Premium
        </Text>
      )}
    </View>
  );
};

const makeStyles = (theme: any) => {
  const isDark = theme === themes.dark;
  
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 165, 0, 0.15)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 165, 0, 0.3)',
    },
    iconOnlyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      marginRight: 3,
    },
    text: {
      fontWeight: '600',
      color: isDark ? '#FFD700' : '#FF8C00',
    },
  });
};

export default PremiumBadge; 