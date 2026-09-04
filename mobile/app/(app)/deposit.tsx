import { useState } from 'react';
import { Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeftIcon, StoreIcon, SmartphoneIcon, LandmarkIcon, CheckIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { HaganaLogo } from '@/components';
import { PrimaryButton, InputField, DemoNotice, SecurityStrip } from '@/components/ui';

cssInterop(ArrowLeftIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(StoreIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(SmartphoneIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(LandmarkIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(CheckIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

const CHANNELS = [
  { key: 'agent', label: 'Hagana Agent', desc: 'Pay cash to a trusted agent near you', icon: StoreIcon },
  { key: 'mobile', label: 'Mobile Money', desc: 'From MTN MoMo, Zain or other mobile money', icon: SmartphoneIcon },
  { key: 'bank', label: 'Bank', desc: 'Transfer from your bank account', icon: LandmarkIcon },
];

function ChannelCard({
  selected,
  onPress,
  icon: Icon,
  label,
  desc,
}: {
  selected: boolean;
  onPress: () => void;
  icon: typeof StoreIcon;
  label: string;
  desc: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-4 bg-card rounded-2xl border p-4 active:scale-[0.98] ${
        selected ? 'border-primary' : 'border-border'
      }`}
    >
      <View className={`w-12 h-12 rounded-xl items-center justify-center ${selected ? 'bg-primary' : 'bg-secondary'}`}>
        <Icon size={22} className={selected ? 'text-primary-foreground' : 'text-primary'} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-foreground">{label}</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">{desc}</Text>
      </View>
      <View
        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
          selected ? 'border-primary bg-primary' : 'border-border'
        }`}
      >
        {selected ? <CheckIcon size={14} className="text-primary-foreground" /> : null}
      </View>
    </Pressable>
  );
}

export default function DepositScreen() {
  const [channel, setChannel] = useState('agent');
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState(false);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-6">
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center">
            <ArrowLeftIcon size={20} className="text-foreground" />
          </Pressable>
          <HaganaLogo width={110} height={46} />
        </View>

        <Text className="text-base text-muted-foreground leading-6">
          Choose how you want to add money to your Hagana wallet.
        </Text>

        {/* Channel selection */}
        <View className="gap-3 mt-6">
          {CHANNELS.map((c) => (
            <ChannelCard
              key={c.key}
              selected={channel === c.key}
              onPress={() => setChannel(c.key)}
              icon={c.icon}
              label={c.label}
              desc={c.desc}
            />
          ))}
        </View>

        {/* Amount */}
        <View className="mt-7">
          <InputField
            label="Amount to deposit"
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            suffix="SSP"
            keyboardType="numeric"
          />
        </View>

        {done ? (
          <View className="mt-6">
            <View className="bg-card rounded-3xl p-6 border border-border items-center">
              <View className="w-16 h-16 rounded-full bg-emerald/15 items-center justify-center mb-3">
                <Text className="text-3xl">✅</Text>
              </View>
              <Text className="text-lg font-bold text-foreground">Deposit Requested</Text>
              <Text className="text-sm text-muted-foreground text-center mt-1">
                {Number(amount || 0).toLocaleString()} SSP via{' '}
                {CHANNELS.find((c) => c.key === channel)?.label ?? 'Hagana Agent'}
              </Text>
              <Text className="text-xs text-muted-foreground text-center mt-2">
                This is a demo — no real money was added.
              </Text>
              <View className="mt-4 w-full">
                <PrimaryButton
                  title="Done"
                  onPress={() => {
                    setDone(false);
                    setAmount('');
                    router.replace('/(tabs)');
                  }}
                />
              </View>
            </View>
          </View>
        ) : (
          <View className="mt-6 gap-4">
            <PrimaryButton title="Continue" onPress={() => amount && setDone(true)} />
            <DemoNotice />
            <SecurityStrip />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
