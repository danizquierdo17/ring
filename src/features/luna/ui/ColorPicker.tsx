import React, { useRef, useState } from 'react';
import { View, Text, PanResponder, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

// ── Dimensions ────────────────────────────────────────────────────────────────
const CANVAS_W = 280;
const CANVAS_H = 180;
const SLIDER_H = 26;
const CURSOR_R = 10;

// ── Color math ────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if      (h < 60)  { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
}

function hueHex(h: number): string {
  const [r, g, b] = hsvToRgb(h, 1, 1);
  return rgbToHex(r, g, b);
}

function hexToHsv(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [0, 0.8, 0.9];
  const n = parseInt(m[1]!, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
  let h = 0;
  if (d !== 0) {
    if      (max === rn) h = ((gn - bn) / d + 6) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else                 h = (rn - gn) / d + 4;
    h *= 60;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

// ── Hue rainbow stops ─────────────────────────────────────────────────────────
const HUE_STOPS = [0, 60, 120, 180, 240, 300, 360].map(deg => ({
  offset: `${((deg / 360) * 100).toFixed(1)}%`,
  color: hueHex(deg),
}));

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  color: string;
  onChange: (hex: string) => void;
};

export function ColorPicker({ color, onChange }: Props) {
  // ── State stored in both ref (for PanResponder closures) and state (for render)
  const initHsv = hexToHsv(color);
  const hRef = useRef(initHsv[0]);
  const sRef = useRef(initHsv[1]);
  const vRef = useRef(initHsv[2]);
  const [hsv, setHsv] = useState<[number, number, number]>(initHsv);

  // Page offsets — measured on layout, used in PanResponder
  const canvasPageX = useRef(0);
  const canvasPageY = useRef(0);
  const sliderPageX = useRef(0);
  const sliderPageY = useRef(0);

  // Keep onChange ref fresh to avoid stale closure in PanResponder
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function emitFromHsv(h: number, s: number, v: number) {
    const [r, g, b] = hsvToRgb(h, s, v);
    onChangeRef.current(rgbToHex(r, g, b));
  }

  // ── SV canvas PanResponder ────────────────────────────────────────────────
  const canvasRef = useRef<View>(null);
  const svPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (evt) => {
        const px = evt.nativeEvent.pageX - canvasPageX.current;
        const py = evt.nativeEvent.pageY - canvasPageY.current;
        const newS = clamp(px / CANVAS_W, 0, 1);
        const newV = clamp(1 - py / CANVAS_H, 0, 1);
        sRef.current = newS; vRef.current = newV;
        setHsv([hRef.current, newS, newV]);
        emitFromHsv(hRef.current, newS, newV);
      },
      onPanResponderMove: (evt) => {
        const px = evt.nativeEvent.pageX - canvasPageX.current;
        const py = evt.nativeEvent.pageY - canvasPageY.current;
        const newS = clamp(px / CANVAS_W, 0, 1);
        const newV = clamp(1 - py / CANVAS_H, 0, 1);
        sRef.current = newS; vRef.current = newV;
        setHsv([hRef.current, newS, newV]);
        emitFromHsv(hRef.current, newS, newV);
      },
    })
  ).current;

  // ── Hue slider PanResponder ───────────────────────────────────────────────
  const sliderRef = useRef<View>(null);
  const huePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (evt) => {
        const px = evt.nativeEvent.pageX - sliderPageX.current;
        const newH = clamp((px / CANVAS_W) * 360, 0, 359.99);
        hRef.current = newH;
        setHsv([newH, sRef.current, vRef.current]);
        emitFromHsv(newH, sRef.current, vRef.current);
      },
      onPanResponderMove: (evt) => {
        const px = evt.nativeEvent.pageX - sliderPageX.current;
        const newH = clamp((px / CANVAS_W) * 360, 0, 359.99);
        hRef.current = newH;
        setHsv([newH, sRef.current, vRef.current]);
        emitFromHsv(newH, sRef.current, vRef.current);
      },
    })
  ).current;

  // ── Derived render values ─────────────────────────────────────────────────
  const [h, s, v] = hsv;
  const cursorX = s * CANVAS_W;
  const cursorY = (1 - v) * CANVAS_H;
  const thumbX  = (h / 360) * CANVAS_W;
  const [r, g, b] = hsvToRgb(h, s, v);
  const currentHex = rgbToHex(r, g, b);
  const cursorBorder = v > 0.5 && s < 0.6 ? '#555' : '#fff';

  return (
    <View style={styles.root}>

      {/* SV canvas */}
      <View
        ref={canvasRef}
        style={styles.canvas}
        {...svPan.panHandlers}
        onLayout={() => {
          canvasRef.current?.measure((_x, _y, _w, _h, px, py) => {
            canvasPageX.current = px;
            canvasPageY.current = py;
          });
        }}
      >
        <Svg width={CANVAS_W} height={CANVAS_H} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="satG" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%"   stopColor="#ffffff" />
              <Stop offset="100%" stopColor={hueHex(h)} />
            </LinearGradient>
            <LinearGradient id="valG" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%"   stopColor="rgba(0,0,0,0)" />
              <Stop offset="100%" stopColor="#000000" />
            </LinearGradient>
          </Defs>
          <Rect width={CANVAS_W} height={CANVAS_H} fill="url(#satG)" />
          <Rect width={CANVAS_W} height={CANVAS_H} fill="url(#valG)" />
        </Svg>
        {/* Cursor circle */}
        <View style={[
          styles.cursor,
          { left: cursorX - CURSOR_R, top: cursorY - CURSOR_R, borderColor: cursorBorder },
        ]} />
      </View>

      {/* Hue slider */}
      <View
        ref={sliderRef}
        style={styles.slider}
        {...huePan.panHandlers}
        onLayout={() => {
          sliderRef.current?.measure((_x, _y, _w, _h, px, py) => {
            sliderPageX.current = px;
            sliderPageY.current = py;
          });
        }}
      >
        <Svg width={CANVAS_W} height={SLIDER_H} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="hueG" x1="0" y1="0" x2="1" y2="0">
              {HUE_STOPS.map(({ offset, color: c }) => (
                <Stop key={offset} offset={offset} stopColor={c} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect width={CANVAS_W} height={SLIDER_H} rx={13} ry={13} fill="url(#hueG)" />
        </Svg>
        {/* Thumb */}
        <View style={[styles.sliderThumb, { left: thumbX - SLIDER_H / 2 }]} />
      </View>

      {/* Preview row */}
      <View style={styles.previewRow}>
        <View style={[styles.previewDot, { backgroundColor: currentHex }]} />
        <Text style={styles.hexText}>{currentHex.toUpperCase()}</Text>
        <Text style={styles.rgbText}>R {r}  G {g}  B {b}</Text>
      </View>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    gap: 14,
  },
  canvas: {
    width: CANVAS_W,
    height: CANVAS_H,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cursor: {
    position: 'absolute',
    width: CURSOR_R * 2,
    height: CURSOR_R * 2,
    borderRadius: CURSOR_R,
    borderWidth: 2.5,
    backgroundColor: 'transparent',
  },
  slider: {
    width: CANVAS_W,
    height: SLIDER_H,
    borderRadius: 13,
    overflow: 'visible',
  },
  sliderThumb: {
    position: 'absolute',
    top: -2,
    width: SLIDER_H + 4,
    height: SLIDER_H + 4,
    borderRadius: (SLIDER_H + 4) / 2,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  hexText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    letterSpacing: 1,
  },
  rgbText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
