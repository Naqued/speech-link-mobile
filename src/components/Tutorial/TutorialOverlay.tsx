import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTutorial } from '../../contexts/TutorialContext';
import { ThemeContext } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const TutorialOverlay: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    previousStep,
    skipTutorial,
    getTargetRef,
  } = useTutorial();

  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [targetLayout, setTargetLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const styles = makeStyles(theme);

  // Measure target element position when step changes
  useEffect(() => {
    if (isActive && currentStep && currentStep.targetId) {
      const targetRef = getTargetRef(currentStep.targetId);
      
      if (targetRef) {
        console.log('[TutorialOverlay] Found target ref for:', currentStep.targetId);
        
        // Add a delay to allow scrolling to complete before measuring
        const measureTimeout = setTimeout(() => {
          // Measure the target element
          targetRef.measure().then((layout) => {
            console.log('[TutorialOverlay] Target layout:', layout);
            setTargetLayout(layout);
          }).catch((error) => {
            console.error('[TutorialOverlay] Error measuring target:', error);
            setTargetLayout(null);
          });
        }, 500); // Wait for scroll animation to complete
        
        return () => clearTimeout(measureTimeout);
      } else {
        console.log('[TutorialOverlay] No target ref found for:', currentStep.targetId);
        setTargetLayout(null);
      }
    } else {
      setTargetLayout(null);
    }
  }, [isActive, currentStep, getTargetRef]);

  // Debug logging
  useEffect(() => {
    if (isActive && currentStep) {
      console.log('[TutorialOverlay] Current step:', currentStep.id, 'index:', currentStepIndex);
    }
  }, [isActive, currentStep, currentStepIndex]);

  if (!isActive || !currentStep) {
    return null;
  }

  const handleNextClick = () => {
    console.log('[TutorialOverlay] Next button clicked');
    nextStep();
  };

  const handlePreviousClick = () => {
    console.log('[TutorialOverlay] Previous button clicked');
    previousStep();
  };

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Check if this is a center placement (welcome or complete screens)
  const isCenterPlacement = currentStep.placement === 'center';

  // For center placement (welcome/complete), use same tap-anywhere design but centered
  if (isCenterPlacement) {
    return (
      <Modal
        visible={isActive}
        transparent
        animationType="fade"
        onRequestClose={() => skipTutorial()}
      >
        <TouchableOpacity 
          style={styles.centerOverlayContainer}
          activeOpacity={1}
          onPress={handleNextClick}
        >
          <View style={styles.centerCard}>
            <View style={styles.centerIconContainer}>
              {currentStep.id === 'welcome' ? (
                <Ionicons name="hand-right" size={50} color={theme.primary} />
              ) : (
                <Ionicons name="checkmark-circle" size={50} color={theme.success || theme.primary} />
              )}
            </View>

            <Text style={styles.centerCardTitle}>
              {t(currentStep.titleKey)}
            </Text>

            <Text style={styles.centerCardMessage}>
              {t(currentStep.messageKey)}
            </Text>

            <View style={styles.compactProgressContainer}>
              <View style={styles.progressDots}>
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      index === currentStepIndex && styles.progressDotActive,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.compactProgressText}>
                {currentStepIndex + 1}/{totalSteps}
              </Text>
            </View>

            <Text style={styles.tapAnywherHint}>
              {isLastStep 
                ? (t('tutorial.tapToFinish') || 'Tap anywhere to finish')
                : (t('tutorial.tapAnywhere') || 'Tap anywhere to continue')}
            </Text>
          </View>

          {/* Small Skip Button */}
          <TouchableOpacity
            style={styles.skipButtonCompact}
            onPress={(e) => {
              e.stopPropagation();
              skipTutorial();
            }}
          >
            <Ionicons name="close-circle-outline" size={16} color={theme.text} style={{ marginRight: 6 }} />
            <Text style={styles.skipButtonCompactText}>{t('tutorial.skip')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }

  // For regular steps with targets - show spotlight overlay
  return (
    <>
      <Modal
        visible={isActive}
        transparent
        animationType="fade"
        onRequestClose={() => skipTutorial()}
      >
        <TouchableOpacity 
          style={styles.lightOverlayContainer}
          activeOpacity={1}
          onPress={handleNextClick}
        >
          {/* Spotlight effect - darken everything except target */}
          {targetLayout && renderSpotlight()}
          
          {/* Tooltip positioned based on target */}
          {targetLayout && (
            <View 
              style={[
                styles.compactTooltip,
                getTooltipPosition()
              ]}
              pointerEvents="box-none"
            >
              {renderCompactTooltipContent()}
            </View>
          )}
          
          {/* Small Skip Button */}
          <TouchableOpacity
            style={styles.skipButtonCompact}
            onPress={(e) => {
              e.stopPropagation();
              skipTutorial();
            }}
          >
            <Ionicons name="close-circle-outline" size={16} color={theme.text} style={{ marginRight: 6 }} />
            <Text style={styles.skipButtonCompactText}>{t('tutorial.skip')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );

  function renderSpotlight() {
    if (!targetLayout) return null;

    const padding = 8; // Padding around the highlighted element
    const spotlightX = targetLayout.x - padding;
    const spotlightY = targetLayout.y - padding;
    const spotlightWidth = targetLayout.width + padding * 2;
    const spotlightHeight = targetLayout.height + padding * 2;

    // Use blur effect for dictionary/pronunciation step
    const useBlur = currentStep?.id === 'pronunciation';
    const OverlayComponent = useBlur ? BlurView : View;
    const overlayProps = useBlur 
      ? { intensity: 15, tint: 'dark' as const, style: styles.blurOverlay }
      : { style: styles.overlaySection };

    return (
      <>
        {/* Top overlay */}
        <OverlayComponent 
          {...overlayProps}
          style={[
            useBlur ? styles.blurOverlay : styles.overlaySection, 
            {
              top: 0,
              left: 0,
              right: 0,
              height: Math.max(0, spotlightY),
            }
          ]} 
        />

        {/* Left overlay */}
        <OverlayComponent 
          {...overlayProps}
          style={[
            useBlur ? styles.blurOverlay : styles.overlaySection,
            {
              top: spotlightY,
              left: 0,
              width: Math.max(0, spotlightX),
              height: spotlightHeight,
            }
          ]} 
        />

        {/* Right overlay */}
        <OverlayComponent 
          {...overlayProps}
          style={[
            useBlur ? styles.blurOverlay : styles.overlaySection,
            {
              top: spotlightY,
              left: spotlightX + spotlightWidth,
              right: 0,
              height: spotlightHeight,
            }
          ]} 
        />

        {/* Bottom overlay */}
        <OverlayComponent 
          {...overlayProps}
          style={[
            useBlur ? styles.blurOverlay : styles.overlaySection,
            {
              top: spotlightY + spotlightHeight,
              left: 0,
              right: 0,
              bottom: 0,
            }
          ]} 
        />

        {/* Pulsing highlight border */}
        <View style={[styles.highlightBorder, {
          position: 'absolute',
          top: spotlightY,
          left: spotlightX,
          width: spotlightWidth,
          height: spotlightHeight,
          borderRadius: 12,
        }]} />
      </>
    );
  }

  function getTooltipPosition() {
    if (!targetLayout) return { 
      position: 'absolute' as const, 
      bottom: 40,
      left: (screenWidth - 280) / 2, // Center with 280px width
    };

    const tooltipHeight = 140; // Compact height estimate
    const spaceAbove = targetLayout.y;
    const spaceBelow = screenHeight - (targetLayout.y + targetLayout.height);

    // Center horizontally relative to screen
    const left = (screenWidth - 280) / 2;

    // Position tooltip below target if there's more space, otherwise above
    if (spaceBelow > tooltipHeight + 40 || spaceBelow > spaceAbove) {
      return {
        position: 'absolute' as const,
        top: targetLayout.y + targetLayout.height + 16,
        left,
      };
    } else {
      return {
        position: 'absolute' as const,
        bottom: screenHeight - targetLayout.y + 16,
        left,
      };
    }
  }

  function renderCompactTooltipContent() {
    return (
      <View style={styles.compactTooltipContent}>
        <Text style={styles.compactTitle}>
          {t(currentStep!.titleKey)}
        </Text>
        
        <Text style={styles.compactMessage}>
          {t(currentStep!.messageKey)}
        </Text>

        <View style={styles.compactProgressContainer}>
          <View style={styles.progressDots}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStepIndex && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.compactProgressText}>
            {currentStepIndex + 1}/{totalSteps}
          </Text>
        </View>

        <Text style={styles.tapAnywherHint}>
          {t('tutorial.tapAnywhere') || 'Tap anywhere to continue'}
        </Text>
      </View>
    );
  }

};


const makeStyles = (theme: any) => StyleSheet.create({
  // Light overlay container - tap anywhere to advance
  lightOverlayContainer: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent - we'll use overlaySection instead
    justifyContent: 'flex-end',
    padding: 0,
    paddingBottom: 0,
  },
  // Overlay sections that darken everything except spotlight
  overlaySection: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker for better contrast
    pointerEvents: 'none',
  },
  // Blur overlay for dictionary step (light blur effect)
  blurOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Very light overlay for blur
    pointerEvents: 'none',
  },
  // Highlight border around target element
  highlightBorder: {
    borderWidth: 3,
    borderColor: theme.primary,
    backgroundColor: 'transparent',
    pointerEvents: 'none',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  // Compact tooltip - positioned dynamically near target
  compactTooltip: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    paddingHorizontal: 18,
    width: 280, // Fixed width for consistency
    alignSelf: 'center', // Center horizontally without expanding
    flexShrink: 0, // Don't shrink
    flexGrow: 0, // Don't grow
    maxHeight: 200, // Limit maximum height
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
    // Default position (will be overridden by dynamic positioning)
    position: 'absolute',
    bottom: 100,
  },
  compactTooltipContent: {
    alignItems: 'center',
    flexShrink: 1,
    flexGrow: 0,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  compactMessage: {
    fontSize: 13,
    color: theme.text + 'DD',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  compactProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 4,
  },
  progressDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.text + '30',
  },
  progressDotActive: {
    backgroundColor: theme.primary,
    width: 16,
  },
  compactProgressText: {
    fontSize: 11,
    color: theme.text + '80',
    fontWeight: '500',
  },
  tapAnywherHint: {
    fontSize: 11,
    color: theme.text + '60',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Small skip button - always at bottom
  skipButtonCompact: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: theme.text + '20',
    borderWidth: 1.5,
    borderColor: theme.text + '40',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  skipButtonCompactText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  // Center overlay for welcome/complete
  centerOverlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centerCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    paddingHorizontal: 24,
    width: 300, // Fixed width like compact tooltip
    alignItems: 'center',
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  centerIconContainer: {
    marginBottom: 12,
  },
  centerCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  centerCardMessage: {
    fontSize: 13,
    color: theme.text + 'DD',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 12,
  },
});

