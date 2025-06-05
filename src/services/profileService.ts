import { apiService } from './apiService';
import { UserProfile } from '../types/profile';

class ProfileService {
  private static instance: ProfileService;

  private constructor() {}

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  public async getProfile(): Promise<UserProfile> {
    try {
      return await apiService.get<UserProfile>('/api/auth/mobile-profile');
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  public async updateProfile(data: Partial<UserProfile['user']>): Promise<UserProfile> {
    try {
      return await apiService.put<UserProfile>('/api/auth/mobile-profile', data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // NEW: Helper method to extract subscription tier for quick access
  public async getSubscriptionTier(): Promise<string | undefined> {
    try {
      const profile = await this.getProfile();
      return profile.subscription?.tier;
    } catch (error) {
      console.error('Error fetching subscription tier:', error);
      return undefined;
    }
  }

  // NEW: Helper method to extract plan info from existing profile data
  public extractPlanInfo(profileData: UserProfile | null): {
    tier: string | undefined;
    hasSubscription: boolean;
    isPremium: boolean;
  } {
    if (!profileData) {
      return { tier: undefined, hasSubscription: false, isPremium: false };
    }

    const tier = profileData.subscription?.tier;
    const hasSubscription = !!profileData.subscription;
    // Check for premium tiers: INTENSIVE and DAILY_COMPANION (handle both API variations)
    const isPremium = tier === 'INTENSIVE' || tier === 'DAILY_COMPANION';

    return { tier, hasSubscription, isPremium };
  }
}

export const profileService = ProfileService.getInstance(); 