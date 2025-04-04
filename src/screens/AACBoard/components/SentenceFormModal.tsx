import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Context
import { ThemeContext } from '../../../contexts/ThemeContext';

// Services
import { aacService } from '../../../services/aacService';

// Models
import { 
  SampleSentence,
  CategoryUIModel,
  SentenceUIModel,
  mapToBackendSentenceModel
} from '../../../models/AAC';

interface SentenceFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (sentence: SentenceUIModel) => void;
  categories: CategoryUIModel[];
  editSentence?: SentenceUIModel;
  currentLanguage: string;
}

const SentenceFormModal: React.FC<SentenceFormModalProps> = ({
  visible,
  onClose,
  onSave,
  categories,
  editSentence,
  currentLanguage
}) => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  
  const [text, setText] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ text?: string; categoryId?: string }>({});
  
  // Reset form when visibility changes or editSentence changes
  useEffect(() => {
    if (visible) {
      if (editSentence) {
        setText(editSentence.text);
        setCategoryId(editSentence.categoryId);
      } else {
        // For new sentences, pre-select first category if available
        setText('');
        setCategoryId(categories.length > 0 ? categories[0].id : '');
      }
      setErrors({});
    }
  }, [visible, editSentence, categories]);
  
  const styles = makeStyles(theme);
  
  const validateForm = (): boolean => {
    const newErrors: { text?: string; categoryId?: string } = {};
    
    if (!text.trim()) {
      newErrors.text = t('general.error.required');
    } else if (text.length > 200) {
      newErrors.text = t('general.error.maxLength', { max: 200 });
    }
    
    if (!categoryId) {
      newErrors.categoryId = t('general.error.required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      
      // Create sentence model
      const sentenceModel: SentenceUIModel = {
        id: editSentence?.id || `temp-${Date.now()}`,
        text: text.trim(),
        categoryId,
        isFavorite: editSentence?.isFavorite || false
      };
      
      // Map to backend model
      const backendModel = mapToBackendSentenceModel(sentenceModel, currentLanguage);
      
      let savedSentence: SampleSentence;
      
      if (editSentence) {
        // Update existing sentence
        savedSentence = await aacService.updateSentence(editSentence.id, backendModel);
      } else {
        // Create new sentence
        savedSentence = await aacService.createSentence(backendModel);
      }
      
      // Map back to UI model and pass to parent
      const result: SentenceUIModel = {
        id: savedSentence.id,
        text: savedSentence.text,
        categoryId: savedSentence.categoryId,
        isFavorite: savedSentence.isFavorite
      };
      
      onSave(result);
      onClose();
    } catch (error) {
      console.error('Error saving sentence:', error);
      Alert.alert(
        t('general.error'),
        t('aacBoard.errorSavingSentence')
      );
    } finally {
      setIsSaving(false);
    }
  };
  
  const getCategoryById = (id: string) => {
    return categories.find(c => c.id === id);
  };

  const categoryName = getCategoryById(categoryId)?.name || '';
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {editSentence ? t('aac.phrases.edit') : t('aac.phrases.add')}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.content}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('aacBoard.phraseText')}</Text>
                <TextInput
                  style={[styles.input, errors.text ? styles.inputError : null]}
                  value={text}
                  onChangeText={setText}
                  placeholder={t('aacBoard.enterPhraseText')}
                  placeholderTextColor={theme.text + '60'}
                  multiline
                  maxLength={200}
                />
                {errors.text ? (
                  <Text style={styles.errorText}>{errors.text}</Text>
                ) : null}
                <Text style={styles.charCounter}>
                  {text.length}/200
                </Text>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('aacBoard.category')}</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesContainer}
                >
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        categoryId === category.id && styles.selectedCategoryChip,
                        { borderColor: category.color }
                      ]}
                      onPress={() => setCategoryId(category.id)}
                    >
                      <Ionicons 
                        name={category.icon as any} 
                        size={16} 
                        color={categoryId === category.id ? '#FFFFFF' : category.color} 
                      />
                      <Text 
                        style={[
                          styles.categoryChipText,
                          categoryId === category.id && styles.selectedCategoryChipText
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {errors.categoryId ? (
                  <Text style={styles.errorText}>{errors.categoryId}</Text>
                ) : null}
              </View>
              
              {categoryId && (
                <View style={styles.selectedCategory}>
                  <Text style={styles.selectedCategoryLabel}>
                    {t('aacBoard.selectedCategory')}:
                  </Text>
                  <View 
                    style={[
                      styles.selectedCategoryBadge,
                      { backgroundColor: getCategoryById(categoryId)?.color || theme.primary }
                    ]}
                  >
                    <Text style={styles.selectedCategoryText}>
                      {getCategoryById(categoryId)?.isGlobal 
                        ? categoryName 
                        : categoryName}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={onClose}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>{t('general.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('general.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const makeStyles = (theme: any) => StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '50%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    fontSize: 16,
    color: theme.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  charCounter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: theme.text + '80',
    marginTop: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingVertical: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: theme.primary,
  },
  categoryChipText: {
    color: theme.text,
    marginLeft: 6,
    fontSize: 14,
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  selectedCategoryLabel: {
    fontSize: 14,
    color: theme.text,
    marginRight: 8,
  },
  selectedCategoryBadge: {
    backgroundColor: theme.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  selectedCategoryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: theme.primary + '80',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SentenceFormModal; 