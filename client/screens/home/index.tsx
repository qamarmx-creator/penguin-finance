import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  Image, Alert, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Screen } from '@/components/Screen';
import { useFinance } from '@/contexts/FinanceContext';
import { type Category } from '@/types/finance';
import dayjs from 'dayjs';

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
      Alert.alert('提示', '请输入有效金额');
      return;
    }
    if (!categoryId) {
      Alert.alert('提示', '请选择分类');
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
      Alert.alert('成功', '记录已保存');
    } catch (e) {
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }, [amount, categoryId, date, note, imageUri, type, addTransaction]);

  // No local handleAddCategory needed - handled in CategoryManageModal

  const formattedAmount = amount ? `¥ ${parseFloat(amount).toFixed(2)}` : '¥ 0.00';

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
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>记账</Text>
              <Pressable onPress={() => setShowCatModal(true)} style={styles.headerBtn}>
                <Feather name="settings" size={18} color="#888" />
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
                placeholderTextColor="#CCC"
                keyboardType="decimal-pad"
                selectionColor="#111"
              />
              <Text style={styles.amountDisplay}>{formattedAmount}</Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

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
                      <Feather
                        name={cat.icon as any}
                        size={18}
                        color={categoryId === cat.id ? '#FFF' : '#888'}
                      />
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
                <Feather name="calendar" size={16} color="#888" />
                <Text style={styles.dateText}>{dayjs(date).format('YYYY年M月D日')}</Text>
                <Feather name="chevron-right" size={16} color="#CCC" />
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
                placeholderTextColor="#CCC"
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
                  <Feather name="camera" size={20} color="#CCC" />
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
  };

  const handleDelete = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat && !cat.isCustom) {
      Alert.alert('提示', '预设分类不可删除');
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
          <Feather name={cat.icon as any} size={16} color="#888" />
          <Text style={styles.modalCatName}>{cat.name}</Text>
          {cat.isCustom && (
            <Pressable onPress={() => handleDelete(cat.id)} style={styles.modalCatDelete}>
              <Feather name="trash-2" size={14} color="#E85D5D" />
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
                  <Feather name="x" size={20} color="#888" />
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
                      placeholderTextColor="#CCC"
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
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.5,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBtnText: {
    fontSize: 12,
    color: '#888',
  },

  // Amount
  amountSection: {
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCC',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '300',
    color: '#111',
    padding: 0,
    marginBottom: 4,
  },
  amountDisplay: {
    fontSize: 12,
    color: '#888',
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ECECEC',
    marginVertical: 20,
  },

  // Type toggle
  typeToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: '#111',
  },
  typeBtnActiveIncome: {
    backgroundColor: '#111',
  },
  typeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
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
    color: '#CCC',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 64,
  },
  categoryItemActive: {
    backgroundColor: '#111',
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  categoryName: {
    fontSize: 11,
    color: '#888',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: '#111',
  },

  // Note
  noteInput: {
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111',
    minHeight: 80,
    lineHeight: 22,
  },

  // Image
  imagePreviewWrap: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  imageUploadText: {
    fontSize: 14,
    color: '#CCC',
  },

  // Submit
  submitBtn: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECECEC',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
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
    color: '#CCC',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  modalCatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECECEC',
    gap: 12,
  },
  modalCatName: {
    flex: 1,
    fontSize: 15,
    color: '#111',
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
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
  },
  typeBtnSmallActive: {
    backgroundColor: '#111',
  },
  typeBtnSmallActiveIncome: {
    backgroundColor: '#111',
  },
  typeBtnSmallText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
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
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
  },
  addCatBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
