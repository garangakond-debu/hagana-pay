import { Text, View, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  WalletIcon,
  CameraIcon,
  ChevronRightIcon,
  UserRoundIcon,
  ShieldCheckIcon,
  KeyRoundIcon,
  BellIcon,
  HeadsetIcon,
  FileTextIcon,
  LockIcon,
} from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/hooks';
import { HaganaLogo } from '@/components';

cssInterop(ArrowLeftIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(BadgeCheckIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(WalletIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(CameraIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ChevronRightIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(UserRoundIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ShieldCheckIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(KeyRoundIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(BellIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(HeadsetIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(FileTextIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(LockIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

const AVATAR_KEY = 'hagana_profile_picture';
const PROFILE_PIC_PERMISSION_KEY = 'hagana_pp_permission';
const ONBOARDING_KEY = 'hagana_has_seen_onboarding';

function SettingsRow({
  icon: Icon,
  label,
  comingSoon,
}: {
  icon: typeof UserRoundIcon;
  label: string;
  comingSoon?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-4 border-b border-border last:border-b-0">
      <View className="w-9 h-9 rounded-lg bg-muted items-center justify-center">
        <Icon size={18} className="text-primary" />
      </View>
      <Text className="flex-1 text-[15px] font-semibold text-foreground">{label}</Text>
      {comingSoon ? (
        <Text className="text-[11px] font-bold text-accent">Coming soon</Text>
      ) : (
        <ChevronRightIcon size={18} className="text-muted-foreground" />
      )}
    </View>
  );
}

const SETTINGS = [
  { icon: UserRoundIcon, label: 'Personal Information', comingSoon: true },
  { icon: ShieldCheckIcon, label: 'Security', comingSoon: true },
  { icon: KeyRoundIcon, label: 'PIN', comingSoon: true },
  { icon: BellIcon, label: 'Notifications', comingSoon: true },
  { icon: HeadsetIcon, label: 'Help & Support', comingSoon: true },
  { icon: FileTextIcon, label: 'Terms & Conditions', comingSoon: true },
  { icon: LockIcon, label: 'Privacy Policy', comingSoon: true },
];

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [profilePic, setProfilePic] = useState<string | null>(null);

  // Load a previously uploaded profile picture on mount.
  useEffect(() => {
    AsyncStorage.getItem(AVATAR_KEY)
      .then((uri) => {
        if (uri) setProfilePic(uri);
      })
      .catch(() => {});
  }, []);

  const pickProfilePicture = async () => {
    const alreadyAsked = await AsyncStorage.getItem(PROFILE_PIC_PERMISSION_KEY).catch(() => null);
    if (!alreadyAsked) {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      await AsyncStorage.setItem(PROFILE_PIC_PERMISSION_KEY, perm.granted ? 'granted' : 'denied').catch(
        () => {}
      );
      if (!perm.granted) return;
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

  // Demo logout: clears mock auth state and returns to the startup flow.
  const handleLogout = async () => {
    signOut.mutate();
    // Reset the onboarding flag so the prototype starts fresh on next launch.
    await AsyncStorage.removeItem(ONBOARDING_KEY).catch(() => {});
    router.replace('/(auth)/verification');
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between pt-2 pb-4">
          <HaganaLogo width={130} height={58} />
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center active:scale-[0.95]"
            hitSlop={8}
          >
            <ArrowLeftIcon size={20} className="text-foreground" />
          </Pressable>
        </View>

        {/* Avatar */}
        <View className="items-center mt-6">
          <Pressable onPress={pickProfilePicture} className="active:scale-[0.97]">
            <View className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-border bg-card">
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <View className="w-full h-full bg-primary items-center justify-center">
                  <Text className="text-5xl font-black text-primary-foreground">G</Text>
                </View>
              )}
              <View className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-primary items-center justify-center border-2 border-white">
                <CameraIcon size={12} className="text-primary-foreground" />
              </View>
            </View>
          </Pressable>

          <View className="flex-row items-center gap-1.5 mt-4">
            <Text className="text-xl font-bold text-foreground">Garang Deng Mabior</Text>
            <BadgeCheckIcon size={20} className="text-primary" />
          </View>
          <Text className="text-sm text-muted-foreground">@garang</Text>
        </View>

        {/* Total balance */}
        <LinearGradient
          colors={['#0D5C2E', '#0A4A26', '#093D1F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mt-7 rounded-3xl p-6"
          style={{ overflow: 'hidden' }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
                <WalletIcon size={18} className="text-white" />
              </View>
              <Text className="text-sm font-semibold text-white/80">Total Balance</Text>
            </View>
            <View className="bg-white/15 rounded-full px-2.5 py-0.5">
              <Text className="text-[10px] font-bold text-white">HGN-472913</Text>
            </View>
          </View>

          <Text className="mt-3 text-4xl font-black tracking-tight text-white">
            SSP 1,250,000.00
          </Text>
          <Text className="mt-1 text-xs text-white/60">
            Available across your Hagana wallet
          </Text>
        </LinearGradient>

        {/* Info card */}
        <View className="mt-8 bg-card rounded-2xl overflow-hidden border border-border">
          <View className="px-4 py-4 flex-row items-center justify-between border-b border-border">
            <Text className="text-[13px] text-muted-foreground">Mobile Number</Text>
            <Text className="text-[13px] font-bold text-foreground">+211 921 472 913</Text>
          </View>
          <View className="px-4 py-4 flex-row items-center justify-between border-b border-border">
            <Text className="text-[13px] text-muted-foreground">Email Address</Text>
            <Text className="text-[13px] font-bold text-foreground">garang.deng@mabior.net</Text>
          </View>
          <View className="px-4 py-4 flex-row items-center justify-between">
            <Text className="text-[13px] text-muted-foreground">Wallet ID</Text>
            <Text className="text-[13px] font-bold text-foreground">HGN-472913</Text>
          </View>
        </View>

        {/* Settings */}
        <Text className="mt-8 text-lg font-bold text-foreground">Settings</Text>
        <View className="mt-3 bg-card rounded-2xl overflow-hidden border border-border">
          {SETTINGS.map((s) => (
            <SettingsRow key={s.label} icon={s.icon} label={s.label} comingSoon={s.comingSoon} />
          ))}
        </View>

        {/* Edit Profile */}
        <Pressable
          onPress={() => {
            // Demo only — profile editing is not wired in the prototype.
          }}
          className="mt-8 w-full rounded-2xl py-4 items-center justify-center bg-secondary border border-border active:scale-[0.98]"
        >
          <Text className="text-base font-semibold text-foreground">Edit Profile</Text>
        </Pressable>

        {/* Log Out */}
        <Pressable
          onPress={handleLogout}
          className="mt-3 w-full rounded-2xl py-4 items-center justify-center bg-red/10 border border-red/20 active:scale-[0.98]"
        >
          <Text className="text-base font-bold text-red">Log Out</Text>
        </Pressable>

        <Text className="mt-4 text-center text-[11px] text-muted-foreground">
          Demo profile — no real account is linked.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
