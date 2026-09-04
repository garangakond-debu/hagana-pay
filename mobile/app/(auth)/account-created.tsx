import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CrownIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { PrimaryButton } from '@/components/ui';
import { HaganaLogo } from '@/components';

cssInterop(CrownIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

export default function AccountCreatedScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const haganaId = id && /^HGN-\d{6}$/.test(id) ? id : 'HGN-482713';

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <View className="flex-1 px-5 justify-center">
        {/* Logo */}
        <View className="items-center mb-8">
          <HaganaLogo width={190} height={90} />
        </View>

        {/* Celebration badge */}
        <View className="items-center mb-6">
          <View className="w-28 h-28 rounded-full bg-primary/10 items-center justify-center">
            <View className="w-20 h-20 rounded-full bg-primary items-center justify-center">
              <CrownIcon size={36} className="text-primary-foreground" />
            </View>
          </View>
        </View>

        <Text className="text-3xl font-black tracking-tight text-foreground text-center">
          Welcome to Hagana Pay! 🎉
        </Text>
        <Text className="mt-2 text-base text-muted-foreground text-center leading-5">
          Your account has been created successfully.
        </Text>

        {/* Demo Hagana ID */}
        <View className="mt-8 bg-card rounded-3xl p-5 border border-border">
          <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center">
            Your Hagana ID
          </Text>
          <Text className="mt-2 text-3xl font-black tracking-tight text-primary text-center">
            {haganaId}
          </Text>
          <Text className="mt-3 text-xs text-muted-foreground text-center leading-4">
            Keep your Hagana ID safe. You can use it to receive money, make payments and access Hagana services.
          </Text>
        </View>

        <Text className="mt-5 text-center text-[11px] text-muted-foreground">
          🧪 Demo account — no real account was created.
        </Text>
      </View>

      {/* CTA */}
      <View className="px-5 pb-6">
        <PrimaryButton title="Go to Hagana Pay" onPress={() => router.replace(`/(tabs)/index?id=${haganaId}`)} />
      </View>
    </SafeAreaView>
  );
}
