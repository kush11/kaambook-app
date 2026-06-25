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
 * App-wide segmented toggle. One consistent look everywhere: a light-grey track
 * with the selected option as a solid orange pill and the unselected options
 * shown as dark text on the grey track (so they stay clearly visible, even on
 * white backgrounds). Replaces react-native-paper's SegmentedButtons, whose
 * unselected segments were transparent and disappeared on white surfaces.
 */
export function SegmentedToggle({ value, onValueChange, options, style }: SegmentedToggleProps) {
  return (
    <View style={[styles.track, style]}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onValueChange(opt.value)}
            style={({ pressed }) => [
              styles.segment,
              selected ? styles.segmentSelected : null,
              pressed && !selected ? styles.segmentPressed : null,
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
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.primary,
  },
  segmentPressed: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  label: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  labelSelected: {
    color: '#fff',
  },
});
