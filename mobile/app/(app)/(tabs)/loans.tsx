import { Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilePenIcon, PlusCircleIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { HaganaLogo } from '@/components';

cssInterop(FilePenIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(PlusCircleIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

function FieldRow({ label, value, highlighted }: { label: string; value: string; highlighted?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className={`text-sm font-semibold ${highlighted ? 'text-primary text-base' : 'text-foreground'}`}>
        {value}
      </Text>
    </View>
  );
}

const HISTORY = [
  { id: '1', title: 'Monthly repayment', amount: '-45,000 SSP', date: 'Yesterday' },
  { id: '2', title: 'Monthly repayment', amount: '-45,000 SSP', date: '2 Aug' },
  { id: '3', title: 'Monthly repayment', amount: '-42,500 SSP', date: '2 Jul' },
];

export default function LoansScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="pt-2 pb-5">
          <HaganaLogo width={110} height={46} />
          <Text className="text-2xl font-black tracking-tight text-foreground mt-2">Loans</Text>
          <Text className="text-sm text-muted-foreground mt-1">Your loan overview</Text>
        </View>

        {/* Active loan hero */}
        <LinearGradient
          colors={['#0F766E', '#0A4A26']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl p-6"
          style={{ overflow: 'hidden' }}
        >
          <Text className="text-sm font-semibold text-white/80">Active Loan</Text>
          <Text className="mt-1 text-3xl font-black tracking-tight text-white">
            SSP 450,000
          </Text>
          <View className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
            <View className="w-1/2 h-full bg-emerald-300 rounded-full" />
          </View>
          <Text className="mt-2 text-xs text-white/70">52% repaid</Text>
        </LinearGradient>

        {/* Loan summary */}
        <View className="mt-5 bg-card rounded-3xl p-5 border border-border">
          <FieldRow label="Outstanding Balance" value="SSP 450,000" highlighted />
          <FieldRow label="Next Payment" value="SSP 45,000" />
          <FieldRow label="Due Date" value="2 Sep 2026" />
        </View>

        {/* Actions */}
        <View className="mt-5 flex-row gap-3">
          <Pressable className="flex-1 bg-primary rounded-2xl py-4 items-center justify-center flex-row gap-2 active:scale-[0.98]">
            <FilePenIcon size={18} className="text-primary-foreground" />
            <Text className="text-base font-bold text-primary-foreground">Repay Loan</Text>
          </Pressable>
        </View>
        <Pressable className="mt-3 w-full rounded-2xl py-4 items-center justify-center flex-row gap-2 border border-border bg-card active:scale-[0.98]">
          <PlusCircleIcon size={18} className="text-primary" />
          <Text className="text-base font-semibold text-primary">Apply for Loan</Text>
        </Pressable>
        <Text className="mt-1.5 text-center text-[11px] text-muted-foreground">
          🧪 Apply for Loan — coming soon
        </Text>

        {/* Payment history */}
        <Text className="mt-7 mb-3 text-lg font-bold text-foreground">Payment History</Text>
        <View className="bg-card rounded-3xl px-5 divide-y divide-border">
          {HISTORY.map((h) => (
            <View key={h.id} className="flex-row items-center justify-between py-3.5">
              <View className="flex-1 min-w-0">
                <Text className="text-base font-semibold text-foreground">{h.title}</Text>
                <Text className="text-xs text-muted-foreground">{h.date}</Text>
              </View>
              <Text className="text-base font-bold text-red">{h.amount}</Text>
            </View>
          ))}
        </View>

        <Text className="mt-4 text-center text-[11px] text-muted-foreground">
          🧪 Demo data — no real loan exists.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
