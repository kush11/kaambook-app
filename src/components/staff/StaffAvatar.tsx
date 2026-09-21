import React from 'react';
import { Avatar } from 'react-native-paper';
import { colors } from '@/src/theme/colors';

interface StaffAvatarProps {
  name: string;
  photoUri?: string | null;
  size?: number;
}

// Soft tint behind dark initials of the same hue.
const avatarColors: { bg: string; fg: string }[] = [
  { bg: '#FFEDD5', fg: '#9A3412' },
  { bg: '#DCFCE7', fg: '#166534' },
  { bg: '#DBEAFE', fg: '#1E40AF' },
  { bg: '#FCE7F3', fg: '#9D174D' },
  { bg: '#FEF3C7', fg: '#92400E' },
  { bg: '#E0E7FF', fg: '#3730A3' },
  { bg: '#CCFBF1', fg: '#115E59' },
  { bg: '#FEE2E2', fg: '#991B1B' },
];

function getColorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function StaffAvatar({ name, photoUri, size = 48 }: StaffAvatarProps) {
  if (photoUri) {
    return <Avatar.Image size={size} source={{ uri: photoUri }} />;
  }
  const { bg, fg } = getColorForName(name);
  return (
    <Avatar.Text
      size={size}
      label={getInitials(name)}
      color={fg}
      style={{ backgroundColor: bg }}
      labelStyle={{ fontSize: size * 0.38, fontWeight: '700' }}
    />
  );
}
