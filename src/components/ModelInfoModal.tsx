/**
 * ModelInfoModal Component (React Native)
 * 
 * Modal that explains the Eleven v3 Alpha model features, limitations, and best practices
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

interface ModelInfoModalProps {
  visible: boolean;
  onClose: () => void;
  theme: any;
}

export const ModelInfoModal: React.FC<ModelInfoModalProps> = ({ visible, onClose, theme }) => {
  const { t } = useTranslation();

  const openElevenLabsDocs = () => {
    Linking.openURL('https://elevenlabs.io/docs/models#eleven-v3-alpha');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              {t('modelSelector.modalTitle')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
            {/* Overview */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                {t('modelSelector.modalOverview')}
              </Text>
              <Text style={[styles.paragraph, { color: theme.text }]}>
                {t('modelSelector.modalOverviewText')}
              </Text>
            </View>

            {/* Key Features */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                {t('modelSelector.modalFeatures')}
              </Text>
              {[1, 2, 3, 4].map((num) => (
                <Text key={num} style={[styles.bulletPoint, { color: theme.text }]}>
                  {t(`modelSelector.modalFeature${num}`)}
                </Text>
              ))}
            </View>

            {/* Limitations */}
            <View style={[styles.section, styles.warningSection, { backgroundColor: theme.warning + '15', borderColor: theme.warning }]}>
              <Text style={[styles.sectionTitle, { color: theme.warning }]}>
                {t('modelSelector.modalLimitations')}
              </Text>
              {[1, 2, 3, 4].map((num) => (
                <Text key={num} style={[styles.bulletPoint, { color: theme.text }]}>
                  {t(`modelSelector.modalLimitation${num}`)}
                </Text>
              ))}
            </View>

            {/* Best Practices */}
            <View style={[styles.section, styles.tipSection, { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}>
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                {t('modelSelector.modalBestPractices')}
              </Text>
              {[1, 2, 3, 4].map((num) => (
                <Text key={num} style={[styles.bulletPoint, { color: theme.text }]}>
                  {t(`modelSelector.modalPractice${num}`)}
                </Text>
              ))}
            </View>

            {/* When to Use */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                {t('modelSelector.modalWhen')}
              </Text>
              {[1, 2, 3, 4].map((num) => (
                <Text key={num} style={[styles.bulletPoint, { color: theme.text }]}>
                  {t(`modelSelector.modalUseCase${num}`)}
                </Text>
              ))}
            </View>

            {/* When NOT to Use */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t('modelSelector.modalWhenNot')}
              </Text>
              {[1, 2, 3, 4].map((num) => (
                <Text key={num} style={[styles.bulletPoint, { color: theme.text + 'CC' }]}>
                  {t(`modelSelector.modalNotCase${num}`)}
                </Text>
              ))}
            </View>

            {/* Learn More Link */}
            <TouchableOpacity onPress={openElevenLabsDocs} style={[styles.linkButton, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.linkText, { color: theme.primary }]}>
                📚 Read ElevenLabs Official Documentation →
              </Text>
            </TouchableOpacity>

            <View style={styles.spacer} />
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.closeFooterButton, { backgroundColor: theme.primary }]}
              onPress={onClose}
            >
              <Text style={styles.closeFooterButtonText}>{t('modelSelector.modalClose')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1
  },
  closeButton: {
    padding: 4,
    marginLeft: 12
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '300'
  },
  content: {
    flex: 1,
    padding: 20
  },
  section: {
    marginBottom: 24
  },
  warningSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24
  },
  tipSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 4
  },
  linkButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 16
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  spacer: {
    height: 20
  },
  footer: {
    padding: 20,
    borderTopWidth: 1
  },
  closeFooterButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  closeFooterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  }
});

