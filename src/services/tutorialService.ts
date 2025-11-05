import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_COMPLETED_KEY = 'tutorial_completed';

class TutorialService {
  /**
   * Check if the tutorial should be shown to the user
   * Returns true if the tutorial has never been started
   */
  async shouldShowTutorial(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
      return completed !== 'true';
    } catch (error) {
      console.error('[TutorialService] Error checking tutorial status:', error);
      return false;
    }
  }

  /**
   * Mark the tutorial as started/completed
   * This is set to true as soon as the tutorial starts
   */
  async markTutorialStarted(): Promise<void> {
    try {
      await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
      console.log('[TutorialService] Tutorial marked as started');
    } catch (error) {
      console.error('[TutorialService] Error marking tutorial as started:', error);
    }
  }

  /**
   * Reset the tutorial status so it can be shown again
   * Used when user wants to replay the tutorial from settings
   */
  async resetTutorial(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TUTORIAL_COMPLETED_KEY);
      console.log('[TutorialService] Tutorial status reset');
    } catch (error) {
      console.error('[TutorialService] Error resetting tutorial:', error);
    }
  }

  /**
   * Get the current tutorial completion status
   */
  async getTutorialStatus(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
      return completed === 'true';
    } catch (error) {
      console.error('[TutorialService] Error getting tutorial status:', error);
      return false;
    }
  }
}

export const tutorialService = new TutorialService();



