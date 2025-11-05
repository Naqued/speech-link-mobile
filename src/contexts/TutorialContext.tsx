import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { TUTORIAL_STEPS, TutorialStep, TutorialStepId, TutorialTargetScreen } from '../config/tutorialSteps';
import { tutorialService } from '../services/tutorialService';

interface TutorialTargetRef {
  id: string;
  ref: React.RefObject<any>;
  measure: () => Promise<{ x: number; y: number; width: number; height: number }>;
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: TutorialStep | null;
  currentStepIndex: number;
  totalSteps: number;
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  registerTarget: (id: string, ref: React.RefObject<any>) => void;
  unregisterTarget: (id: string) => void;
  getTargetRef: (id: string) => TutorialTargetRef | undefined;
  setNavigationRef: (ref: any) => void;
  navigationRef: React.MutableRefObject<any>;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
};

interface TutorialProviderProps {
  children: React.ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targets, setTargets] = useState<Map<string, TutorialTargetRef>>(new Map());
  const navigationRef = useRef<any>(null);

  const currentStep = isActive ? TUTORIAL_STEPS[currentStepIndex] : null;
  const totalSteps = TUTORIAL_STEPS.length;

  const startTutorial = useCallback(async () => {
    console.log('[TutorialContext] Starting tutorial');
    setCurrentStepIndex(0);
    setIsActive(true);
    
    // Mark tutorial as started immediately
    await tutorialService.markTutorialStarted();
  }, []);

  const navigateToScreen = useCallback((screen: TutorialTargetScreen) => {
    if (screen === 'None') {
      console.log('[TutorialContext] No navigation needed for this step');
      return;
    }

    if (!navigationRef.current) {
      console.error('[TutorialContext] Navigation ref is not set!');
      return;
    }

    console.log('[TutorialContext] Navigating to screen:', screen);
    console.log('[TutorialContext] Navigation ref:', navigationRef.current);
    
    try {
      // Navigate to MainTabs first, then to the specific tab screen
      // This is needed because we're navigating from the Stack Navigator
      navigationRef.current.navigate('MainTabs', { screen });
      console.log('[TutorialContext] Navigation command sent successfully to MainTabs with screen:', screen);
    } catch (error) {
      console.error('[TutorialContext] Navigation error:', error);
    }
  }, []);

  const nextStep = useCallback(() => {
    console.log('[TutorialContext] Moving to next step, current index:', currentStepIndex);
    console.log('[TutorialContext] Total steps:', TUTORIAL_STEPS.length);
    
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = TUTORIAL_STEPS[nextIndex];
      
      console.log('[TutorialContext] Next step:', nextStep.id, 'requires navigation:', nextStep.requiresNavigation);
      
      // Navigate to the target screen if needed
      if (nextStep.requiresNavigation) {
        console.log('[TutorialContext] Navigating to:', nextStep.targetScreen);
        navigateToScreen(nextStep.targetScreen);
        
        // Add a small delay to allow navigation to complete
        setTimeout(() => {
          console.log('[TutorialContext] Setting step index to:', nextIndex);
          setCurrentStepIndex(nextIndex);
        }, 300);
      } else {
        console.log('[TutorialContext] Setting step index to:', nextIndex);
        setCurrentStepIndex(nextIndex);
      }
    } else {
      console.log('[TutorialContext] Tutorial complete');
      completeTutorial();
    }
  }, [currentStepIndex, navigateToScreen]);

  const previousStep = useCallback(() => {
    // Disabled - users cannot go back in the tutorial
    console.log('[TutorialContext] Back navigation is disabled');
  }, []);

  const skipTutorial = useCallback(() => {
    console.log('[TutorialContext] Skipping tutorial');
    setIsActive(false);
    setCurrentStepIndex(0);
  }, []);

  const completeTutorial = useCallback(() => {
    console.log('[TutorialContext] Completing tutorial');
    setIsActive(false);
    setCurrentStepIndex(0);
  }, []);

  const registerTarget = useCallback((id: string, ref: React.RefObject<any>) => {
    console.log('[TutorialContext] Registering target:', id);
    setTargets(prev => {
      const newTargets = new Map(prev);
      newTargets.set(id, {
        id,
        ref,
        measure: () => {
          return new Promise((resolve, reject) => {
            if (ref.current && ref.current.measureInWindow) {
              ref.current.measureInWindow((x: number, y: number, width: number, height: number) => {
                resolve({ x, y, width, height });
              });
            } else {
              reject(new Error('Target ref not available'));
            }
          });
        },
      });
      return newTargets;
    });
  }, []);

  const unregisterTarget = useCallback((id: string) => {
    console.log('[TutorialContext] Unregistering target:', id);
    setTargets(prev => {
      const newTargets = new Map(prev);
      newTargets.delete(id);
      return newTargets;
    });
  }, []);

  const getTargetRef = useCallback((id: string) => {
    return targets.get(id);
  }, [targets]);

  const setNavigationRef = useCallback((ref: any) => {
    navigationRef.current = ref;
  }, []);

  const value: TutorialContextType = {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    registerTarget,
    unregisterTarget,
    getTargetRef,
    setNavigationRef,
    navigationRef,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

