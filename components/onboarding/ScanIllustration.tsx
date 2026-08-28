import { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Logo } from '../Logo';
import { colors, radius } from '../../constants/theme';

const BAR_WIDTHS = [3, 6, 2, 4, 2, 7, 3, 5, 2, 6, 4, 3, 6, 2, 4, 3];

function Barcode() {
  const total = BAR_WIDTHS.reduce((a, b) => a + b + 3, 0);
  const bars: ReactNode[] = [];
  let x = 0;
  for (const w of BAR_WIDTHS) {
    bars.push(<Rect key={x} x={x} y={4} width={w} height={38} fill="#1B1B1B" />);
    x += w + 3;
  }
  return (
    <Svg width={140} height={46} viewBox={`0 0 ${total} 46`}>
      {bars}
    </Svg>
  );
}

export function ScanIllustration() {
  return (
    <View style={styles.wrap}>
      <View style={styles.phone}>
        <View style={styles.notch} />
        <View style={styles.preview}>
          <View style={styles.corner1} />
          <View style={styles.corner2} />
          <View style={styles.corner3} />
          <View style={styles.corner4} />
          <View style={styles.scanLine} />
          <View style={styles.label}>
            <Barcode />
          </View>
        </View>
      </View>
      <View style={styles.badge}>
        <Logo size={64} />
      </View>
    </View>
  );
}

const CORNER = 22;
const CORNER_T = 3;

const styles = StyleSheet.create({
  wrap: { width: 220, height: 260, alignItems: 'center', justifyContent: 'center' },
  phone: {
    width: 200,
    height: 250,
    borderRadius: 30,
    backgroundColor: '#101010',
    padding: 8,
  },
  notch: {
    position: 'absolute',
    top: 14,
    left: '50%',
    marginLeft: -24,
    width: 48,
    height: 14,
    borderRadius: 8,
    backgroundColor: '#101010',
    zIndex: 5,
  },
  preview: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: colors.primaryDark,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner1: { position: 'absolute', top: 26, left: 18, width: CORNER, height: CORNER, borderTopWidth: CORNER_T, borderLeftWidth: CORNER_T, borderColor: colors.accent, borderTopLeftRadius: 8 },
  corner2: { position: 'absolute', top: 26, right: 18, width: CORNER, height: CORNER, borderTopWidth: CORNER_T, borderRightWidth: CORNER_T, borderColor: colors.accent, borderTopRightRadius: 8 },
  corner3: { position: 'absolute', bottom: 26, left: 18, width: CORNER, height: CORNER, borderBottomWidth: CORNER_T, borderLeftWidth: CORNER_T, borderColor: colors.accent, borderBottomLeftRadius: 8 },
  corner4: { position: 'absolute', bottom: 26, right: 18, width: CORNER, height: CORNER, borderBottomWidth: CORNER_T, borderRightWidth: CORNER_T, borderColor: colors.accent, borderBottomRightRadius: 8 },
  scanLine: {
    position: 'absolute',
    top: '52%',
    left: 30,
    right: 30,
    height: 2,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  label: {
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  badge: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
});
