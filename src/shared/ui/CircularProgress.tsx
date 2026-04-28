import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { C } from '../theme/colors';
import type { UiState } from '../../features/cycle/domain/cycleStateMachine';

type Props = {
  day: number;
  total: number;
  uiState: UiState;
  size?: number;
};

export function CircularProgress({ day, total, uiState, size = 260 }: Props) {
  const R = Math.round(size * 0.415);
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * R;
  const progress = Math.min(day / total, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const trackColor = C.slate100;
  const progressColor =
    uiState === 'NO_RING'    ? C.slate200 :
    uiState === 'RING_FREE'  ? C.emerald  :
    'url(#indigoGrad)';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', top: 0, left: 0, transform: [{ rotate: '-90deg' }] }}
      >
        <Defs>
          <LinearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={C.indigo} />
            <Stop offset="100%" stopColor={C.indigoLight} />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle cx={cx} cy={cy} r={R} fill="none" stroke={trackColor} strokeWidth={14} />
        {/* Progress */}
        <Circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke={progressColor}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>

      {/* Center text */}
      <View style={{ alignItems: 'center', zIndex: 1 }}>
        {uiState === 'RING_IN_USE' && (
          <>
            <Text style={{ fontSize: 11, color: C.slate400, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>
              Día
            </Text>
            <Text style={{ fontSize: 56, fontWeight: '800', color: C.text, lineHeight: 60, letterSpacing: -2 }}>
              {day}
            </Text>
            <Text style={{ fontSize: 14, color: C.slate400, fontWeight: '500', marginTop: 2 }}>
              de {total}
            </Text>
            <Text style={{ fontSize: 11, color: C.slate400, marginTop: 6, fontWeight: '500' }}>
              Anillo en uso
            </Text>
          </>
        )}

        {uiState === 'NO_RING' && (
          <>
            <Text style={{ fontSize: 11, color: C.slate400, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
              Sin anillo
            </Text>
            <Text style={{ fontSize: 32, lineHeight: 36 }}>💍</Text>
          </>
        )}

        {uiState === 'RING_FREE' && (
          <>
            <Text style={{ fontSize: 11, color: C.slate400, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
              Descanso
            </Text>
            <Text style={{ fontSize: 44, fontWeight: '800', color: C.emeraldDark, lineHeight: 48 }}>
              {day}
            </Text>
            <Text style={{ fontSize: 13, color: C.slate400, fontWeight: '500', marginTop: 4 }}>
              de 7 días
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
