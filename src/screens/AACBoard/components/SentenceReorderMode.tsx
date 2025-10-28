import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Context
import { ThemeContext } from '../../../contexts/ThemeContext';

// Models
import { SentenceUIModel } from '../../../models/AAC';

interface SentenceReorderModeProps {
  visible: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  sentences: SentenceUIModel[];
  onSave: (reorderedSentences: SentenceUIModel[]) => Promise<void>;
}

const SentenceReorderMode: React.FC<SentenceReorderModeProps> = ({
  visible,
  onClose,
  categoryId,
  categoryName,
  categoryColor,
  sentences,
  onSave,
}) => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const [data, setData] = useState<SentenceUIModel[]>(sentences);
  const [isSaving, setIsSaving] = useState(false);

  const styles = makeStyles(theme, categoryColor);

  // Update data when sentences prop changes
  React.useEffect(() => {
    setData(sentences);
  }, [sentences]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(data);
      onClose();
    } catch (error) {
      console.error('Error saving sentence order:', error);
      Alert.alert(
        t('general.error.title'),
        'Failed to save sentence order'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset data to original order
    setData(sentences);
    onClose();
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<SentenceUIModel>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.sentenceItem,
            isActive && styles.sentenceItemActive,
          ]}
        >
          <View style={styles.dragHandle}>
            <Ionicons name="menu" size={24} color={theme.text + '80'} />
          </View>
          <View style={styles.sentenceContent}>
            {item.icon && (
              <View style={styles.sentenceIconContainer}>
                {item.iconType === 'emoji' ? (
                  <Text style={styles.sentenceEmoji}>{item.icon}</Text>
                ) : (
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.color || categoryColor}
                  />
                )}
              </View>
            )}
            <Text style={styles.sentenceText} numberOfLines={2}>
              {item.text}
            </Text>
          </View>
          <View
            style={[
              styles.sentenceColorBar,
              { backgroundColor: item.color || categoryColor },
            ]}
          />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCancel}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isSaving}
            >
              <Ionicons name="close" size={24} color={theme.text} />
              <Text style={styles.cancelButtonText}>{t('general.cancel')}</Text>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Reorder Sentences</Text>
              <Text style={styles.headerSubtitle}>{categoryName}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                isSaving && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>{t('general.save')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
            <Text style={styles.instructionsText}>
              Long press and drag to reorder sentences
            </Text>
          </View>

          {/* Draggable List */}
          <DraggableFlatList
            data={data}
            onDragEnd={({ data: newData }) => setData(newData)}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {data.length} {data.length === 1 ? 'sentence' : 'sentences'}
            </Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const makeStyles = (theme: any, categoryColor: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.card,
    },
    cancelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    cancelButtonText: {
      marginLeft: 4,
      fontSize: 16,
      color: theme.text,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.text + '80',
      marginTop: 2,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: categoryColor,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      marginLeft: 4,
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    instructionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      marginHorizontal: 16,
      marginVertical: 12,
      borderRadius: 8,
      backgroundColor: theme.primary + '20',
    },
    instructionsText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme.text,
    },
    listContent: {
      padding: 16,
      paddingBottom: 32,
    },
    sentenceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      marginBottom: 8,
      borderRadius: 12,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    sentenceItemActive: {
      backgroundColor: theme.background,
      shadowOpacity: 0.3,
      elevation: 8,
      borderColor: categoryColor,
      borderWidth: 2,
    },
    dragHandle: {
      marginRight: 12,
    },
    sentenceContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sentenceIconContainer: {
      marginRight: 8,
    },
    sentenceEmoji: {
      fontSize: 20,
    },
    sentenceText: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
    },
    sentenceColorBar: {
      width: 4,
      height: '100%',
      borderRadius: 2,
      marginLeft: 12,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.card,
    },
    footerText: {
      textAlign: 'center',
      fontSize: 14,
      color: theme.text + '80',
    },
  });

export default SentenceReorderMode;

