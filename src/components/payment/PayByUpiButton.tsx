import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Button, Dialog, Portal, Text, TextInput, HelperText, Snackbar } from 'react-native-paper';
import dayjs from 'dayjs';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { usePaymentStore } from '@/src/stores/usePaymentStore';
import { isValidUpiId, openUpiPayment } from '@/src/utils/upi';
import { formatCurrency } from '@/src/utils/formatters';
import { track } from '@/src/utils/analytics';
import { useColors } from '@/src/theme';
import type { Staff } from '@/src/types';
import i18n from '@/src/i18n';

interface Props {
  staff: Staff;
  amount: number;
  /** Date the payment is recorded on, so it counts in the month being viewed. */
  paymentDate?: string;
  source: 'salary_due' | 'staff_detail';
  onPaid?: () => void;
  compact?: boolean;
}

type Step = 'idle' | 'ask_id' | 'in_upi_app' | 'confirm';

/**
 * "Pay ₹X by UPI": opens the owner's UPI app with the amount filled in, then — because
 * Android does not report the result reliably — asks whether it went through and records
 * the payment only on "Yes".
 */
export function PayByUpiButton({ staff, amount, paymentDate, source, onPaid, compact }: Props) {
  const colors = useColors();
  const { updateStaff } = useStaffStore();
  const { addPayment } = usePaymentStore();
  const [step, setStep] = useState<Step>('idle');
  const [idText, setIdText] = useState('');
  const [idError, setIdError] = useState(false);
  const [snack, setSnack] = useState('');
  const stepRef = useRef<Step>('idle');
  stepRef.current = step;
  const amountText = formatCurrency(amount);

  // Coming back from the UPI app → ask whether the payment went through.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && stepRef.current === 'in_upi_app') setStep('confirm');
    });
    return () => sub.remove();
  }, []);

  const launch = async (upiId: string) => {
    track('upi_pay_started', { source });
    const ok = await openUpiPayment({
      upiId,
      name: staff.name,
      amount,
      note: `Salary ${dayjs(paymentDate).format('MMM YYYY')}`,
    });
    if (ok) {
      setStep('in_upi_app');
    } else {
      track('upi_pay_no_app', { source });
      setStep('idle');
      setSnack(i18n.t('upi.no_app'));
    }
  };

  const start = () => {
    if (staff.upiId && isValidUpiId(staff.upiId)) launch(staff.upiId);
    else {
      setIdText('');
      setIdError(false);
      setStep('ask_id');
    }
  };

  const saveIdAndPay = async () => {
    const id = idText.trim();
    if (!isValidUpiId(id)) {
      setIdError(true);
      return;
    }
    await updateStaff(staff.id, { upiId: id });
    track('upi_id_added', { source });
    launch(id);
  };

  const record = async (paid: boolean) => {
    setStep('idle');
    track('upi_pay_confirmed', { source, paid });
    if (!paid) return;
    const today = dayjs().format('YYYY-MM-DD');
    await addPayment({
      staffId: staff.id,
      amount,
      type: 'salary',
      mode: 'upi',
      date: paymentDate && paymentDate < today ? paymentDate : today,
      note: 'UPI',
    });
    setSnack(i18n.t('upi.recorded'));
    onPaid?.();
  };

  return (
    <>
      <Button
        mode={compact ? 'contained-tonal' : 'contained'}
        icon="bank-transfer"
        compact={compact}
        onPress={start}
        buttonColor={compact ? colors.primaryTint : colors.present}
        textColor={compact ? colors.primaryDark : '#fff'}
      >
        {compact ? 'UPI' : i18n.t('upi.pay', { amount: amountText })}
      </Button>
      <Portal>
        <Dialog visible={step === 'ask_id'} onDismiss={() => setStep('idle')}>
          <Dialog.Title>{i18n.t('upi.add_id_title')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
              {i18n.t('upi.add_id_body', { name: staff.name })}
            </Text>
            <TextInput
              mode="outlined"
              label={i18n.t('staff.upi_id')}
              value={idText}
              onChangeText={(t) => { setIdText(t.replace(/\s/g, '')); setIdError(false); }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              error={idError}
              autoFocus
            />
            <HelperText type={idError ? 'error' : 'info'}>
              {idError ? i18n.t('staff.upi_invalid') : i18n.t('staff.upi_id_hint')}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStep('idle')}>{i18n.t('common.cancel')}</Button>
            <Button onPress={saveIdAndPay}>{i18n.t('upi.pay', { amount: amountText })}</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={step === 'confirm'} onDismiss={() => record(false)}>
          <Dialog.Title>{i18n.t('upi.confirm_title')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{i18n.t('upi.confirm_body', { amount: amountText, name: staff.name })}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => record(false)}>{i18n.t('upi.no')}</Button>
            <Button onPress={() => record(true)}>{i18n.t('upi.yes')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
          {snack}
        </Snackbar>
      </Portal>
    </>
  );
}
