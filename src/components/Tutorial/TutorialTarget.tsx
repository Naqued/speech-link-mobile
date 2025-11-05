import React, { useRef, useEffect } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTutorial } from '../../contexts/TutorialContext';

interface TutorialTargetProps {
  id: string;
  children: React.ReactNode;
  style?: ViewStyle;
  /**
   * If true, the wrapper will use flex: 1 to fill available space.
   * Use this for large containers like the voice collection content.
   * Default: false (wraps content without expanding)
   */
  fillContainer?: boolean;
}

/**
 * Wrapper component that registers a UI element as a tutorial target
 * Usage: <TutorialTarget id="my-button"><Button /></TutorialTarget>
 * For containers that need to fill space: <TutorialTarget id="content" fillContainer><Content /></TutorialTarget>
 */
export const TutorialTarget: React.FC<TutorialTargetProps> = ({ id, children, style, fillContainer = false }) => {
  const targetRef = useRef<View>(null);
  const { registerTarget, unregisterTarget } = useTutorial();

  useEffect(() => {
    // Register this target when component mounts
    registerTarget(id, targetRef);

    // Unregister when component unmounts
    return () => {
      unregisterTarget(id);
    };
  }, [id, registerTarget, unregisterTarget]);

  return (
    <View 
      ref={targetRef} 
      collapsable={false} 
      style={[fillContainer && styles.containerFill, style]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  containerFill: {
    flex: 1,
  },
});



