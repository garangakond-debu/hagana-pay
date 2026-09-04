import { Text, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeftIcon, StoreIcon, ClockIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { HaganaLogo } from '@/components';

cssInterop(ArrowLeftIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(StoreIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ClockIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

const codeDigits = ['8', '4', '7', '2', '9', '1'];

export default function WithdrawScreen() {
  const handleConfirm = () => {
    // Demo only — no real cashout is triggered.
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 20 }}>
        {/* Header */}
        <View className="flex-row items-center gap-4 pt-2 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center active:scale-[0.95]"
            hitSlop={8}
          >
            <ArrowLeftIcon size={20} className="text-foreground" />
          </Pressable>
          <HaganaLogo width={110} height={46} />
        </View>

        {/* Amount card */}
        <View className="mt-2 bg-muted rounded-3xl py-7 px-6 items-center">
          <Text className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Enter Withdrawal Amount
          </Text>
          <Text className="mt-2 text-4xl font-black tracking-tight text-foreground">
            <Text className="text-2xl font-bold text-muted-foreground">SSP </Text>
            120,000
          </Text>
        </View>

        {/* Withdrawal method */}
        <Text className="mt-6 text-base font-bold text-foreground">Withdrawal Method</Text>

        <View className="mt-3 bg-[#FFF8E1] border border-[#F5D66B] rounded-2xl p-4 flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-xl bg-white items-center justify-center">
            <StoreIcon size={22} className="text-[#B8860B]" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">
              MTN / Zain Mobile Agent
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              Generate instant withdrawal code
            </Text>
          </View>
          <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
            <View className="w-2.5 h-2.5 rounded-full bg-white" />
          </View>
        </View>

        {/* Cashout code card */}
        <View className="mt-5 bg-emerald/10 border border-primary/20 rounded-3xl py-7 px-4 items-center">
          <Text className="text-sm font-bold uppercase tracking-wide text-primary">
            Your Cashout Code
          </Text>

          <View className="mt-4 flex-row gap-1.5">
            {codeDigits.map((d, i) => (
              <View
                key={i}
                className="w-9 h-11 rounded-lg bg-muted items-center justify-center"
                style={{
                  backgroundColor: '#E8EDE9',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Text className="text-lg font-black text-foreground">{d}</Text>
              </View>
            ))}
          </View>

          <View className="mt-4 flex-row items-center gap-1.5">
            <ClockIcon size={14} className="text-muted-foreground" />
            <Text className="text-xs text-muted-foreground">15:00 remaining</Text>
          </View>
        </View>

        {/* Confirm button */}
        <Pressable
          onPress={handleConfirm}
          className="mt-7 w-full rounded-2xl py-4 items-center justify-center bg-primary active:scale-[0.98]"
        >
          <Text className="text-base font-bold text-primary-foreground">Confirm Withdrawal</Text>
        </Pressable>

        <Text className="mt-3 text-center text-[11px] text-muted-foreground">
          🧪 Demo only — no real money is withdrawn.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
