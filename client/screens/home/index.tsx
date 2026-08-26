/* eslint-disable forbidEmoji/no-emoji */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  Image, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { Screen } from '@/components/Screen';
import { useFinance } from '@/contexts/FinanceContext';
import { type Category } from '@/types/finance';
import { PenguinCelebration, PenguinIcon, CategoryPenguinIcon } from '@/components/PenguinCelebration';
import dayjs from 'dayjs';

/** Cute penguin emojis for different states */
const PENGUIN_EMOJIS = ['🐧', '🎉', '💃', '🥰', '👏', '✨', '', '💖'];
const EXPENSE_PENGUIN = '😅';
const INCOME_PENGUIN = '🎊';

export default function HomeScreen() {
  const { categories, addTransaction } = useFinance();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPenguin, setShowPenguin] = useState(false);

  // Category management modal
  const [showCatModal, setShowCatModal] = useState(false);

  const filteredCategories = categories.filter(c => c.type === type);

  // Auto-select first category when type changes
  React.useEffect(() => {
    const first = categories.find(c => c.type === type);
    if (first) setCategoryId(first.id);
  }, [type, categories]);

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Toast.show({ type: 'error', text1: '请输入有效金额' });
      return;
    }
    if (!categoryId) {
      Toast.show({ type: 'error', text1: '请选择分类' });
      return;
    }
    setSubmitting(true);
    try {
      await addTransaction({
        type,
        categoryId,
        amount: numAmount,
        date: dayjs(date).format('YYYY-MM-DD'),
        note: note.trim(),
        imageBase64: imageUri ?? undefined,
      });
      // Reset form
      setAmount('');
      setNote('');
      setImageUri(null);
      setDate(new Date());
      // Show penguin celebration!
      setShowPenguin(true);
    } catch (e) {
      Toast.show({ type: 'error', text1: '保存失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  }, [amount, categoryId, date, note, imageUri, type, addTransaction]);

  const formattedAmount = amount ? `¥ ${parseFloat(amount).toFixed(2)}` : '¥ 0.00';

  // Choose penguin based on amount and type
  const getPenguinEmoji = () => {
    if (type === 'income') return INCOME_PENGUIN;
    if (parseFloat(amount) > 1000) return EXPENSE_PENGUIN;
    return PENGUIN_EMOJIS[Math.floor(Math.random() * PENGUIN_EMOJIS.length)];
  };

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={Platform.OS === 'web'}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header with penguin */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <PenguinIcon size={36} />
                <Text style={styles.headerTitle}>记账</Text>
              </View>
              <Pressable onPress={() => setShowCatModal(true)} style={styles.headerBtn}>
                <Feather name="sliders" size={16} color="#D4A5B0" />
                <Text style={styles.headerBtnText}>管理分类</Text>
              </Pressable>
            </View>

            {/* Amount */}
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>金额</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                placeholderTextColor="#D4C5C9"
                keyboardType="decimal-pad"
                selectionColor="#D4A5B0"
              />
              <Text style={styles.amountDisplay}>{formattedAmount}</Text>
            </View>

            {/* Type Toggle */}
            <View style={styles.typeToggle}>
              <Pressable
                style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>支出</Text>
              </Pressable>
              <Pressable
                style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActiveIncome]}>收入</Text>
              </Pressable>
            </View>

            {/* Category Grid */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>分类</Text>
              <View style={styles.categoryGrid}>
                {filteredCategories.map(cat => (
                  <Pressable
                    key={cat.id}
                    style={[styles.categoryItem, categoryId === cat.id && styles.categoryItemActive]}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <View style={[styles.categoryIconWrap, categoryId === cat.id && styles.categoryIconWrapActive]}>
                      <CategoryPenguinIcon categoryId={cat.id} size={28} />
                    </View>
                    <Text style={[styles.categoryName, categoryId === cat.id && styles.categoryNameActive]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Date */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>日期</Text>
              <Pressable
                style={styles.dateRow}
                onPress={() => setShowDatePicker(true)}
              >
                <Feather name="calendar" size={16} color="#D4A5B0" />
                <Text style={styles.dateText}>{dayjs(date).format('YYYY年M月D日')}</Text>
                <Feather name="chevron-right" size={16} color="#D4C5C9" />
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, selected) => {
                    setShowDatePicker(false);
                    if (selected) setDate(selected);
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Note */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>备注</Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="添加备注..."
                placeholderTextColor="#D4C5C9"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Image */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>图片</Text>
              {imageUri ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <Pressable style={styles.imageRemoveBtn} onPress={() => setImageUri(null)}>
                    <Feather name="x" size={14} color="#FFF" />
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.imageUploadBtn} onPress={handlePickImage}>
                  <Feather name="camera" size={20} color="#D4A5B0" />
                  <Text style={styles.imageUploadText}>添加图片</Text>
                </Pressable>
              )}
            </View>

            {/* Submit */}
            <Pressable
              style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>保存</Text>
            </Pressable>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* Penguin Celebration Easter Egg */}
      <PenguinCelebration
        visible={showPenguin}
        amount={parseFloat(amount) || 0}
        type={type}
        onComplete={() => setShowPenguin(false)}
      />

      {/* Category Management Modal */}
      <CategoryManageModal
        visible={showCatModal}
        onClose={() => setShowCatModal(false)}
      />
    </Screen>
  );
}

/** Category Management Modal */
function CategoryManageModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { categories, addCategory, deleteCategory } = useFinance();
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'expense' | 'income'>('expense');

  const expenseCats = categories.filter(c => c.type === 'expense');
  const incomeCats = categories.filter(c => c.type === 'income');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addCategory({ name: newName.trim(), type: newType, icon: 'tag', isCustom: true });
    setNewName('');
    Toast.show({ type: 'success', text1: '分类已添加' });
  };

  const handleDelete = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat && !cat.isCustom) {
      Toast.show({ type: 'info', text1: '预设分类不可删除' });
      return;
    }
    Alert.alert('确认', '确定删除该分类？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteCategory(id) },
    ]);
  };

  const renderCatList = (cats: Category[], title: string) => (
    <View style={styles.modalCatSection}>
      <Text style={styles.modalCatTitle}>{title}</Text>
      {cats.map(cat => (
        <View key={cat.id} style={styles.modalCatItem}>
          <CategoryPenguinIcon categoryId={cat.id} size={20} />
          <Text style={styles.modalCatName}>{cat.name}</Text>
          {cat.isCustom && (
            <Pressable onPress={() => handleDelete(cat.id)} style={styles.modalCatDelete}>
              <Feather name="trash-2" size={14} color="#D4A5B0" />
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={Platform.OS === 'web'}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>管理分类</Text>
                <Pressable onPress={onClose}>
                  <Feather name="x" size={20} color="#9A8A8F" />
                </Pressable>
              </View>

              <ScrollView style={styles.modalBody}>
                {renderCatList(expenseCats, '支出分类')}
                <View style={styles.divider} />
                {renderCatList(incomeCats, '收入分类')}
                <View style={styles.divider} />

                {/* Add new */}
                <View style={styles.addCatSection}>
                  <Text style={styles.sectionLabel}>添加自定义分类</Text>
                  <View style={styles.addCatRow}>
                    <Pressable
                      style={[styles.typeBtnSmall, newType === 'expense' && styles.typeBtnSmallActive]}
                      onPress={() => setNewType('expense')}
                    >
                      <Text style={[styles.typeBtnSmallText, newType === 'expense' && styles.typeBtnSmallTextActive]}>支出</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.typeBtnSmall, newType === 'income' && styles.typeBtnSmallActiveIncome]}
                      onPress={() => setNewType('income')}
                    >
                      <Text style={[styles.typeBtnSmallText, newType === 'income' && styles.typeBtnSmallTextActiveIncome]}>收入</Text>
                    </Pressable>
                  </View>
                  <View style={styles.addCatInputRow}>
                    <TextInput
                      style={styles.addCatInput}
                      value={newName}
                      onChangeText={setNewName}
                      placeholder="分类名称"
                      placeholderTextColor="#D4C5C9"
                    />
                    <Pressable style={styles.addCatBtn} onPress={handleAdd}>
                      <Feather name="plus" size={16} color="#FFF" />
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#5A4A4F',
    letterSpacing: -0.5,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 165, 176, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBtnText: {
    fontSize: 12,
    color: '#D4A5B0',
    fontWeight: '500',
  },

  // Amount
  amountSection: {
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4C5C9',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '300',
    color: '#5A4A4F',
    padding: 0,
    marginBottom: 4,
  },
  amountDisplay: {
    fontSize: 12,
    color: '#9A8A8F',
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 165, 176, 0.15)',
    marginVertical: 16,
  },

  // Type toggle
  typeToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 165, 176, 0.1)',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: '#D4A5B0',
  },
  typeBtnActiveIncome: {
    backgroundColor: '#A5C4B0',
  },
  typeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9A8A8F',
  },
  typeBtnTextActive: {
    color: '#FFF',
  },
  typeBtnTextActiveIncome: {
    color: '#FFF',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4C5C9',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 64,
  },
  categoryItemActive: {
    backgroundColor: '#D4A5B0',
  },
  categoryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 165, 176, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  categoryName: {
    fontSize: 11,
    color: '#9A8A8F',
    fontWeight: '500',
  },
  categoryNameActive: {
    color: '#FFF',
  },

  // Date
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(212, 165, 176, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 176, 0.15)',
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: '#5A4A4F',
  },

  // Note
  noteInput: {
    backgroundColor: 'rgba(212, 165, 176, 0.08)',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#5A4A4F',
    minHeight: 80,
    lineHeight: 22,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 176, 0.15)',
  },

  // Image
  imagePreviewWrap: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 176, 0.2)',
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 165, 176, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(212, 165, 176, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 176, 0.2)',
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  imageUploadText: {
    fontSize: 14,
    color: '#D4A5B0',
  },

  // Submit
  submitBtn: {
    backgroundColor: '#D4A5B0',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#D4A5B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(90, 74, 79, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F5F0F3',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 176, 0.15)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#5A4A4F',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  modalCatSection: {
    marginBottom: 8,
  },
  modalCatTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4C5C9',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  modalCatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 176, 0.1)',
    gap: 12,
  },
  modalCatName: {
    flex: 1,
    fontSize: 15,
    color: '#5A4A4F',
  },
  modalCatDelete: {
    padding: 4,
  },
  addCatSection: {
    marginTop: 8,
  },
  addCatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeBtnSmall: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 165, 176, 0.1)',
    alignItems: 'center',
  },
  typeBtnSmallActive: {
    backgroundColor: '#D4A5B0',
  },
  typeBtnSmallActiveIncome: {
    backgroundColor: '#A5C4B0',
  },
  typeBtnSmallText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9A8A8F',
  },
  typeBtnSmallTextActive: {
    color: '#FFF',
  },
  typeBtnSmallTextActiveIncome: {
    color: '#FFF',
  },
  addCatInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addCatInput: {
    flex: 1,
    backgroundColor: 'rgba(212, 165, 176, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#5A4A4F',
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 176, 0.15)',
  },
  addCatBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#D4A5B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
