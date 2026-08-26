/* eslint-disable forbidEmoji/no-emoji */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, FlatList, Image,
  Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { Screen } from '@/components/Screen';
import { useFinance } from '@/contexts/FinanceContext';
import { type Transaction, type Category } from '@/types/finance';
import { EmptyPenguin, PenguinIcon } from '@/components/PenguinCelebration';
import dayjs from 'dayjs';

export default function HistoryScreen() {
  const { transactions, categories, updateTransaction, deleteTransaction } = useFinance();

  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filter transactions
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const txMonth = tx.date.substring(0, 7);
      if (txMonth !== selectedMonth) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [transactions, selectedMonth, typeFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; items: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();
    for (const tx of filtered) {
      if (!map.has(tx.date)) {
        map.set(tx.date, []);
        groups.push({ date: tx.date, items: map.get(tx.date)! });
      }
      map.get(tx.date)!.push(tx);
    }
    return groups;
  }, [filtered]);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name ?? '未知';
  const getCategoryIcon = (id: string) => categories.find(c => c.id === id)?.icon ?? 'help-circle';

  // Month navigation
  const goPrevMonth = () => {
    const d = dayjs(selectedMonth + '-01').subtract(1, 'month');
    setSelectedMonth(d.format('YYYY-MM'));
  };
  const goNextMonth = () => {
    const d = dayjs(selectedMonth + '-01').add(1, 'month');
    if (d.isAfter(dayjs(), 'month')) return;
    setSelectedMonth(d.format('YYYY-MM'));
  };

  // Edit handlers
  const openEdit = (tx: Transaction) => {
    setEditingTx({ ...tx });
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('确认删除', '删除后不可恢复，确定删除？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await deleteTransaction(id);
        setShowEditModal(false);
      }},
    ]);
  };

  // Summary for the month
  const monthSummary = useMemo(() => {
    const monthTx = transactions.filter(tx => tx.date.substring(0, 7) === selectedMonth);
    const income = monthTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
    const expense = monthTx.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
    return { income, expense };
  }, [transactions, selectedMonth]);

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <PenguinIcon size={32} />
          <Text style={styles.headerTitle}>明细</Text>
        </View>
      </View>

      {/* Month selector */}
      <View style={styles.monthSelector}>
        <Pressable onPress={goPrevMonth} style={styles.monthArrow}>
          <Feather name="chevron-left" size={18} color="#D4A5B0" />
        </Pressable>
        <Text style={styles.monthText}>
          {dayjs(selectedMonth + '-01').format('YYYY年M月')}
        </Text>
        <Pressable onPress={goNextMonth} style={styles.monthArrow}>
          <Feather name="chevron-right" size={18} color="#D4A5B0" />
        </Pressable>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>收入</Text>
          <Text style={styles.summaryValueIncome}>¥{monthSummary.income.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>支出</Text>
          <Text style={styles.summaryValueExpense}>¥{monthSummary.expense.toFixed(2)}</Text>
        </View>
      </View>

      {/* Type filter */}
      <View style={styles.filterRow}>
        {(['all', 'expense', 'income'] as const).map(t => (
          <Pressable
            key={t}
            style={[styles.filterBtn, typeFilter === t && styles.filterBtnActive]}
            onPress={() => setTypeFilter(t)}
          >
            <Text style={[styles.filterBtnText, typeFilter === t && styles.filterBtnTextActive]}>
              {t === 'all' ? '全部' : t === 'expense' ? '支出' : '收入'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {grouped.length === 0 ? (
        <EmptyPenguin text="这个月还没有记录哦~" />
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={item => item.date}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.dateGroup}>
              <Text style={styles.dateHeader}>
                {dayjs(item.date).format('M月D日')}
                <Text style={styles.dateWeek}> {['日','一','二','三','四','五','六'][dayjs(item.date).day()]}</Text>
              </Text>
              {item.items.map(tx => (
                <Pressable
                  key={tx.id}
                  style={styles.txItem}
                  onPress={() => openEdit(tx)}
                >
                  <View style={styles.txIconWrap}>
                    <Feather name={getCategoryIcon(tx.categoryId) as any} size={16} color="#D4A5B0" />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txCategory}>{getCategoryName(tx.categoryId)}</Text>
                    {tx.note ? <Text style={styles.txNote} numberOfLines={1}>{tx.note}</Text> : null}
                  </View>
                  <Text style={[styles.txAmount, tx.type === 'expense' ? styles.txAmountExpense : styles.txAmountIncome]}>
                    {tx.type === 'expense' ? '-' : '+'}¥{tx.amount.toFixed(2)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />
      )}

      {/* Edit Modal */}
      {editingTx && (
        <EditTransactionModal
          visible={showEditModal}
          transaction={editingTx}
          categories={categories}
          onClose={() => { setShowEditModal(false); setEditingTx(null); }}
          onSave={async (updates) => {
            await updateTransaction(editingTx.id, updates);
            setShowEditModal(false);
            setEditingTx(null);
          }}
          onDelete={() => handleDelete(editingTx.id)}
        />
      )}
    </Screen>
  );
}

/** Edit Transaction Modal */
function EditTransactionModal({
  visible, transaction, categories, onClose, onSave, onDelete,
}: {
  visible: boolean;
  transaction: Transaction;
  categories: Category[];
  onClose: () => void;
  onSave: (updates: Partial<Transaction>) => Promise<void>;
  onDelete: () => void;
}) {
  const [type, setType] = useState(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [date, setDate] = useState(dayjs(transaction.date).toDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState(transaction.note);
  const [imageUri, setImageUri] = useState<string | null>(transaction.imageBase64 ?? null);

  const filteredCategories = categories.filter(c => c.type === type);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Toast.show({ type: 'error', text1: '请输入有效金额' });
      return;
    }
    await onSave({
      type,
      amount: numAmount,
      categoryId,
      date: dayjs(date).format('YYYY-MM-DD'),
      note: note.trim(),
      imageBase64: imageUri ?? undefined,
    });
    Toast.show({ type: 'success', text1: '修改已保存' });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={Platform.OS === 'web'}>
        <View style={eStyles.overlay}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={eStyles.content}>
              {/* Header */}
              <View style={eStyles.header}>
                <Text style={eStyles.title}>编辑记录</Text>
                <Pressable onPress={onClose}>
                  <Feather name="x" size={20} color="#9A8A8F" />
                </Pressable>
              </View>

              <ScrollView style={eStyles.body} keyboardShouldPersistTaps="handled">
                {/* Amount */}
                <TextInput
                  style={eStyles.amountInput}
                  value={amount}
                  onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholder="金额"
                  selectionColor="#D4A5B0"
                />

                {/* Type */}
                <View style={eStyles.typeRow}>
                  <Pressable
                    style={[eStyles.typeBtn, type === 'expense' && eStyles.typeBtnActive]}
                    onPress={() => setType('expense')}
                  >
                    <Text style={[eStyles.typeBtnText, type === 'expense' && eStyles.typeBtnTextActive]}>支出</Text>
                  </Pressable>
                  <Pressable
                    style={[eStyles.typeBtn, type === 'income' && eStyles.typeBtnActiveIncome]}
                    onPress={() => setType('income')}
                  >
                    <Text style={[eStyles.typeBtnText, type === 'income' && eStyles.typeBtnTextActiveIncome]}>收入</Text>
                  </Pressable>
                </View>

                {/* Category */}
                <View style={eStyles.catGrid}>
                  {filteredCategories.map(cat => (
                    <Pressable
                      key={cat.id}
                      style={[eStyles.catItem, categoryId === cat.id && eStyles.catItemActive]}
                      onPress={() => setCategoryId(cat.id)}
                    >
                      <Feather name={cat.icon as any} size={14} color={categoryId === cat.id ? '#FFF' : '#9A8A8F'} />
                      <Text style={[eStyles.catName, categoryId === cat.id && eStyles.catNameActive]}>{cat.name}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Date */}
                <Pressable style={eStyles.dateRow} onPress={() => setShowDatePicker(true)}>
                  <Feather name="calendar" size={16} color="#D4A5B0" />
                  <Text style={eStyles.dateText}>{dayjs(date).format('YYYY年M月D日')}</Text>
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

                {/* Note */}
                <TextInput
                  style={eStyles.noteInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="备注"
                  placeholderTextColor="#D4C5C9"
                  multiline
                />

                {/* Image */}
                {imageUri ? (
                  <View style={eStyles.imageWrap}>
                    <Image source={{ uri: imageUri }} style={eStyles.image} />
                    <Pressable style={eStyles.imageRemove} onPress={() => setImageUri(null)}>
                      <Feather name="x" size={12} color="#FFF" />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable style={eStyles.imageBtn} onPress={handlePickImage}>
                    <Feather name="camera" size={16} color="#D4A5B0" />
                    <Text style={eStyles.imageBtnText}>添加图片</Text>
                  </Pressable>
                )}
              </ScrollView>

              {/* Footer */}
              <View style={eStyles.footer}>
                <Pressable style={eStyles.deleteBtn} onPress={onDelete}>
                  <Feather name="trash-2" size={16} color="#D4A5B0" />
                  <Text style={eStyles.deleteBtnText}>删除</Text>
                </Pressable>
                <View style={{ flex: 1 }} />
                <Pressable style={eStyles.cancelBtn} onPress={onClose}>
                  <Text style={eStyles.cancelBtnText}>取消</Text>
                </Pressable>
                <Pressable style={eStyles.saveBtn} onPress={handleSave}>
                  <Text style={eStyles.saveBtnText}>保存</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 8,
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
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  monthArrow: {
    padding: 4,
  },
  monthText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5A4A4F',
    minWidth: 100,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(212, 165, 176, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 176, 0.15)',
    borderRadius: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(212, 165, 176, 0.15)',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#D4C5C9',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValueIncome: {
    fontSize: 17,
    fontWeight: '600',
    color: '#5A4A4F',
  },
  summaryValueExpense: {
    fontSize: 17,
    fontWeight: '600',
    color: '#D4A5B0',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginTop: 16,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 165, 176, 0.1)',
  },
  filterBtnActive: {
    backgroundColor: '#D4A5B0',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9A8A8F',
  },
  filterBtnTextActive: {
    color: '#FFF',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#D4C5C9',
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9A8A8F',
    marginBottom: 8,
  },
  dateWeek: {
    fontWeight: '400',
    color: '#D4C5C9',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 176, 0.1)',
    gap: 12,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 165, 176, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txCategory: {
    fontSize: 15,
    fontWeight: '500',
    color: '#5A4A4F',
  },
  txNote: {
    fontSize: 12,
    color: '#9A8A8F',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  txAmountExpense: {
    color: '#D4A5B0',
  },
  txAmountIncome: {
    color: '#5A4A4F',
  },
});

const eStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(90, 74, 79, 0.3)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#F5F0F3',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 176, 0.15)',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#5A4A4F',
  },
  body: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  amountInput: {
    fontSize: 28,
    fontWeight: '300',
    color: '#5A4A4F',
    padding: 0,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 176, 0.15)',
    paddingBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#9A8A8F',
  },
  typeBtnTextActive: {
    color: '#FFF',
  },
  typeBtnTextActiveIncome: {
    color: '#FFF',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 165, 176, 0.1)',
  },
  catItemActive: {
    backgroundColor: '#D4A5B0',
  },
  catName: {
    fontSize: 12,
    color: '#9A8A8F',
    fontWeight: '500',
  },
  catNameActive: {
    color: '#FFF',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(212, 165, 176, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 176, 0.15)',
    marginBottom: 16,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: '#5A4A4F',
  },
  noteInput: {
    backgroundColor: 'rgba(212, 165, 176, 0.08)',
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    color: '#5A4A4F',
    minHeight: 60,
    lineHeight: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 176, 0.15)',
  },
  imageWrap: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 176, 0.2)',
  },
  imageRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 165, 176, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 176, 0.2)',
    borderRadius: 16,
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  imageBtnText: {
    fontSize: 13,
    color: '#D4A5B0',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 165, 176, 0.15)',
    gap: 8,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  deleteBtnText: {
    fontSize: 13,
    color: '#D4A5B0',
    fontWeight: '500',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(212, 165, 176, 0.1)',
    borderRadius: 16,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9A8A8F',
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#D4A5B0',
    borderRadius: 16,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
