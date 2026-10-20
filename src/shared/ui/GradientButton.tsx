import React, { useId } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type Props = {
  label: string;
  onPress: () => void;
  from: string;
  to: string;
  accessibilityHint?: string;
};

/** Primary button with a horizontal gradient, drawn with react-native-svg. */
export function GradientButton({ label, onPress, from, to, accessibilityHint }: Props) {
  const gradientId = `grad${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={{ height: 56, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
      <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}
