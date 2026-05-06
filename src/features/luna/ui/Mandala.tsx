import React, { memo } from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import Svg, { Circle, Path, Text as SvgText, G, Line } from 'react-native-svg';
import type { DayData } from '../data/lunaRepo';
import { getMoonPhaseDay, addDays } from '../domain/moonPhase';

// ── Base proportions (relative to base SIZE 332) ─────────────────────────────
const BASE   = 332;
const DAYS   = 28;
const DEG    = 360 / DAYS;

const COLOR_INDIGO      = '#3A3CF6';
const COLOR_PERIOD      = '#F4B8BE';
const COLOR_DEFAULT     = '#f0ece4';
const COLOR_BORDER      = '#dedad0';
const COLOR_DARK_BORDER = '#d4cfc0';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function sectorPath(
  cx: number, cy: number,
  r1: number, r2: number,
  startDeg: number, endDeg: number,
): string {
  const s = toRad(startDeg);
  const e = toRad(endDeg);
  const x1 = cx + r1 * Math.cos(s), y1 = cy + r1 * Math.sin(s);
  const x2 = cx + r2 * Math.cos(s), y2 = cy + r2 * Math.sin(s);
  const x3 = cx + r2 * Math.cos(e), y3 = cy + r2 * Math.sin(e);
  const x4 = cx + r1 * Math.cos(e), y4 = cy + r1 * Math.sin(e);
  const lg = endDeg - startDeg > 180 ? 1 : 0;
  return `M${x1},${y1}L${x2},${y2}A${r2},${r2} 0 ${lg} 1 ${x3},${y3}L${x4},${y4}A${r1},${r1} 0 ${lg} 0 ${x1},${y1}Z`;
}

// ── Mini moon ─────────────────────────────────────────────────────────────────

function MiniMoon({ phaseDay, cx, cy, size = 13 }: {
  phaseDay: number; cx: number; cy: number; size?: number;
}) {
  const phase = ((phaseDay % 29.53) + 29.53) % 29.53;
  const r = size / 2 - 0.5;
  const litColor  = '#ccc8bc';
  const darkColor = '#1e1a3a';

  if (phase < 1.5 || phase > 28) {
    return <Circle cx={cx} cy={cy} r={r} fill={darkColor} />;
  }
  if (phase > 13.5 && phase < 16) {
    return <Circle cx={cx} cy={cy} r={r} fill={litColor} />;
  }

  const isWaxing   = phase < 14.765;
  const phaseAngle = (2 * Math.PI * phase) / 29.53;
  const termSemiX  = r * Math.cos(phaseAngle);
  const rx         = Math.max(0.2, Math.abs(termSemiX));
  const topY = cy - r, bottomY = cy + r;
  const outerSweep = isWaxing ? 1 : 0;
  const termSweep  = isWaxing ? (termSemiX > 0 ? 0 : 1) : (termSemiX > 0 ? 1 : 0);
  const d = `M${cx},${topY} A${r},${r} 0 1 ${outerSweep} ${cx},${bottomY} A${rx},${r} 0 0 ${termSweep} ${cx},${topY}Z`;

  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={darkColor} />
      <Path d={d} fill={litColor} />
    </G>
  );
}

// ── Mandala ───────────────────────────────────────────────────────────────────

type Props = {
  days: Record<number, DayData>;
  cycleStartDate: Date | null;
  todayDay: number | null;
  periodDays: number[];
  onDayTap: (day: number) => void;
  size?: number;
};

