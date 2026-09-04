import { Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ShoppingBagIcon, SendHorizontalIcon, QrCodeIcon, HandCoinsIcon, ChevronRightIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';

cssInterop(ShoppingBagIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(SendHorizontalIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(QrCodeIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(HandCoinsIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ChevronRightIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

function ActionRow({
  icon: Icon,
  title,
  subtitle,
  tint,
  onPress,
  comingSoon,
}: {
  icon: typeof SendHorizontalIcon;
  title: string;
  subtitle: string;
  tint: string;
  onPress?: () => void;
  comingSoon?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={comingSoon}
      className="flex-row items-center gap-3 bg-card rounded-2xl border border-border px-4 py-4 active:scale-[0.98]"
    >
      <View style={{ backgroundColor: tint }} className="w-12 h-12 rounded-xl items-center justify-center">
        <Icon size={22} className="text-white" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-foreground">{title}</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">{subtitle}</Text>
        {comingSoon ? (
          <Text className="text-[11px] font-bold text-accent mt-1">Coming soon</Text>
        ) : null}
      </View>
      <ChevronRightIcon size={18} className="text-muted-foreground" />
    </Pressable>
  );
}

export default function PaymentsScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View className="pt-2 pb-5">
          <Text className="text-xs font-semibold text-primary">Hagana Pay</Text>
          <Text className="text-2xl font-black tracking-tight text-foreground">Payments</Text>
          <Text className="text-sm text-muted-foreground mt-1">Pay shops, send money &amp; more</Text>
        </View>

        <View className="gap-3">
          <ActionRow
            icon={ShoppingBagIcon}
            title="Pay Merchant"
            subtitle="Pay shops and businesses"
            tint="#0d5c2e"
            onPress={() => router.push('/pay-merchant')}
          />
          <ActionRow
            icon={SendHorizontalIcon}
            title="Send Money"
            subtitle="Transfer to a Hagana ID"
            tint="#2a4f74"
            onPress={() => router.push('/send-money')}
          />
          <ActionRow
            icon={HandCoinsIcon}
            title="Request Money"
            subtitle="Request a payment from someone"
            tint="#b8860b"
            comingSoon
          />
          <ActionRow
            icon={QrCodeIcon}
            title="Scan QR"
            subtitle="Pay a merchant with a code"
            tint="#7c3aed"
            onPress={() => router.push('/pay-merchant')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
