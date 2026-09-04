import { useState } from 'react';
import { Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeftIcon, ScanLineIcon, StoreIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { HaganaLogo } from '@/components';
import { PrimaryButton, InputField, DemoNotice, SecurityStrip } from '@/components/ui';

cssInterop(ArrowLeftIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ScanLineIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(StoreIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

export default function PayMerchantScreen() {
  const [merchantId, setMerchantId] = useState('HGM-00125');
  const [amount, setAmount] = useState('25000');
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
          Pay shops and businesses using their merchant ID.
        </Text>

        {/* Example merchant */}
        <View className="mt-6 flex-row items-center gap-4 bg-card rounded-2xl border border-border p-4">
          <View className="w-14 h-14 rounded-2xl bg-primary items-center justify-center">
            <StoreIcon size={26} className="text-primary-foreground" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-bold text-foreground">Hagana Supermarket</Text>
              <View className="bg-secondary rounded-full px-2 py-0.5">
                <Text className="text-[10px] font-bold text-primary">EXAMPLE</Text>
              </View>
            </View>
            <Text className="text-sm text-muted-foreground">Merchant ID: HGM-00125</Text>
            <Text className="text-base font-bold text-foreground mt-1">25,000 SSP</Text>
          </View>
        </View>

        {/* Scan QR */}
        <Pressable className="mt-4 flex-row items-center justify-center gap-2 bg-primary rounded-2xl py-4 active:scale-[0.98]">
          <ScanLineIcon size={20} className="text-primary-foreground" />
          <Text className="text-base font-bold text-primary-foreground">Scan QR Code</Text>
        </Pressable>

        {/* Fields */}
        <View className="mt-7 gap-5">
          <InputField label="Merchant ID" placeholder="e.g. HGM-00125" value={merchantId} onChangeText={setMerchantId} />
          <InputField label="Amount" placeholder="Enter amount" value={amount} onChangeText={setAmount} suffix="SSP" keyboardType="numeric" />
        </View>

        <View className="mt-6">
          <PrimaryButton title="Continue" onPress={() => {}} />
        </View>

        <View className="mt-6 gap-4">
          <DemoNotice />
          <SecurityStrip />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