export const Mandala = memo(function Mandala({
  days, cycleStartDate, todayDay, periodDays, onDayTap, size: sizeProp,
}: Props) {
  const { width } = useWindowDimensions();
  const SIZE = sizeProp ?? Math.min(width - 16, BASE * 1.25);
  const s    = SIZE / BASE; // scale factor
  const CX   = SIZE / 2;
  const CY   = SIZE / 2;
  const R_C    = 44  * s;
  const R_P    = 126 * s;
  const R_NUM  = 138 * s;
  const R_MI   = 149 * s;
  const R_MOON = 157 * s;
  const R_OUT  = 165 * s;

  const now = new Date();

  function handlePress(event: GestureResponderEvent) {
    const { locationX, locationY } = event.nativeEvent;
    const dx   = locationX - CX;
    const dy   = locationY - CY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < R_C || dist > R_OUT) return;
    const angleDeg = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360 + 90) % 360;
    const day = Math.floor(angleDeg / DEG) + 1;
    if (day >= 1 && day <= DAYS) onDayTap(day);
  }

  return (
    <Pressable
      onPress={handlePress}
      style={{ width: SIZE, height: SIZE }}
      accessibilityRole="button"
      accessibilityLabel="Ciclograma lunar — toca un sector para registrar el día"
    >
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>

        {/* Background circles */}
        <Circle cx={CX} cy={CY} r={R_OUT} fill="#faf7f0" stroke={COLOR_DARK_BORDER} strokeWidth={1 * s} />
        <Circle cx={CX} cy={CY} r={R_MI}  fill="#f5f2ec" stroke={COLOR_BORDER}      strokeWidth={0.5 * s} />
        <Circle cx={CX} cy={CY} r={R_P}   fill="white"   stroke="#ece8e0"           strokeWidth={0.5 * s} />
        <Circle cx={CX} cy={CY} r={R_C}   fill="white"   stroke={COLOR_DARK_BORDER} strokeWidth={1.5 * s} />

        {/* 28 Sectors */}
        {Array.from({ length: DAYS }, (_, i) => {
          const day      = i + 1;
          const startDeg = -90 + i * DEG;
          const endDeg   = startDeg + DEG;
          const midRad   = toRad(-90 + (day - 0.5) * DEG);
          const dayData  = days[day] ?? {};
          const hasPeriod = periodDays.includes(day);
          const isToday   = day === todayDay;

          const fill = dayData.color
            ? dayData.color
            : hasPeriod
            ? COLOR_PERIOD
            : COLOR_DEFAULT;

          let mp = 0;
          if (cycleStartDate) {
            mp = getMoonPhaseDay(addDays(cycleStartDate, day - 1));
          } else {
            mp = getMoonPhaseDay(addDays(now, day - 15));
          }

          const nx    = CX + R_NUM  * Math.cos(midRad);
          const ny    = CY + R_NUM  * Math.sin(midRad);
          const moonX = CX + R_MOON * Math.cos(midRad);
          const moonY = CY + R_MOON * Math.sin(midRad);
          const textRot = -90 + (day - 0.5) * DEG + 90;

          return (
            <G key={day}>
              {/* Petal */}
              <Path
                d={sectorPath(CX, CY, R_C, R_P, startDeg + 0.5, endDeg - 0.5)}
                fill={fill}
                stroke="white"
                strokeWidth={1.5 * s}
                opacity={0.95}
              />
              {/* Today highlight */}
              {isToday && (
                <Path
                  d={sectorPath(CX, CY, R_C - 2 * s, R_P + 3 * s, startDeg, endDeg)}
                  fill="none"
                  stroke={COLOR_INDIGO}
                  strokeWidth={2.5 * s}
                  opacity={0.55}
                />
              )}
              {/* Period dot */}
              {hasPeriod && (
                <Circle
                  cx={CX + (R_P + 8 * s) * Math.cos(midRad)}
                  cy={CY + (R_P + 8 * s) * Math.sin(midRad)}
                  r={3.5 * s}
                  fill="#C94040"
                  opacity={0.85}
                />
              )}
              {/* Emoji */}
              {dayData.emoji ? (
                <SvgText
                  x={CX + (R_P - 22) * Math.cos(midRad)}
                  y={CY + (R_P - 22) * Math.sin(midRad)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9 * s}
                >
                  {dayData.emoji}
                </SvgText>
              ) : null}
              {/* Day number */}
              <SvgText
                x={nx}
                y={ny}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isToday ? 8.5 * s : 7.5 * s}
                fontWeight={isToday ? '800' : '500'}
                fill={isToday ? COLOR_INDIGO : '#8a8478'}
                rotation={textRot}
                origin={`${nx}, ${ny}`}
              >
                {day}
              </SvgText>
              {/* Mini moon */}
              <MiniMoon phaseDay={mp} cx={moonX} cy={moonY} size={13 * s} />
            </G>
          );
        })}

        {/* Radial divider lines */}
        {Array.from({ length: DAYS }, (_, i) => {
          const rad = toRad(-90 + i * DEG);
          return (
            <Line
              key={i}
              x1={CX + R_C  * Math.cos(rad)}
              y1={CY + R_C  * Math.sin(rad)}
              x2={CX + R_MI * Math.cos(rad)}
              y2={CY + R_MI * Math.sin(rad)}
              stroke={COLOR_BORDER}
              strokeWidth={0.6 * s}
            />
          );
        })}

        {/* Ring borders (on top) */}
        <Circle cx={CX} cy={CY} r={R_OUT} fill="none" stroke={COLOR_DARK_BORDER} strokeWidth={1 * s} />
        <Circle cx={CX} cy={CY} r={R_MI}  fill="none" stroke={COLOR_BORDER}      strokeWidth={0.5 * s} />
        <Circle cx={CX} cy={CY} r={R_P}   fill="none" stroke={COLOR_BORDER}      strokeWidth={0.5 * s} />
        <Circle cx={CX} cy={CY} r={R_C}   fill="none" stroke={COLOR_DARK_BORDER} strokeWidth={1.5 * s} />

        {/* Center */}
        <Circle cx={CX} cy={CY} r={R_C} fill="white" stroke="#e0dbd0" strokeWidth={1.5 * s} />
        <SvgText x={CX} y={CY - 10 * s} textAnchor="middle" fontSize={7 * s} fontWeight="700"
          fill="#a09898" letterSpacing={1.5}>
          CICLO
        </SvgText>
        <SvgText x={CX} y={CY + 5 * s} textAnchor="middle" fontSize={15 * s}>
          🌙
        </SvgText>
        <SvgText x={CX} y={CY + 18 * s} textAnchor="middle" fontSize={6.5 * s} fontWeight="600" fill="#c0b8c8">
          28 días
        </SvgText>
      </Svg>
    </Pressable>
  );
});
