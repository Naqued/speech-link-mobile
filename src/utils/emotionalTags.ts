/**
 * Emotional Tags Utility Functions for Mobile
 * 
 * Mobile-optimized utilities for working with emotional tags
 */

export interface EmotionalTag {
  id: string;
  label: string;
  value: string;
  category: 'emotion' | 'expression' | 'style' | 'pattern';
  description: string;
  icon?: string;
  requiresPremium: boolean;
  order: number;
}

/**
 * Predefined emotional tags (top 20 most useful)
 * Full list matches backend: voice-enhancer/src/domain/emotionalTags/tagConfig.ts
 */
export const EMOTIONAL_TAGS: EmotionalTag[] = [
  // Basic Emotions
  { id: 'happy', label: 'Happy', value: '[happy]', category: 'emotion', description: 'Joyful, cheerful tone', icon: '😊', requiresPremium: true, order: 1 },
  { id: 'sad', label: 'Sad', value: '[sad]', category: 'emotion', description: 'Melancholic, sorrowful tone', icon: '😢', requiresPremium: true, order: 2 },
  { id: 'angry', label: 'Angry', value: '[angry]', category: 'emotion', description: 'Frustrated, intense tone', icon: '😠', requiresPremium: true, order: 3 },
  { id: 'excited', label: 'Excited', value: '[excited]', category: 'emotion', description: 'Energetic, enthusiastic tone', icon: '🤩', requiresPremium: true, order: 4 },
  { id: 'calm', label: 'Calm', value: '[calm]', category: 'emotion', description: 'Peaceful, relaxed tone', icon: '😌', requiresPremium: true, order: 5 },
  { id: 'surprised', label: 'Surprised', value: '[surprised]', category: 'emotion', description: 'Astonished, amazed tone', icon: '😲', requiresPremium: true, order: 6 },
  
  // Advanced Expressions
  { id: 'whisper', label: 'Whisper', value: '[whisper]', category: 'expression', description: 'Soft, quiet voice', icon: '🤫', requiresPremium: true, order: 1 },
  { id: 'shouting', label: 'Shouting', value: '[shouting]', category: 'expression', description: 'Loud, emphatic voice', icon: '📢', requiresPremium: true, order: 2 },
  { id: 'laughing', label: 'Laughing', value: '[laughing]', category: 'expression', description: 'Amused, chuckling', icon: '😂', requiresPremium: true, order: 3 },
  { id: 'sarcastic', label: 'Sarcastic', value: '[sarcastic]', category: 'expression', description: 'Ironic, mocking tone', icon: '🙄', requiresPremium: true, order: 4 },
  
  // Performance Styles
  { id: 'friendly', label: 'Friendly', value: '[friendly]', category: 'style', description: 'Warm, approachable', icon: '🤗', requiresPremium: true, order: 1 },
  { id: 'professional', label: 'Professional', value: '[professional]', category: 'style', description: 'Formal, businesslike', icon: '💼', requiresPremium: true, order: 2 },
  { id: 'dramatic', label: 'Dramatic', value: '[dramatic]', category: 'style', description: 'Theatrical, expressive', icon: '🎭', requiresPremium: true, order: 3 },
  
  // Speech Patterns
  { id: 'fast', label: 'Fast', value: '[fast]', category: 'pattern', description: 'Quick speech pace', icon: '⚡', requiresPremium: true, order: 1 },
  { id: 'slow', label: 'Slow', value: '[slow]', category: 'pattern', description: 'Deliberate, measured pace', icon: '🐌', requiresPremium: true, order: 2 },
  { id: 'pause', label: 'Pause', value: '[pause]', category: 'pattern', description: 'Brief silence', icon: '⏸️', requiresPremium: true, order: 3 }
];

const TAG_REGEX = /\[([a-z_]+)\]/gi;

export function extractTags(text: string): string[] {
  const matches = text.match(TAG_REGEX);
  return matches ? matches.map(m => m.toLowerCase()) : [];
}

export function insertTagAtPosition(
  text: string,
  tagValue: string,
  cursorPosition: number
): { newText: string; newCursorPosition: number } {
  const before = text.substring(0, cursorPosition);
  const after = text.substring(cursorPosition);
  
  const needsSpaceBefore = cursorPosition > 0 && before[before.length - 1] !== ' ';
  const needsSpaceAfter = after.length > 0 && after[0] !== ' ';
  
  const prefix = needsSpaceBefore ? ' ' : '';
  const suffix = needsSpaceAfter ? ' ' : '';
  
  const insertText = `${prefix}${tagValue}${suffix}`;
  
  return {
    newText: before + insertText + after,
    newCursorPosition: cursorPosition + insertText.length
  };
}

export function countTags(text: string): number {
  const matches = text.match(TAG_REGEX);
  return matches ? matches.length : 0;
}

export function getTagsByCategory(category: string): EmotionalTag[] {
  return EMOTIONAL_TAGS.filter(tag => tag.category === category)
    .sort((a, b) => a.order - b.order);
}

export function getPopularTags(count: number = 6): EmotionalTag[] {
  return EMOTIONAL_TAGS.filter(tag => tag.category === 'emotion').slice(0, count);
}



