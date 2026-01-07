import { Voice } from './ttsService';
import { canAccessPremiumVoices, getVoiceAccessLevel, isVoiceAccessible } from '../config/plans';

export type VoiceAccessLevel = 'basic' | 'premium';

export interface VoiceAccessResult {
  canPreview: boolean;
  canSelect: boolean;
  canFavorite: boolean;
  accessLevel: VoiceAccessLevel;
  requiresUpgrade: boolean;
}

class VoiceAccessService {
  private static instance: VoiceAccessService;

  private constructor() {}

  public static getInstance(): VoiceAccessService {
    if (!VoiceAccessService.instance) {
      VoiceAccessService.instance = new VoiceAccessService();
    }
    return VoiceAccessService.instance;
  }

  /**
   * Check if user can access premium voices based on their plan
   */
  public canAccessPremiumVoices(userPlan: string | undefined): boolean {
    return canAccessPremiumVoices(userPlan);
  }

  /**
   * Check if a specific voice is accessible to the user
   */
  public isVoiceAccessible(voice: Voice, userPlan: string | undefined): boolean {
    return isVoiceAccessible(voice.accessLevel, userPlan);
  }

  /**
   * Get the user's voice access level based on their plan
   */
  public getVoiceAccessLevel(userPlan: string | undefined): VoiceAccessLevel {
    return getVoiceAccessLevel(userPlan);
  }

  /**
   * Check if user can preview a specific voice
   */
  public canPreviewVoice(voice: Voice, userPlan: string | undefined): boolean {
    // Premium voices require premium plan for preview
    if (voice.isPremium || voice.accessLevel === 'premium') {
      return this.canAccessPremiumVoices(userPlan);
    }
    return true; // Basic voices can always be previewed
  }

  /**
   * Check if user can select a specific voice as their default
   */
  public canSelectVoice(voice: Voice, userPlan: string | undefined): boolean {
    // Same logic as preview - premium voices require premium plan
    if (voice.isPremium || voice.accessLevel === 'premium') {
      return this.canAccessPremiumVoices(userPlan);
    }
    return true; // Basic voices can always be selected
  }

  /**
   * Check if user can favorite a voice (always allowed regardless of plan)
   */
  public canFavoriteVoice(voice: Voice, userPlan: string | undefined): boolean {
    // Users can favorite any voice regardless of their plan
    // This allows them to save premium voices for when they upgrade
    return true;
  }

  /**
   * Get comprehensive access information for a voice
   */
  public getVoiceAccess(voice: Voice, userPlan: string | undefined): VoiceAccessResult {
    const isPremiumVoice = voice.isPremium || voice.accessLevel === 'premium';
    const hasAccessToPremium = this.canAccessPremiumVoices(userPlan);
    
    return {
      canPreview: isPremiumVoice ? hasAccessToPremium : true,
      canSelect: isPremiumVoice ? hasAccessToPremium : true,
      canFavorite: true, // Always allow favoriting
      accessLevel: isPremiumVoice ? 'premium' : 'basic',
      requiresUpgrade: isPremiumVoice && !hasAccessToPremium,
    };
  }

  /**
   * Mark a voice with appropriate access level based on its source
   */
  public markVoiceAccess(voice: Voice, isFromPremiumEndpoint: boolean = false): Voice {
    return {
      ...voice,
      isPremium: isFromPremiumEndpoint,
      accessLevel: isFromPremiumEndpoint ? 'premium' : 'basic',
    };
  }

  /**
   * Filter voices based on user access (for selection lists)
   */
  public filterAccessibleVoices(voices: Voice[], userPlan: string | undefined): Voice[] {
    return voices.filter(voice => this.isVoiceAccessible(voice, userPlan));
  }

  /**
   * Sort voices with accessible ones first, then premium ones
   */
  public sortVoicesByAccess(voices: Voice[], userPlan: string | undefined): Voice[] {
    const hasAccessToPremium = this.canAccessPremiumVoices(userPlan);
    
    return voices.sort((a, b) => {
      const aAccessible = this.isVoiceAccessible(a, userPlan);
      const bAccessible = this.isVoiceAccessible(b, userPlan);
      
      // If user has premium access, no special sorting needed
      if (hasAccessToPremium) {
        return 0; // Keep original order
      }
      
      // Put accessible voices first
      if (aAccessible && !bAccessible) return -1;
      if (!aAccessible && bAccessible) return 1;
      
      return 0; // Keep original order within same access level
    });
  }

  /**
   * Get upgrade requirements for accessing a voice
   */
  public getUpgradeRequirements(voice: Voice, userPlan: string | undefined): {
    requiresUpgrade: boolean;
    minimumPlan: string;
    currentPlan: string;
  } {
    const isPremiumVoice = voice.isPremium || voice.accessLevel === 'premium';
    const hasAccess = this.canAccessPremiumVoices(userPlan);
    
    return {
      requiresUpgrade: isPremiumVoice && !hasAccess,
      minimumPlan: isPremiumVoice ? 'INTENSIVE' : 'TRIAL',
      currentPlan: userPlan || 'TRIAL',
    };
  }
}

export const voiceAccessService = VoiceAccessService.getInstance(); 