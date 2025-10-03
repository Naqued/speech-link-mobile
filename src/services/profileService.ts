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
}

export const profileService = ProfileService.getInstance(); 