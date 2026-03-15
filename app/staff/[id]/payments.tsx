import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { PaymentCard } from '@/src/components/payment/PaymentCard';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { usePaymentStore } from '@/src/stores/usePaymentStore';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

export default function PaymentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { payments, loadPayments, deletePayment } = usePaymentStore();

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
            onDelete={() => deletePayment(item.id, id)}
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
