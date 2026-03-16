import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Text, FAB, RadioButton, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { useBusinessStore } from '@/src/stores/useBusinessStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { colors } from '@/src/theme/colors';
import type { Business } from '@/src/types';
import i18n from '@/src/i18n';

export default function SelectBusinessScreen() {
  const { businesses, activeBusiness, loadBusinesses, setActiveBusiness } = useBusinessStore();
  const { setActiveBusinessId } = useSettingsStore();
  const { loadStaff } = useStaffStore();

  useEffect(() => {
    loadBusinesses();
  }, []);

  const handleSelect = async (business: Business) => {
    await setActiveBusiness(business.id);
    await setActiveBusinessId(business.id);
    router.back();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={businesses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card
            style={[styles.card, item.id === activeBusiness?.id && styles.activeCard]}
            onPress={() => handleSelect(item)}
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardInfo}>
                <Text variant="titleMedium">{item.name}</Text>
                <Text variant="bodySmall" style={styles.type}>{item.type}</Text>
              </View>
              {item.id === activeBusiness?.id && (
                <IconButton icon="check-circle" iconColor={colors.primary} size={24} />
              )}
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.list}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/business/add')}
        color="#fff"
        label={i18n.t('business.add')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 80 },
  card: { marginBottom: 12, backgroundColor: '#fff' },
  activeCard: { borderColor: colors.primary, borderWidth: 2 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1 },
  type: { color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: colors.primary },
});
