import { Image, View } from 'react-native';

const LOGO = require('../assets/Screenshot_2026-08-28_025224.png');

export default function HaganaLogo({
  width = 160,
  height = 72,
  rounded = true,
  radius = 18,
}: {
  width?: number;
  height?: number;
  rounded?: boolean;
  radius?: number;
}) {
  const img = (
    <Image source={LOGO} resizeMode="contain" style={{ width, height }} />
  );
  if (!rounded) return img;
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
      }}
    >
      {img}
    </View>
  );
}
