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
  Platform,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Context
import { ThemeContext } from '../../../contexts/ThemeContext';

// Services
import { aacService } from '../../../services/aacService';

// Models
import { 
  SentenceCategory,
  CategoryUIModel,
  mapToBackendCategoryModel
} from '../../../models/AAC';

interface CategoryFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (category: CategoryUIModel) => void;
  editCategory?: CategoryUIModel;
  currentLanguage: string;
}

// Default color options for categories
const COLOR_OPTIONS = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6B7280', // Gray
];

// Default icon options for categories
const ICON_OPTIONS = [
  'water-outline',
  'hand-left-outline',
  'happy-outline',
  'help-circle-outline',
  'medical-outline',
  'bicycle-outline',
  'basket-outline',
  'book-outline',
  'build-outline',
  'car-outline',
  'home-outline',
  'restaurant-outline',
  'people-outline',
  'person-outline',
  'school-outline',
  'time-outline',
  'earth-outline',
  'map-outline',
  'beer-outline',
  'cafe-outline',
  'cart-outline',
  'chatbubble-outline',
  'heart-outline',
  'mail-outline',
  'paw-outline',
  'phone-portrait-outline',
];

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  visible,
  onClose,
  onSave,
  editCategory,
  currentLanguage
}) => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  
  // Reset form when visibility changes or editCategory changes
  useEffect(() => {
    if (visible) {
      if (editCategory) {
        setName(editCategory.name);
        setColor(editCategory.color);
        setIcon(editCategory.icon);
      } else {
        // For new categories, set defaults
        setName('');
        setColor(COLOR_OPTIONS[0]);
        setIcon(ICON_OPTIONS[0]);
      }
      setErrors({});
    }
  }, [visible, editCategory]);
  
  const styles = makeStyles(theme);
  
  const validateForm = (): boolean => {
    const newErrors: { name?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = t('general.error.required');
    } else if (name.length > 50) {
      newErrors.name = t('general.error.maxLength', { max: 50 });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      
      // Create category model
      const categoryModel: CategoryUIModel = {
        id: editCategory?.id || `temp-${Date.now()}`,
        name: name.trim(),
        color,
        icon,
        order: editCategory?.order || 0,
        isGlobal: editCategory?.isGlobal || false
      };
      
      // Map to backend model
      const backendModel = mapToBackendCategoryModel(categoryModel, currentLanguage);
      
      let savedCategory: SentenceCategory;
      
      if (editCategory) {
        // Update existing category
        savedCategory = await aacService.updateCategory(editCategory.id, backendModel);
      } else {
        // Create new category
        savedCategory = await aacService.createCategory(backendModel);
      }
      
      // Map back to UI model and pass to parent
      const result: CategoryUIModel = {
        id: savedCategory.id,
        name: savedCategory.name,
        color: savedCategory.color,
        icon: savedCategory.icon,
        order: savedCategory.order,
        isGlobal: savedCategory.isGlobal
      };
      
      onSave(result);
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert(
        t('general.error'),
        t('aacBoard.errorSavingCategory')
      );
    } finally {
      setIsSaving(false);
    }
  };
  
  const renderColorItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.colorItem,
        { backgroundColor: item },
        color === item && styles.selectedColorItem
      ]}
      onPress={() => setColor(item)}
    >
      {color === item && (
        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  );
  
  const renderIconItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.iconItem,
        icon === item && styles.selectedIconItem,
        icon === item ? { backgroundColor: color } : { backgroundColor: theme.card }
      ]}
      onPress={() => setIcon(item)}
    >
      <Ionicons 
        name={item as any}
        size={24}
        color={icon === item ? '#FFFFFF' : theme.text} 
      />
    </TouchableOpacity>
  );
  
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
                {editCategory ? t('aacBoard.editCategory') : t('aacBoard.addCategory')}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={[styles.content, { flexGrow: 1 }]}>
              {/* Category Preview */}
              <View style={styles.previewContainer}>
                <View 
                  style={[
                    styles.previewButton,
                    { backgroundColor: color }
                  ]}
                >
                  <Ionicons name={icon as any} size={32} color="#FFFFFF" />
                  <Text style={styles.previewText} numberOfLines={1}>
                    {name || t('aacBoard.categoryName')}
                  </Text>
                </View>
              </View>
              
              {/* Category Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('aacBoard.categoryName')}</Text>
                <TextInput
                  style={[styles.input, errors.name ? styles.inputError : null]}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('aacBoard.enterCategoryName')}
                  placeholderTextColor={theme.text + '60'}
                  maxLength={50}
                />
                {errors.name ? (
                  <Text style={styles.errorText}>{errors.name}</Text>
                ) : null}
                <Text style={styles.charCounter}>
                  {name.length}/50
                </Text>
              </View>
              
              {/* Color Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('aacBoard.selectColor')}</Text>
                <View style={styles.colorSelectionContainer}>
                  {COLOR_OPTIONS.map((colorOption) => (
                    <TouchableOpacity
                      key={colorOption}
                      style={[
                        styles.colorItem,
                        color === colorOption && styles.selectedColorItem,
                        { backgroundColor: colorOption }
                      ]}
                      onPress={() => setColor(colorOption)}
                    >
                      {color === colorOption && (
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Icon Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('aacBoard.selectIcon')}</Text>
                <View style={styles.iconSelectionContainer}>
                  {ICON_OPTIONS.map((iconOption) => (
                    <TouchableOpacity
                      key={iconOption}
                      style={[
                        styles.iconItem,
                        icon === iconOption && styles.selectedIconItem
                      ]}
                      onPress={() => setIcon(iconOption)}
                    >
                      <Ionicons 
                        name={iconOption as any} 
                        size={24} 
                        color={icon === iconOption ? theme.primary : theme.text} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
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
                style={[
                  styles.saveButton, 
                  isSaving && styles.saveButtonDisabled,
                  { backgroundColor: color }
                ]}
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
    minHeight: '60%',
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
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 16,
    width: 120,
    height: 90,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  previewText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
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
  colorContainer: {
    paddingVertical: 10,
  },
  colorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorItem: {
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  iconContainer: {
    paddingVertical: 10,
  },
  iconItem: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectedIconItem: {
    backgroundColor: theme.background,
    borderColor: theme.primary,
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
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  colorSelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingVertical: 10,
  },
  iconSelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 10,
  },
});

export default CategoryFormModal; 