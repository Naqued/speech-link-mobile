/**
 * AAC (Augmentative and Alternative Communication) data models
 * These models align with the backend specification while supporting the mobile app's needs
 */

/**
 * Represents a category of sample sentences
 */
export interface SentenceCategory {
  id: string;             // Unique identifier
  userId?: string;        // Owner of this category
  name: string;           // Display name
  color: string;          // Hex color code (e.g., "#4F46E5")
  icon: string;           // Icon identifier (e.g., "chat")
  order: number;          // Sorting order
  language: string;       // Language code (e.g., "en", "fr")
  isGlobal: boolean;      // Whether this is a system-provided category
  createdAt?: Date;       // Creation timestamp
  updatedAt?: Date;       // Last update timestamp
}

/**
 * Represents a sample sentence for quick communication
 */
export interface SampleSentence {
  id: string;             // Unique identifier
  userId?: string;        // Owner of this sentence
  text: string;           // The sentence text
  categoryId: string;     // Reference to parent category
  frequency: number;      // Usage count (for favorites)
  order: number;          // Sorting order within category
  language: string;       // Language code (e.g., "en", "fr")
  isGlobal: boolean;      // Whether this is a system-provided sentence
  isFavorite: boolean;    // Whether user has marked as favorite
  createdAt?: Date;       // Creation timestamp
  updatedAt?: Date;       // Last update timestamp
}

/**
 * Simplified category model for UI components
 * Maps to SentenceCategory for API operations
 */
export interface CategoryUIModel {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  isGlobal: boolean;
}

/**
 * Simplified sentence model for UI components
 * Maps to SampleSentence for API operations
 */
export interface SentenceUIModel {
  id: string;
  text: string;
  categoryId: string;
  isFavorite: boolean;
}

/**
 * Data model for reordering categories
 */
export interface CategoryReorderRequest {
  items: Array<{
    id: string;
    order: number;
  }>;
}

/**
 * Data model for reordering sentences
 */
export interface SentenceReorderRequest {
  categoryId: string;
  items: Array<{
    id: string;
    order: number;
  }>;
}

/**
 * TTS (Text-to-Speech) preview request model
 */
export interface TTSPreviewRequest {
  text: string;
  language?: string;
  voice?: string;
}

/**
 * Utility functions for mapping between models
 */

/**
 * Maps a backend category to a UI category model
 */
export function mapToUICategoryModel(category: SentenceCategory): CategoryUIModel {
  console.log('Mapping category to UI model:', category.id, 'icon:', category.icon, 'isGlobal:', category.isGlobal);
  
  // For system categories, always use our default icons and colors
  let icon = category.icon || 'chatbubble-outline';
  let color = category.color || '#8B5CF6';
  
  if (category.isGlobal || category.id.startsWith('cat_')) {
    icon = getDefaultCategoryIcon(category.id);
    color = getDefaultCategoryColor(category.id);
    console.log('Using default icon for system category:', category.id, 'icon:', icon);
  }
  
  return {
    id: category.id,
    name: category.name,
    color: color,
    icon: icon,
    order: category.order,
    isGlobal: category.isGlobal
  };
}

/**
 * Maps a UI category model to a backend category model
 */
export function mapToBackendCategoryModel(category: CategoryUIModel, language: string): Partial<SentenceCategory> {
  return {
    ...category,
    language
  };
}

/**
 * Maps a backend sentence to a UI sentence model
 */
export function mapToUISentenceModel(sentence: SampleSentence): SentenceUIModel {
  return {
    id: sentence.id,
    text: sentence.text,
    categoryId: sentence.categoryId,
    isFavorite: sentence.isFavorite
  };
}

/**
 * Maps a UI sentence model to a backend sentence model
 */
export function mapToBackendSentenceModel(sentence: SentenceUIModel, language: string): Partial<SampleSentence> {
  return {
    ...sentence,
    language,
    frequency: 0,
    order: 0,
    isGlobal: false
  };
}

// Map default backend category IDs to icons
export const getDefaultCategoryIcon = (categoryId: string): string => {
  // Handle both language variants (en/fr)
  const baseId = categoryId.replace(/_en$|_fr$/, '');
  
  console.log('Getting icon for category:', categoryId, 'baseId:', baseId);
  
  // Check for exact matches first
  if (baseId === 'cat_basic_needs') {
    return 'water-outline';
  } else if (baseId === 'cat_social_interaction') {
    return 'people-outline';
  } else if (baseId === 'cat_questions') {
    return 'help-circle-outline';
  } else if (baseId === 'cat_emergency') {
    return 'alert-circle-outline';
  }
  
  // More flexible matching for partial IDs
  if (baseId.includes('basic_needs')) {
    return 'water-outline';
  } else if (baseId.includes('social') || baseId.includes('greet')) {
    return 'people-outline';
  } else if (baseId.includes('question')) {
    return 'help-circle-outline';
  } else if (baseId.includes('emergency')) {
    return 'alert-circle-outline';
  } else if (baseId.includes('medical')) {
    return 'medical-outline';
  } else if (baseId.includes('food') || baseId.includes('drink')) {
    return 'restaurant-outline';
  } else if (baseId.includes('activit')) {
    return 'bicycle-outline';
  } else if (baseId.includes('feel') || baseId.includes('emotion')) {
    return 'happy-outline';
  }
  
  // Default fallback
  console.log('No icon match found for:', categoryId, 'using default');
  return 'chatbubble-outline';
};

// Map default backend category IDs to colors
export const getDefaultCategoryColor = (categoryId: string): string => {
  // Handle both language variants (en/fr)
  const baseId = categoryId.replace(/_en$|_fr$/, '');
  
  switch (baseId) {
    case 'cat_basic_needs':
      return '#4F46E5'; // Indigo
    case 'cat_social_interaction':
      return '#10B981'; // Emerald
    case 'cat_questions':
      return '#F59E0B'; // Amber
    case 'cat_emergency':
      return '#EF4444'; // Red
    default:
      return '#8B5CF6'; // Purple fallback
  }
}; 