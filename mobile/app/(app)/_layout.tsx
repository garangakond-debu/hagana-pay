import { Stack, Redirect, router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useTheme, useAuth, useApp } from '@/src/hooks';
import { HaganaLogo } from '@/components';

const ONBOARDING_KEY = 'hagana_has_seen_onboarding';

import { Buffer } from 'buffer';

/**
 * AuthGate — secure gate for all `(app)` screens.
 *
 * It ALWAYS renders its children (the Stack) so the navigator is never conditionally
 * unmounted. Depending on the authenticated Supabase session + the user's account_status
 * it renders a declarative <Redirect> or a full-screen overlay on top of the Stack:
 *
 *   - no session            -> /(auth)/login
 *   - pending_verification  -> /(auth)/verification?phone=...
 *   - pending_pin           -> /(auth)/create-pin?phone=...&full_name=...
 *   - active                -> children (access granted)
 *   - restricted/suspended/closed/unknown/missing -> blocked overlay (FAIL CLOSED)
 *
 * The backend / RLS remains the real security boundary; this gate is the UX + a first
 * layer of defense. Only the authenticated Supabase session identity is trusted — a user id
 * is never accepted from a route parameter.
 */
function AuthGate({ children }: { children: ReactNode }) {
  const { client } = useApp();
  const { session, isLoading: authLoading } = useAuth();
  const userId = session?.user?.id;

  const profileQuery = useQuery({
    queryKey: ['app-gate-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await client
        .from('profiles')
        .select('account_status, phone, full_name')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 0,
  });

  // Session is still resolving, or we have a session and the profile is still loading.
  const loading = authLoading || (!!userId && profileQuery.isLoading);

  // FAIL CLOSED: any unknown status, missing profile, or profile query error blocks access.
  const status = profileQuery.isError ? null : profileQuery.data?.account_status;

  return (
    <>
      {children}
      {/* Always render children (the Stack) above; layer the gate state on top. */}
      {loading ? (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(255,255,255,0.55)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator size="large" color="#0d5c2e" />
        </View>
      ) : !session ? (
        <Redirect href="/(auth)/login" />
      ) : status === 'active' ? null : status === 'pending_verification' ? (
        <Redirect
          href={{
            pathname: '/(auth)/verification',
            params: { phone: profileQuery.data?.phone ?? '', full_name: profileQuery.data?.full_name ?? '' },
          }}
        />
      ) : status === 'pending_pin' ? (
        <Redirect
          href={{
            pathname: '/(auth)/create-pin',
            params: { phone: profileQuery.data?.phone ?? '', full_name: profileQuery.data?.full_name ?? '' },
          }}
        />
      ) : (
        // restricted / suspended / closed / unknown / missing / error -> block access
        <View style={StyleSheet.absoluteFill}>
          <View className="flex-1 bg-background items-center justify-center px-8">
            <HaganaLogo width={170} height={80} />
            <Text className="mt-6 text-2xl font-black tracking-tight text-foreground text-center">
              Account Unavailable
            </Text>
            <Text className="mt-2 text-base text-muted-foreground text-center leading-6">
              Your account is currently restricted or suspended. Please contact customer support for
              assistance.
            </Text>
          </View>
        </View>
      )}
    </>
  );
}

export default function AppLayout() {
  const { isDark } = useTheme();

  // Open onboarding on the very first authenticated launch only. The Home screen owns the
  // initial route and is mounted here (behind the gate), so this runs safely after the root
  // navigator has mounted.
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((seen) => {
        if (!seen) router.replace('/onboarding');
      })
      .catch(() => {});
  }, []);

  return (
    <AuthGate>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: isDark ? '#0b1810' : '#f7f9f7' },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="deposit" />
        <Stack.Screen name="pay-merchant" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="send-money" />
        <Stack.Screen name="withdraw" />
      </Stack>
    </AuthGate>

    
  );
}
