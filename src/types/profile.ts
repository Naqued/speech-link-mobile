export interface UserProfile {
  user: UserInfo;
  subscription: SubscriptionInfo | null;
  usage: UsageInfo | null;
  topPhrases: TopPhrase[];
  favoriteVoices: FavoriteVoice[];
}

export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  memberSince: string;
}

export interface SubscriptionInfo {
  tier: 'FREE' | 'PREMIUM';
  status: 'active' | 'inactive' | 'cancelled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  hasPremiumFeatures: boolean;
  hasVoiceCloning: boolean;
}

export interface UsageInfo {
  totalRequests: number;
  lastResetDate: string;
  nextResetDate: string;
  daysUntilReset: number;
  creditsUsed: {
    prompt: number;
    speechToText: number;
    textToSpeech: number;
    total: number;
  };
  creditsTotal: number;
  creditsRemaining: number;
}

export interface TopPhrase {
  id: string;
  text: string;
  usageCount: number;
  createdAt: string;
}

export interface FavoriteVoice {
  id: string;
  voiceId: string;
  name: string;
  provider: 'ELEVEN_LABS' | 'OPENAI' | 'RESEMBLE';
} 