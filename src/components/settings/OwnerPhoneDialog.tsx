import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Dialog, Portal, Button, Text, TextInput } from 'react-native-paper';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { makeStyles, useColors } from '@/src/theme';
import i18n from '@/src/i18n';
import { useKeyboardHeight } from '@/src/utils/useKeyboardHeight';

interface OwnerPhoneDialogProps {
  visible: boolean;
  onDismiss: () => void;
}

/** Lets the owner add or change their mobile number from Settings. */
export function OwnerPhoneDialog({ visible, onDismiss }: OwnerPhoneDialogProps) {
  const styles = useStyles();
  const colors = useColors();
  const { ownerPhone, setOwnerPhone } = useSettingsStore();
  const [phone, setPhone] = useState(ownerPhone);
  const [error, setError] = useState(false);
  const keyboardHeight = useKeyboardHeight();

  useEffect(() => {
    if (visible) {
      setPhone(ownerPhone);
      setError(false);
    }
  }, [visible, ownerPhone]);

  const handleSave = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      setError(true);
      return;
    }
    await setOwnerPhone(phone, 'settings');
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={keyboardHeight ? { marginBottom: keyboardHeight + 44 } : undefined}>
        <Dialog.Title>{i18n.t('settings.owner_phone')}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodySmall" style={styles.help}>
            {i18n.t('onboarding.phone_help')}
          </Text>
          <TextInput
            mode="outlined"
            dense
            placeholder={i18n.t('phone_prompt.placeholder')}
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              setError(false);
            }}
            keyboardType="phone-pad"
            maxLength={13}
            error={error}
            left={<TextInput.Icon icon="phone" />}
            style={styles.input}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{i18n.t('common.cancel')}</Button>
          <Button onPress={handleSave}>{i18n.t('common.save')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const useStyles = makeStyles((colors) => ({
  help: { color: colors.textSecondary, marginBottom: 10 },
  input: { backgroundColor: colors.surface },
}));
