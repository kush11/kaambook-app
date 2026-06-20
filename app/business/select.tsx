import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Text, FAB, IconButton, Dialog, Portal, Button, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { useBusinessStore } from '@/src/stores/useBusinessStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { colors } from '@/src/theme/colors';
import type { Business } from '@/src/types';
import i18n from '@/src/i18n';

export default function SelectBusinessScreen() {
  const { businesses, activeBusiness, loadBusinesses, setActiveBusiness, updateBusiness, deleteBusiness } = useBusinessStore();
  const { setActiveBusinessId } = useSettingsStore();
  const { loadStaff } = useStaffStore();

  const [renameTarget, setRenameTarget] = useState<Business | null>(null);
  const [renameText, setRenameText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const handleSelect = async (business: Business) => {
    await setActiveBusiness(business.id);
    await setActiveBusinessId(business.id);
    await loadStaff(business.id);
    router.back();
  };

  const openRename = (business: Business) => {
    setRenameText(business.name);
    setRenameTarget(business);
  };

  const handleRename = async () => {
    if (!renameTarget || !renameText.trim()) return;
    await updateBusiness(renameTarget.id, renameText.trim());
    setRenameTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const wasActive = deleteTarget.id === activeBusiness?.id;
    const newActiveId = await deleteBusiness(deleteTarget.id);
    setDeleteTarget(null);
    if (wasActive && newActiveId) {
      await setActiveBusinessId(newActiveId);
      await loadStaff(newActiveId);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={businesses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isActive = item.id === activeBusiness?.id;
          return (
            <Card
              style={[styles.card, isActive && styles.activeCard]}
              onPress={() => handleSelect(item)}
              mode="elevated"
            >
              <Card.Content style={styles.cardContent}>
                {isActive && <IconButton icon="check-circle" iconColor={colors.primary} size={24} style={styles.checkIcon} />}
                <View style={styles.cardInfo}>
                  <Text variant="titleMedium">{item.name}</Text>
                  <Text variant="bodySmall" style={styles.type}>{item.type}</Text>
                </View>
                <IconButton icon="pencil" size={20} onPress={() => openRename(item)} />
                {businesses.length > 1 && (
                  <IconButton icon="trash-can-outline" iconColor={colors.error} size={20} onPress={() => setDeleteTarget(item)} />
                )}
              </Card.Content>
            </Card>
          );
        }}
        contentContainerStyle={styles.list}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/business/add')}
        color="#fff"
        label={i18n.t('business.add')}
      />

      <Portal>
        <Dialog visible={!!renameTarget} onDismiss={() => setRenameTarget(null)}>
          <Dialog.Title>{i18n.t('business.rename')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label={i18n.t('business.name')}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameTarget(null)}>{i18n.t('common.cancel')}</Button>
            <Button onPress={handleRename} disabled={!renameText.trim()}>{i18n.t('common.save')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ConfirmDialog
        visible={!!deleteTarget}
        title={i18n.t('business.delete')}
        message={i18n.t('business.delete_confirm')}
        confirmLabel={i18n.t('common.delete')}
        onConfirm={handleDelete}
        onDismiss={() => setDeleteTarget(null)}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 96 },
  card: { marginBottom: 12, backgroundColor: colors.surface, borderRadius: 16 },
  activeCard: { borderColor: colors.primary, borderWidth: 2 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  checkIcon: { margin: 0, marginRight: 4 },
  cardInfo: { flex: 1 },
  type: { color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: colors.primary },
});
