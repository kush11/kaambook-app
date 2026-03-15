import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { PaymentForm } from '@/src/components/payment/PaymentForm';
import { usePaymentStore } from '@/src/stores/usePaymentStore';
import { colors } from '@/src/theme/colors';
import type { PaymentType, PaymentMode } from '@/src/types';

export default function AddPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addPayment } = usePaymentStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: { amount: number; type: PaymentType; mode: PaymentMode; note: string }) => {
    setLoading(true);
    await addPayment({
      staffId: id,
      ...data,
    });
    setLoading(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <PaymentForm onSubmit={handleSubmit} isLoading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
