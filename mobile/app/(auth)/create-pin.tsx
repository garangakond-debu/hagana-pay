import { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { PrimaryButton, InputField } from '@/components/ui';
import { HaganaLogo } from '@/components';
import { useAuth } from '@/src/hooks';

cssInterop(ArrowLeftIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function CreatePinScreen() {
  const params = useLocalSearchParams<{ full_name?: string; phone?: string }>();
  const { session } = useAuth();

  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (submitting) return; // never submit twice

    setError(null);

    const p = pin;
    const c = confirm;

    // Validation
    if (!/^[0-9]{4}$/.test(p)) {
      setError('Please enter a 4-digit PIN.');
      return;
    }
    if (!/^[0-9]{4}$/.test(c)) {
      setError('Please confirm your PIN with 4 digits.');
      return;
    }
    if (p !== c) {
      setError('Your PINs do not match. Please try again.');
      return;
    }

    // Use the authenticated session user id — never a value from the route.
    const userId = session?.user?.id;
    if (!userId) {
      setError('Your session has expired. Please verify your number again.');
      return;
    }

    if (!API_URL) {
      setError('Setup is not available right now. Please try again shortly.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin: p }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error('setup_failed');
      }

      // Success — PIN hash is stored server-side. Clear the entered PIN from memory,
      // then go to the Hagana Home screen.
      setPin('');
      setConfirm('');
      router.replace(`/(tabs)/index?full_name=${encodeURIComponent(params.full_name ?? '')}`);
    } catch (err: any) {
      const message = err?.message ?? '';
      if (/network|fetch|connection/i.test(message)) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('We could not complete setup. Please try again shortly.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="mt-3 w-11 h-11 rounded-full bg-card border border-border items-center justify-center"
          >
            <ArrowLeftIcon size={20} className="text-foreground" />
          </Pressable>

          <View className="items-center mt-4 mb-6">
            <HaganaLogo width={170} height={80} />
          </View>

          <View className="mt-2">
            <Text className="text-3xl font-black tracking-tight text-foreground">Create your PIN</Text>
            <Text className="mt-1.5 text-base text-muted-foreground leading-5">
              {params.full_name ? `Welcome, ${params.full_name}. ` : ''}Set a 4-digit PIN to keep your
              account secure.
            </Text>
          </View>

          <View className="mt-7 gap-4">
            <InputField
              label="Create PIN"
              placeholder="4-digit PIN"
              value={pin}
              onChangeText={(t) => {
                setError(null);
                setPin(t.replace(/[^0-9]/g, '').slice(0, 4));
              }}
              keyboardType="numeric"
            />
            <InputField
              label="Confirm PIN"
              placeholder="Re-enter your PIN"
              value={confirm}
              onChangeText={(t) => {
                setError(null);
                setConfirm(t.replace(/[^0-9]/g, '').slice(0, 4));
              }}
              keyboardType="numeric"
            />
          </View>

          {error ? <Text className="mt-3 text-xs text-destructive">{error}</Text> : null}

          <View className="mt-8">
            <PrimaryButton
              title={submitting ? 'Securing…' : 'Save & Continue'}
              onPress={handleSave}
              loading={submitting}
              disabled={submitting}
            />
          </View>

          <Text className="mt-5 text-center text-[11px] text-muted-foreground leading-4">
            🔒 Your PIN is encrypted on our secure servers. It is never stored or shown on this device.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
