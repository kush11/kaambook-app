import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useBusinessStore } from '@/src/stores/useBusinessStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

export default function AddBusinessScreen() {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addBusiness } = useBusinessStore();
  const { setActiveBusinessId } = useSettingsStore();

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setLoading(true);
    const id = await addBusiness(name.trim());
    await setActiveBusinessId(id);
    setLoading(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        label={i18n.t('business.name')}
        value={name}
        onChangeText={(t) => { setName(t); setNameError(false); }}
        error={nameError}
        style={styles.input}
        autoFocus
      />
      <Button mode="contained" onPress={handleSubmit} loading={loading} style={styles.button} contentStyle={styles.buttonContent}>
        {i18n.t('common.save')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  input: { marginBottom: 16 },
  button: { marginTop: 8 },
  buttonContent: { paddingVertical: 6 },
});
