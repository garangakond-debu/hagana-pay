import { Text, View, ScrollView, RefreshControl, Pressable, Image, ActivityIndicator } from 'react-native';
import { HaganaLogo } from '@/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  QrCodeIcon,
  BellIcon,
  PlusIcon,
  ShoppingBagIcon,
  ArrowLeftRightIcon,
  ArrowUpFromLineIcon,
  FilePenIcon,
} from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp, useAuth, useTheme } from '@/src/hooks';
import { TransactionList } from '@/components/transactions';
import type { Transaction } from '@/src/db/types';
import { CameraIcon } from 'lucide-react-native';

cssInterop(CameraIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

const AVATAR_KEY = 'hagana_profile_picture';
const PROFILE_PIC_PERMISSION_KEY = 'hagana_pp_permission';

cssInterop(QrCodeIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(BellIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(PlusIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ShoppingBagIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ArrowLeftRightIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ArrowUpFromLineIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(FilePenIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

function formatSsp(value: number): string {
  return 'SSP ' + Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Quick action used in the reference (Send / Receive / Save / Withdraw)
function QuickAction({
  icon: Icon,
  title,
  tint,
  onPress,
}: {
  icon: typeof PlusIcon;
  title: string;
  tint: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center gap-1.5 active:scale-[0.96]"
    >
      <View
        style={{ backgroundColor: tint }}
        className="w-14 h-14 rounded-2xl items-center justify-center"
      >
        <Icon size={22} className="text-white" />
      </View>
      <Text className="text-xs font-semibold text-foreground">{title}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { client } = useApp();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const haganaId = id && /^HGN-\d{6}$/.test(id) ? id : 'HGN-482713';

  const [profilePic, setProfilePic] = useState<string | null>(null);

  // Load a previously chosen profile picture on mount.
  useEffect(() => {
    AsyncStorage.getItem(AVATAR_KEY)
      .then((uri) => {
        if (uri) setProfilePic(uri);
      })
      .catch(() => {});
  }, []);

  const pickProfilePicture = async () => {
    // Avoid re-requesting the permission prompt after the user has answered it.
    const alreadyAsked = await AsyncStorage.getItem(PROFILE_PIC_PERMISSION_KEY).catch(() => null);
    if (!alreadyAsked) {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      await AsyncStorage.setItem(PROFILE_PIC_PERMISSION_KEY, perm.granted ? 'granted' : 'denied').catch(
        () => {}
      );
      if (!perm.granted) return setProfilePic(null);
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const uri = result.assets[0].uri;
    setProfilePic(uri);
    await AsyncStorage.setItem(AVATAR_KEY, uri).catch(() => {});
  };


  const txnsQuery = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await client
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
    enabled: !!user?.id,
  });

  // Real SSP wallet balance from Supabase — never a hardcoded number. The authenticated
  // Supabase user id is used so RLS (auth.uid() = user_id) returns only this user's wallet.
  // The frontend never modifies the balance; it is read-only for the client.
  const walletQuery = useQuery({
    queryKey: ['wallet', user?.id, 'SSP'],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await client
        .from('wallets')
        .select('id, user_id, currency, balance, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('currency', 'SSP')
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const walletBalance = walletQuery.data?.balance ?? 0;

  // Refresh the wallet balance whenever the Home screen becomes active again (return from a
  // flow, tab switch, etc.) — without continuously polling in the background.
  useFocusEffect(
    useCallback(() => {
      if (user?.id) queryClient.invalidateQueries({ queryKey: ['wallet', user?.id, 'SSP'] });
    }, [queryClient, user?.id])
  );

  const items = txnsQuery.data ?? [];

  const actions = [
    { icon: PlusIcon, title: 'Deposit', tint: '#0D5C2E', onPress: () => router.push('/deposit') },
    { icon: ShoppingBagIcon, title: 'Pay Merchant', tint: '#2A4F74', onPress: () => router.push('/pay-merchant') },
    { icon: ArrowLeftRightIcon, title: 'Transfer', tint: '#B8860B', onPress: () => router.push('/send-money') },
    { icon: ArrowUpFromLineIcon, title: 'Withdraw', tint: '#7C3AED', onPress: () => router.push('/withdraw') },
    { icon: FilePenIcon, title: 'Repay Loan', tint: '#0F766E', onPress: () => router.push('/(tabs)/loans') },
  ];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={txnsQuery.isFetching}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['transactions'] })}
            tintColor={isDark ? '#9aa69e' : '#0d5c2e'}
          />
        }
      >
        {/* Header with logo + scan + bell */}
        <View className="flex-row items-center justify-between pt-2 pb-5">
          <HaganaLogo width={120} height={54} />
          <View className="flex-row items-center gap-2.5">
            <View className="w-11 h-11 rounded-full bg-card border border-border items-center justify-center">
              <QrCodeIcon size={20} className="text-primary" />
            </View>
            <View className="relative w-11 h-11 rounded-full bg-card border border-border items-center justify-center">
              <BellIcon size={20} className="text-primary" />
              <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red" />
            </View>
          </View>
        </View>

        {/* Wallet card */}
        <LinearGradient
          colors={['#0D5C2E', '#0A4A26', '#093D1F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl p-6"
          style={{ overflow: 'hidden' }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-white/80">
              HAGANA PAY WALLET BALANCE
            </Text>
            <View className="bg-white/15 rounded-full px-2 py-0.5">
              <Text className="text-[10px] font-bold text-white">{haganaId}</Text>
            </View>
          </View>

          {walletQuery.isLoading ? (
            <View className="mt-3 flex-row items-center gap-3">
              <ActivityIndicator size="small" color="#ffffff" />
              <Text className="text-base font-semibold text-white/80">Loading balance…</Text>
            </View>
          ) : walletQuery.isError ? (
            <View className="mt-3">
              <Text className="text-lg font-bold tracking-tight text-white">—</Text>
              <Pressable
                onPress={() => queryClient.invalidateQueries({ queryKey: ['wallet', user?.id, 'SSP'] })}
                className="mt-2 bg-white/15 rounded-full px-3 py-1.5 self-start"
              >
                <Text className="text-xs font-bold text-white">Retry</Text>
              </Pressable>
            </View>
          ) : (
            <Text className="mt-3 text-4xl font-black tracking-tight text-white">
              {formatSsp(walletBalance)}
            </Text>
          )}

          <View className="mt-5 flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-white/60">Daily Limit:</Text>
              <Text className="text-sm font-semibold text-white">{formatSsp(5000000)}</Text>
            </View>
            <View className="flex-row items-center gap-1.5 bg-emerald-300/20 rounded-full px-3 py-1.5">
              <View className="w-2 h-2 rounded-full bg-emerald-300" />
              <Text className="text-xs font-bold text-white">Verified</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick actions row */}
        <View className="mt-6 flex-row flex-wrap gap-y-5 px-1">
          {actions.map((a) => (
            <QuickAction key={a.title} icon={a.icon} title={a.title} tint={a.tint} onPress={a.onPress} />
          ))}
        </View>

        {/* Recent Activity */}
        <View className="flex-row items-center justify-between mt-7 mb-3">
          <Text className="text-lg font-bold text-foreground">Recent Activity</Text>
          <Pressable onPress={() => router.push('/(tabs)/transactions')} className="flex-row items-center gap-0.5">
            <Text className="text-sm font-semibold text-primary">See All</Text>
          </Pressable>
        </View>

        {items.length > 0 ? (
          <TransactionList items={items} />
        ) : (
          <View className="bg-card rounded-3xl px-5 py-10 items-center">
            <Text className="text-2xl">📭</Text>
            <Text className="mt-2 text-base font-semibold text-foreground">No transactions yet</Text>
            <Text className="text-sm text-muted-foreground text-center mt-1">
              Your activity will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
