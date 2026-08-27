import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import { colors } from '../constants/theme';

type LogoProps = {
  size?: number;
  variant?: 'icon' | 'mark';
};

/**
 * Halalzur brand mark: scan-corner brackets around an "H", with a
 * checkmark standing in for the second upright — "scan it, it's verified".
 */
export function Logo({ size = 96, variant = 'icon' }: LogoProps) {
  const r = size * 0.22;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.primaryDark} />
          <Stop offset="55%" stopColor={colors.primary} />
          <Stop offset="100%" stopColor={colors.accent} />
        </LinearGradient>
        <LinearGradient id="check" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.primary} />
          <Stop offset="100%" stopColor={colors.accent} />
        </LinearGradient>
      </Defs>

      {variant === 'icon' && (
        <Rect x={0} y={0} width={100} height={100} rx={r} fill="url(#bg)" />
      )}

      {/* scan corner brackets */}
      <Path
        d="M22 30 v-6 a4 4 0 0 1 4 -4 h6"
        stroke={colors.white}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M68 20 h6 a4 4 0 0 1 4 4 v6"
        stroke={colors.white}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M78 70 v6 a4 4 0 0 1 -4 4 h-6"
        stroke={colors.white}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M32 80 h-6 a4 4 0 0 1 -4 -4 v-6"
        stroke={colors.white}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />

      {/* "H" left upright + crossbar */}
      <Path
        d="M35 26 h11 v18 h8 v-18 h4 v22 h-23 z"
        fill={colors.white}
      />
      <Rect x={35} y={26} width={11} height={48} fill={colors.white} />

      {/* checkmark as the right upright of the H */}
      <Path
        d="M50 52 l11 13 l20 -26"
        stroke="url(#check)"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
