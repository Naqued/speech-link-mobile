/**
 * Emotional Tags Utility Functions for Mobile
 * 
 * Mobile-optimized utilities for working with emotional tags
 * Based on official ElevenLabs V3 documentation
 * 
 * References:
 * - https://elevenlabs.io/docs/capabilities/text-to-dialogue
 * - https://elevenlabs.io/docs/best-practices/prompting/eleven-v3
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
 * Complete catalog of emotional tags supported by ElevenLabs v3
 * Full list matches backend: voice-enhancer/src/domain/emotionalTags/tagConfig.ts
 */
export const EMOTIONAL_TAGS: EmotionalTag[] = [
  // ==================== BASIC EMOTIONS ====================
  { id: 'sad', label: 'Sad', value: '[sad]', category: 'emotion', description: 'Melancholic, sorrowful tone', icon: '😢', requiresPremium: true, order: 1 },
  { id: 'angry', label: 'Angry', value: '[angry]', category: 'emotion', description: 'Frustrated, intense tone', icon: '😠', requiresPremium: true, order: 2 },
  { id: 'happily', label: 'Happily', value: '[happily]', category: 'emotion', description: 'Joyful, cheerful manner', icon: '😊', requiresPremium: true, order: 3 },
  { id: 'excited', label: 'Excited', value: '[excited]', category: 'emotion', description: 'Energetic, enthusiastic tone', icon: '🤩', requiresPremium: true, order: 4 },
  { id: 'curious', label: 'Curious', value: '[curious]', category: 'emotion', description: 'Inquisitive, interested tone', icon: '🤔', requiresPremium: true, order: 5 },
  { id: 'appalled', label: 'Appalled', value: '[appalled]', category: 'emotion', description: 'Shocked, horrified', icon: '😱', requiresPremium: true, order: 6 },
  { id: 'elated', label: 'Elated', value: '[elated]', category: 'emotion', description: 'Extremely happy, overjoyed', icon: '🎉', requiresPremium: true, order: 7 },
  { id: 'indecisive', label: 'Indecisive', value: '[indecisive]', category: 'emotion', description: 'Uncertain, hesitant', icon: '🤷', requiresPremium: true, order: 8 },

  // ==================== VOCAL EXPRESSIONS ====================
  { id: 'laughs', label: 'Laughs', value: '[laughs]', category: 'expression', description: 'Light laughter', icon: '😄', requiresPremium: true, order: 1 },
  { id: 'laughs_harder', label: 'Laughs Harder', value: '[laughs harder]', category: 'expression', description: 'More intense laughter', icon: '😂', requiresPremium: true, order: 2 },
  { id: 'starts_laughing', label: 'Starts Laughing', value: '[starts laughing]', category: 'expression', description: 'Beginning to laugh', icon: '😆', requiresPremium: true, order: 3 },
  { id: 'laughing', label: 'Laughing', value: '[laughing]', category: 'expression', description: 'Continuous laughter while speaking', icon: '🤣', requiresPremium: true, order: 4 },
  { id: 'giggling', label: 'Giggling', value: '[giggling]', category: 'expression', description: 'Light, nervous laughter', icon: '🤭', requiresPremium: true, order: 5 },
  { id: 'wheezing', label: 'Wheezing', value: '[wheezing]', category: 'expression', description: 'Breathless, heavy laughter', icon: '😮‍💨', requiresPremium: true, order: 6 },
  { id: 'crying', label: 'Crying', value: '[crying]', category: 'expression', description: 'Emotional, tearful', icon: '😭', requiresPremium: true, order: 7 },
  { id: 'sighs', label: 'Sighs', value: '[sighs]', category: 'expression', description: 'Deep breath expressing emotion', icon: '😮‍💨', requiresPremium: true, order: 8 },
  { id: 'exhales', label: 'Exhales', value: '[exhales]', category: 'expression', description: 'Breathing out audibly', icon: '💨', requiresPremium: true, order: 9 },
  { id: 'snorts', label: 'Snorts', value: '[snorts]', category: 'expression', description: 'Nasal exhalation, often amused', icon: '😤', requiresPremium: true, order: 10 },
  { id: 'groaning', label: 'Groaning', value: '[groaning]', category: 'expression', description: 'Sound of discomfort or annoyance', icon: '😩', requiresPremium: true, order: 11 },

  // ==================== DELIVERY STYLES ====================
  { id: 'whispers', label: 'Whispers', value: '[whispers]', category: 'style', description: 'Soft, quiet voice', icon: '🤫', requiresPremium: true, order: 1 },
  { id: 'sarcastic', label: 'Sarcastic', value: '[sarcastic]', category: 'style', description: 'Ironic, mocking tone', icon: '🙄', requiresPremium: true, order: 2 },
  { id: 'mischievously', label: 'Mischievously', value: '[mischievously]', category: 'style', description: 'Playfully naughty tone', icon: '😏', requiresPremium: true, order: 3 },
  { id: 'cautiously', label: 'Cautiously', value: '[cautiously]', category: 'style', description: 'Careful, wary manner', icon: '😬', requiresPremium: true, order: 4 },
  { id: 'cheerfully', label: 'Cheerfully', value: '[cheerfully]', category: 'style', description: 'Bright, upbeat manner', icon: '😄', requiresPremium: true, order: 5 },
  { id: 'quizzically', label: 'Quizzically', value: '[quizzically]', category: 'style', description: 'Questioning, puzzled tone', icon: '🤨', requiresPremium: true, order: 6 },
  { id: 'muttering', label: 'Muttering', value: '[muttering]', category: 'style', description: 'Speaking under breath', icon: '🗣️', requiresPremium: true, order: 7 },
  { id: 'singing', label: 'Singing', value: '[singing]', category: 'style', description: 'Musical, melodic delivery', icon: '🎵', requiresPremium: true, order: 8 },
  { id: 'jumping_in', label: 'Jumping In', value: '[jumping in]', category: 'style', description: 'Interrupting eagerly', icon: '💬', requiresPremium: true, order: 9 },

  // ==================== SOUND EFFECTS ====================
  { id: 'swallows', label: 'Swallows', value: '[swallows]', category: 'pattern', description: 'Gulping sound', icon: '💧', requiresPremium: true, order: 1 },
  { id: 'gulps', label: 'Gulps', value: '[gulps]', category: 'pattern', description: 'Nervous swallowing', icon: '😰', requiresPremium: true, order: 2 },
  { id: 'applause', label: 'Applause', value: '[applause]', category: 'pattern', description: 'Clapping sound', icon: '👏', requiresPremium: true, order: 3 },
  { id: 'clapping', label: 'Clapping', value: '[clapping]', category: 'pattern', description: 'Hand clapping', icon: '👏', requiresPremium: true, order: 4 },
  { id: 'gunshot', label: 'Gunshot', value: '[gunshot]', category: 'pattern', description: 'Gunshot sound effect', icon: '🔫', requiresPremium: true, order: 5 },
  { id: 'explosion', label: 'Explosion', value: '[explosion]', category: 'pattern', description: 'Explosion sound effect', icon: '💥', requiresPremium: true, order: 6 },
  { id: 'leaves_rustling', label: 'Leaves Rustling', value: '[leaves rustling]', category: 'pattern', description: 'Nature sound effect', icon: '🍃', requiresPremium: true, order: 7 },
  { id: 'gentle_footsteps', label: 'Gentle Footsteps', value: '[gentle footsteps]', category: 'pattern', description: 'Walking sound effect', icon: '👣', requiresPremium: true, order: 8 }
];

// Updated regex to handle multi-word tags like [laughs harder], [starts laughing], etc.
const TAG_REGEX = /\[([a-z\s_]+)\]/gi;

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



