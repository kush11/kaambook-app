import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { MonthNavigator } from '@/src/components/attendance/MonthNavigator';
import { CashbookEntryCard } from '@/src/components/cashbook/CashbookEntryCard';
import { AddCashbookEntry } from '@/src/components/cashbook/AddCashbookEntry';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { useCashbookStore } from '@/src/stores/useCashbookStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { colors } from '@/src/theme/colors';
import { formatCurrency } from '@/src/utils/formatters';
import i18n from '@/src/i18n';
import dayjs from 'dayjs';

export default function CashbookScreen() {
  const { entries, totalIncome, totalExpense, balance, loadEntries, addEntry, deleteEntry } = useCashbookStore();
  const { activeBusinessId } = useSettingsStore();
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month());
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (activeBusinessId) loadEntries(activeBusinessId, year, month);
    }, [activeBusinessId, year, month])
  );

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleAdd = async (data: any) => {
    if (!activeBusinessId) return;
    setLoading(true);
    try {
      await addEntry({ businessId: activeBusinessId, ...data });
    } catch (e) {
      console.error('Failed to add cashbook entry:', e);
    }
    setLoading(false);
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id, activeBusinessId, year, month);
  };

  return (
    <View style={styles.container}>
      <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Card style={[styles.summaryCard, { borderLeftColor: colors.primary }]}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.summaryLabel}>{i18n.t('cashbook.income')}</Text>
            <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: 'bold' }}>
              {formatCurrency(totalIncome)}
            </Text>
          </Card.Content>
        </Card>
        <Card style={[styles.summaryCard, { borderLeftColor: colors.error }]}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.summaryLabel}>{i18n.t('cashbook.expense')}</Text>
            <Text variant="titleMedium" style={{ color: colors.error, fontWeight: 'bold' }}>
              {formatCurrency(totalExpense)}
            </Text>
          </Card.Content>
        </Card>
        <Card style={[styles.summaryCard, { borderLeftColor: balance >= 0 ? colors.primary : colors.error }]}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.summaryLabel}>{i18n.t('cashbook.balance')}</Text>
            <Text variant="titleMedium" style={{ color: balance >= 0 ? colors.primary : colors.error, fontWeight: 'bold' }}>
              {formatCurrency(balance)}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <FlatList
        style={styles.flatList}
        data={entries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <CashbookEntryCard entry={item} onDelete={() => handleDelete(item.id)} />
        )}
        contentContainerStyle={entries.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState icon="book-open-outline" title={i18n.t('cashbook.no_entries')} subtitle={i18n.t('cashbook.add_entry_hint')} />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.7}>
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={showAdd}
          onDismiss={() => setShowAdd(false)}
          contentContainerStyle={styles.modal}
        >
          <AddCashbookEntry onSubmit={handleAdd} isLoading={loading} />
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8 },
  summaryCard: { flex: 1, marginHorizontal: 4, backgroundColor: '#fff', borderLeftWidth: 3 },
  summaryLabel: { color: colors.textSecondary },
  flatList: { flex: 1 },
  list: { paddingBottom: 80 },
  emptyContainer: { flex: 1 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 16, justifyContent: 'center' as const, alignItems: 'center' as const, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.27, shadowRadius: 4.65 },
  modal: { backgroundColor: colors.surface, borderRadius: 16, marginHorizontal: 16, maxHeight: '85%', overflow: 'hidden' },
});
