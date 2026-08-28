import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type LeafProps = {
  size?: number;
  color?: string;
  rotate?: number;
  style?: object;
};

export function Leaf({ size = 60, color = '#119E4B', rotate = 0, style }: LeafProps) {
  return (
    <View style={[{ transform: [{ rotate: `${rotate}deg` }] }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path
          d="M50 4 C82 18 94 56 50 96 C6 56 18 18 50 4 Z"
          fill={color}
        />
        <Path d="M50 14 L50 86" stroke="rgba(255,255,255,0.35)" strokeWidth={2.5} strokeLinecap="round" />
      </Svg>
    </View>
  );
}
