import React from 'react';
import { Avatar } from 'react-native-paper';
import { colors } from '@/src/theme/colors';

interface StaffAvatarProps {
  name: string;
  photoUri?: string | null;
  size?: number;
}

const avatarColors = [
  '#16A34A', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

function getColorForName(name: string): string {
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
  return (
    <Avatar.Text
      size={size}
      label={getInitials(name)}
      style={{ backgroundColor: getColorForName(name) }}
      labelStyle={{ fontSize: size * 0.38 }}
    />
  );
}
