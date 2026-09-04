import { useRef, useState } from 'react';
import {
  Text,
  View,
  FlatList,
  Pressable,
  useWindowDimensions,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRightIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { HaganaLogo } from '@/components';

cssInterop(ArrowRightIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

const PAGES = [
  {
    image: 'https://pics.rapidnative.app/tech/m9_bQlrRMxm3mwmDnYR2w.jpg',
    eyebrow: 'Your Hagana Wallet',
    title: 'Money, the modern way',
    body: 'Hagana Pay puts a secure digital wallet in your pocket — send, save and pay from your phone.',
  },
  {
    image: 'https://pics.rapidnative.app/finance/HLjBVX03gENsCXKOhCcr2.jpg',
    eyebrow: 'Send money easily',
    title: 'Transfer to anyone',
    body: 'Send money to family and friends using a Hagana ID or phone number. Fast, simple and reliable.',
  },
  {
    image: 'https://pics.rapidnative.app/finance/d4g6qtMNMvEgvM1Akk962.jpg',
    eyebrow: 'Pay without cash',
    title: 'Pay at any shop',
    body: 'Pay at markets, shops and businesses with a quick QR scan or by entering the merchant ID.',
  },
  {
    image: 'https://pics.rapidnative.app/finance/PLmm5tQarE5IabsEoFX6v.jpg',
    eyebrow: 'Secure by design',
    title: 'Your money, protected',
    body: 'Keep your Hagana ID safe and your account active. Your transactions stay private and protected.',
  },
];

const ONBOARDING_KEY = 'hagana_has_seen_onboarding';

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === PAGES.length - 1;

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  const next = () => {
    if (isLast) {
      AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => {});
      router.replace('/(auth)/verification');
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const skip = () => {
    AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => {});
    router.replace('/(auth)/verification');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        data={PAGES}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 justify-center px-7">
            <LinearGradient
              colors={['#0D5C2E', '#0A4A26']}
              className="rounded-[32px] overflow-hidden"
              style={{ overflow: 'hidden' }}
            >
              <Image
                source={{ uri: item.image }}
                resizeMode="cover"
                style={{ width: '100%', aspectRatio: 1 }}
              />
            </LinearGradient>
            <Text className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              {item.eyebrow}
            </Text>
            <Text className="mt-1.5 text-3xl font-black tracking-tight text-foreground">
              {item.title}
            </Text>
            <Text className="mt-2 text-base text-muted-foreground leading-6">{item.body}</Text>
          </View>
        )}
      />

      {/* Logo */}
      <View className="items-center mt-2 mb-3">
        <HaganaLogo width={160} height={72} />
      </View>

      {/* Skip (only on first page) */}
      {index === 0 && (
        <View className="px-5 pb-2 items-end">
          <Pressable onPress={skip} hitSlop={10}>
            <Text className="text-sm font-semibold text-muted-foreground">Skip</Text>
          </Pressable>
        </View>
      )}

      {/* Footer: dots + next */}
      <View className="px-6 pt-4 pb-6">
        {/* dots */}
        <View className="flex-row justify-center gap-2 mb-5">
          {PAGES.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${i === index ? 'w-6 bg-primary' : 'w-2 bg-border'}`}
            />
          ))}
        </View>

        <Pressable
          onPress={next}
          className="w-full rounded-2xl py-4 items-center justify-center flex-row gap-2 bg-primary active:scale-[0.98]"
        >
          <Text className="text-base font-bold text-primary-foreground">
            {isLast ? 'Get Started' : 'Next'}
          </Text>
          <ArrowRightIcon size={20} className="text-primary-foreground" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
