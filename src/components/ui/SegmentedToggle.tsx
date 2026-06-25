import React from 'react';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '@/src/theme/colors';

export interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedToggleProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentedOption[];
  style?: StyleProp<ViewStyle>;
}

/**
 * App-wide segmented toggle rendered as a row of solid buttons. Every option is
 * a full button so both selected and unselected sides clearly read as buttons:
 * the selected one is filled orange with white text, the others are solid grey
 * with dark text. Replaces react-native-paper's SegmentedButtons, whose
 * unselected segments were transparent and disappeared on white surfaces.
 */
export function SegmentedToggle({ value, onValueChange, options, style }: SegmentedToggleProps) {
  return (
    <View style={[styles.row, style]}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onValueChange(opt.value)}
            style={({ pressed }) => [
              styles.segment,
              selected ? styles.segmentSelected : null,
              pressed ? styles.segmentPressed : null,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, selected && styles.labelSelected]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  segmentSelected: {
    backgroundColor: colors.primary,
  },
  segmentPressed: {
    opacity: 0.7,
  },
  label: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  labelSelected: {
    color: '#fff',
  },
});
