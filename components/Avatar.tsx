import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';

type Props = {
  avatarUrl?: string | null;
  emoji: string;
  size?: number;
  borderColor?: string;
};

export function Avatar({ avatarUrl, emoji, size = 60, borderColor }: Props) {
  const radius = size / 2;

  const borderStyle = borderColor
    ? { borderWidth: 2.5, borderColor }
    : undefined;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.base, { width: size, height: size, borderRadius: radius }, borderStyle]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.base, styles.fallback, { width: size, height: size, borderRadius: radius }, borderStyle]}>
      <Text style={{ fontSize: size * 0.44 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: Colors.surface2, overflow: 'hidden' },
  fallback: { backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
});
