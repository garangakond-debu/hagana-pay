import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { EyeIcon, EyeOffIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';

cssInterop(EyeIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(EyeOffIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

function formatSsp(value: string): string {
  return 'SSP ' + Number(value || 0).toLocaleString();
}

export function WalletBalanceCard({ balance = '500000' }: { balance?: string }) {
  const [hidden, setHidden] = useState(false);

  return (
    <LinearGradient
      colors={['#0D5C2E', '#0A4A26', '#093D1F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-3xl p-6"
      style={{ overflow: 'hidden' }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-white/70">Available Balance</Text>
        <Pressable
          onPress={() => setHidden((h) => !h)}
          hitSlop={10}
          className="w-9 h-9 rounded-full bg-white/15 items-center justify-center"
        >
          {hidden ? <EyeOffIcon size={18} className="text-white" /> : <EyeIcon size={18} className="text-white" />}
        </Pressable>
      </View>

      <Text className="mt-2 text-3xl font-bold tracking-tight text-white">
        {hidden ? '••••••••' : formatSsp(balance)}
      </Text>

      <View className="mt-5 flex-row items-center gap-2 bg-white/15 rounded-2xl px-4 py-3">
        <View className="w-8 h-8 rounded-full bg-white items-center justify-center">
          <Text className="text-[10px] font-black text-[#0D5C2E]">H</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-white">Hagana Wallet</Text>
          <Text className="text-xs text-white/70">Account Active</Text>
        </View>
        <View className="w-2 h-2 rounded-full bg-emerald-300" />
      </View>
    </LinearGradient>
  );
}
