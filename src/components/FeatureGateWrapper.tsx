/**
 * FeatureGateWrapper Component
 * 
 * Wrapper that fetches user data and provides it to FeatureGateProvider
 */

import React, { useEffect, useState } from 'react';
import { FeatureGateProvider } from '../contexts/FeatureGateContext';
import { useVoiceSettings } from '../hooks/useVoiceSettings';

interface FeatureGateWrapperProps {
  children: React.ReactNode;
}

export const FeatureGateWrapper: React.FC<FeatureGateWrapperProps> = ({ children }) => {
  const { userSettings, profileData } = useVoiceSettings();
  
  // Get user plan and selected model
  const userPlan = profileData?.subscription?.tier || null;
  const selectedModel = userSettings?.voiceSettings?.modelId || null;
  
  // Debug logging to track model changes
  React.useEffect(() => {
    console.log('[FeatureGateWrapper] Settings changed:', {
      userPlan,
      selectedModel,
      fullSettings: userSettings?.voiceSettings
    });
  }, [userPlan, selectedModel, userSettings]);
  
  return (
    <FeatureGateProvider userPlan={userPlan} selectedModel={selectedModel}>
      {children}
    </FeatureGateProvider>
  );
};

