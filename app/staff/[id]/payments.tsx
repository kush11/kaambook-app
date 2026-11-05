import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { PaymentCard } from '@/src/components/payment/PaymentCard';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { usePaymentStore } from '@/src/stores/usePaymentStore';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

export default function PaymentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { payments, loadPayments, deletePayment } = usePaymentStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadPayments(id);
    }, [id])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={payments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PaymentCard
            payment={item}
            onDelete={() => setDeleteId(item.id)}
          />
        )}
        contentContainerStyle={payments.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState icon="cash-remove" title={i18n.t('payment.no_payments')} />
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push(`/staff/${id}/add-payment`)}
        color="#fff"
        accessibilityLabel={i18n.t('payment.add')}
      />
      <ConfirmDialog
        visible={!!deleteId}
        title={i18n.t('common.delete')}
        message={i18n.t('payment.delete_confirm')}
        confirmLabel={i18n.t('common.delete')}
        onConfirm={async () => {
          if (deleteId) await deletePayment(deleteId, id);
          setDeleteId(null);
        }}
        onDismiss={() => setDeleteId(null)}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: 80, paddingTop: 8 },
  emptyContainer: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
  },
});
