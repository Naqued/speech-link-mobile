/**
 * Voice Models Constants for Mobile
 * 
 * ⚠️ IMPORTANT: These must match the backend constants in:
 * voice-enhancer/src/domain/voiceOutput/ports.ts
 */

export const VOICE_MODELS = {
  ELEVEN_LABS: 'eleven_flash_v2_5',
  ELEVEN_LABS_PREMIUM: 'eleven_v3_alpha',
  WHISPER: 'tts-1'
} as const;

export type VoiceModelId = typeof VOICE_MODELS[keyof typeof VOICE_MODELS];

/**
 * Model configuration metadata
 */
export interface ModelMetadata {
  characterLimit: number;
  latency: 'low' | 'medium' | 'high';
  emotionalRange: 'none' | 'standard' | 'advanced';
  languages: number;
  description: string;
  experimental?: boolean;
}

export const MODEL_CONFIG: Record<string, ModelMetadata> = {
  [VOICE_MODELS.ELEVEN_LABS]: {
    characterLimit: 40000,
    latency: 'low',
    emotionalRange: 'standard',
    languages: 32,
    description: 'Ultra-fast model optimized for real-time use (~75ms)',
    experimental: false
  },
  [VOICE_MODELS.ELEVEN_LABS_PREMIUM]: {
    characterLimit: 3000,
    latency: 'high',
    emotionalRange: 'advanced',
    languages: 70,
    description: 'Most emotionally rich and expressive speech synthesis (~300-500ms)',
    experimental: true
  }
};

export function getModelConfig(modelId: string): ModelMetadata {
  return MODEL_CONFIG[modelId] || MODEL_CONFIG[VOICE_MODELS.ELEVEN_LABS];
}

export function getCharacterLimit(modelId: string): number {
  return getModelConfig(modelId).characterLimit;
}

export function isExperimentalModel(modelId: string): boolean {
  return getModelConfig(modelId).experimental || false;
}

export function supportsEmotionalTags(modelId: string): boolean {
  return getModelConfig(modelId).emotionalRange === 'advanced';
}

/**
 * Languages that require v3 Alpha model
 * These languages are only available in the premium model
 */
export const V3_ONLY_LANGUAGES = ['urd'];

export function requiresV3Model(languageCode: string): boolean {
  return V3_ONLY_LANGUAGES.includes(languageCode);
}

