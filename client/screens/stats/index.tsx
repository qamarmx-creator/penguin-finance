/* eslint-disable forbidEmoji/no-emoji */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';
import { Screen } from '@/components/Screen';
import { useFinance } from '@/contexts/FinanceContext';
import { EmptyPenguin, PenguinIcon } from '@/components/PenguinCelebration';
import dayjs from 'dayjs';

// Cute pastel colors for pie chart segments
const PIE_COLORS = [
  '#D4A5B0', '#A5C4B0', '#B0A5C4', '#C4B0A5', '#A5B8C4',
  '#C4A5B8', '#B0C4A5', '#C4A5A5', '#A5C4C4', '#C4C4A5',
];

export default function StatsScreen() {
  const { transactions, categories } = useFinance();
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));

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

  // Month data
  const monthData = useMemo(() => {
    const monthTx = transactions.filter(tx => tx.date.substring(0, 7) === selectedMonth);
    const income = monthTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
    const expense = monthTx.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);

    // Daily expense data for trend chart
    const daysInMonth = dayjs(selectedMonth + '-01').daysInMonth();
    const dailyExpense: { day: string; value: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      const dayExpense = monthTx
        .filter(tx => tx.date === dateStr && tx.type === 'expense')
        .reduce((s, tx) => s + tx.amount, 0);
      dailyExpense.push({ day: `${d}`, value: dayExpense });
    }

    // Category breakdown for expense
    const expTx = monthTx.filter(tx => tx.type === 'expense');
    const catMap = new Map<string, number>();
    for (const tx of expTx) {
      catMap.set(tx.categoryId, (catMap.get(tx.categoryId) ?? 0) + tx.amount);
    }
    const catBreakdown = Array.from(catMap.entries())
      .map(([catId, amount]) => ({
        categoryId: catId,
        name: categories.find(c => c.id === catId)?.name ?? '未知',
        amount,
        percentage: expense > 0 ? (amount / expense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { income, expense, balance: income - expense, dailyExpense, catBreakdown };
  }, [transactions, categories, selectedMonth]);

  // Line chart data
  const lineChartData = useMemo(() => {
    return monthData.dailyExpense.map(d => ({ value: d.value, label: d.day }));
  }, [monthData]);

  // Pie chart data
  const pieData = useMemo(() => {
    return monthData.catBreakdown.map((c, i) => ({
      value: c.amount,
      text: c.name,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [monthData]);

  // Export Excel
  const handleExport = useCallback(async () => {
    const monthTx = transactions
      .filter(tx => tx.date.substring(0, 7) === selectedMonth)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (monthTx.length === 0) {
      Toast.show({ type: 'info', text1: '当月暂无记录可导出' });
      return;
    }

    const data = monthTx.map(tx => ({
      '日期': tx.date,
      '类型': tx.type === 'income' ? '收入' : '支出',
      '分类': categories.find(c => c.id === tx.categoryId)?.name ?? '',
      '金额': tx.amount,
      '备注': tx.note || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 12 }, { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 20 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '记账记录');

    if (Platform.OS === 'web') {
      XLSX.writeFile(wb, `记账记录_${selectedMonth}.xlsx`);
      Toast.show({ type: 'success', text1: '文件已开始下载' });
    } else {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      const fileUri = `${(FileSystem as any).documentDirectory}记账记录_${selectedMonth}.xlsx`;
      await (FileSystem as any).writeAsStringAsync(fileUri, wbout, { encoding: (FileSystem as any).EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Toast.show({ type: 'info', text1: '当前设备不支持文件分享' });
      }
    }
  }, [transactions, categories, selectedMonth]);

  const maxExpense = Math.max(...monthData.dailyExpense.map(d => d.value), 1);

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <PenguinIcon size={32} />
            <Text style={styles.headerTitle}>统计</Text>
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

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>收入</Text>
            <Text style={styles.summaryValue}>¥{monthData.income.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>支出</Text>
            <Text style={[styles.summaryValue, styles.expenseColor]}>¥{monthData.expense.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>结余</Text>
            <Text style={[styles.summaryValue, monthData.balance >= 0 ? styles.balancePositive : styles.expenseColor]}>
              ¥{monthData.balance.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Trend chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>支出趋势</Text>
          <View style={styles.chartCard}>
            {lineChartData.some(d => d.value > 0) ? (
              <LineChart
                data={lineChartData}
                height={200}
                spacing={10}
                hideRules
                hideYAxisText
                yAxisColor="rgba(212, 165, 176, 0.15)"
                xAxisColor="rgba(212, 165, 176, 0.15)"
                color="#D4A5B0"
                thickness={2}
                textColor="#9A8A8F"
                textFontSize={8}
                startFillColor="#D4A5B0"
                startOpacity={0.1}
                endFillColor="#D4A5B0"
                endOpacity={0}
                initialSpacing={10}
                yAxisThickness={0}
                xAxisThickness={1}
                noOfSections={3}
                maxValue={maxExpense * 1.2}
                adjustToWidth
                xAxisLabelTexts={lineChartData
                  .map((d, i) => (i % 5 === 0 || i === lineChartData.length - 1) ? d.label : '')
                }
              />
            ) : (
              <View style={styles.emptyChart}>
                <PenguinIcon size={48} />
                <Text style={styles.emptyChartText}>暂无支出数据</Text>
              </View>
            )}
          </View>
        </View>

        {/* Category breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>分类占比</Text>
          {pieData.length > 0 ? (
            <View style={styles.chartCard}>
              <View style={styles.pieContainer}>
                <PieChart
                  data={pieData}
                  donut
                  innerRadius={50}
                  radius={80}
                  strokeWidth={0}
                  showText={false}
                  centerLabelComponent={() => (
                    <View style={styles.pieCenter}>
                      <PenguinIcon size={28} />
                      <Text style={styles.pieCenterAmount}>¥{monthData.expense.toFixed(0)}</Text>
                      <Text style={styles.pieCenterLabel}>总支出</Text>
                    </View>
                  )}
                />
              </View>
              {/* Legend */}
              <View style={styles.legend}>
                {monthData.catBreakdown.map((c, i) => (
                  <View key={c.categoryId} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }]} />
                    <Text style={styles.legendName}>{c.name}</Text>
                    <Text style={styles.legendValue}>{c.percentage.toFixed(1)}%</Text>
                    <Text style={styles.legendAmount}>¥{c.amount.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={[styles.chartCard, styles.emptyChart]}>
              <PenguinIcon size={48} />
              <Text style={styles.emptyChartText}>暂无数据</Text>
            </View>
          )}
        </View>

        {/* Export button */}
        <Pressable style={styles.exportBtn} onPress={handleExport}>
          <Feather name="download" size={16} color="#FFF" />
          <Text style={styles.exportBtnText}>导出 Excel</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  header: {
    marginBottom: 24,
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
    paddingVertical: 8,
    gap: 16,
    marginBottom: 20,
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

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(212, 165, 176, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 176, 0.15)',
    borderRadius: 20,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D4C5C9',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5A4A4F',
  },
  expenseColor: {
    color: '#D4A5B0',
  },
  balancePositive: {
    color: '#A5C4B0',
  },

  // Section
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4C5C9',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  chartCard: {
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 176, 0.15)',
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyChartText: {
    fontSize: 13,
    color: '#D4C5C9',
  },

  // Pie chart
  pieContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pieCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5A4A4F',
  },
  pieCenterLabel: {
    fontSize: 10,
    color: '#9A8A8F',
    marginTop: 2,
  },

  // Legend
  legend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    fontSize: 13,
    color: '#5A4A4F',
    flex: 1,
  },
  legendValue: {
    fontSize: 12,
    color: '#9A8A8F',
    fontWeight: '500',
    minWidth: 44,
    textAlign: 'right',
  },
  legendAmount: {
    fontSize: 12,
    color: '#9A8A8F',
    minWidth: 70,
    textAlign: 'right',
  },

  // Export
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4A5B0',
    borderRadius: 24,
    paddingVertical: 16,
    shadowColor: '#D4A5B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exportBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
