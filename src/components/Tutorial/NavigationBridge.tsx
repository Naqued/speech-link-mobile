import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTutorial } from '../../contexts/TutorialContext';

/**
 * Bridge component that connects React Navigation to the Tutorial Context
 * Must be rendered inside the NavigationContainer
 */
export const NavigationBridge: React.FC = () => {
  const navigation = useNavigation();
  const { setNavigationRef } = useTutorial();

  useEffect(() => {
    console.log('[NavigationBridge] Registering navigation object with tutorial context');
    setNavigationRef(navigation);
    
    return () => {
      console.log('[NavigationBridge] Unregistering navigation object');
    };
  }, [navigation, setNavigationRef]);

  // This component doesn't render anything
  return null;
};



