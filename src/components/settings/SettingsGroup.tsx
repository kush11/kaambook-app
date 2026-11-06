import React from 'react';
import { View } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { makeStyles } from '@/src/theme';

/**
 * A titled, rounded group of settings rows with a divider between rows — the layout
 * Android's own Settings app uses, so related options read as one block.
 */
export function SettingsGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  const styles = useStyles();
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.wrapper}>
      {title ? <Text variant="labelLarge" style={styles.title}>{title}</Text> : null}
      <View style={styles.card}>
        {rows.map((row, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Divider style={styles.divider} />}
            {row}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrapper: { marginHorizontal: 16, marginTop: 20 },
  title: { color: colors.primary, marginLeft: 4, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  // Starts after the row icon, like Android's settings lists.
  divider: { marginLeft: 56, backgroundColor: colors.divider },
}));
