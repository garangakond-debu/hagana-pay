import { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { PrimaryButton } from '@/components/ui';
import { HaganaLogo } from '@/components';
import { useAuth, useApp } from '@/src/hooks';

cssInterop(ArrowLeftIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(EyeIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(EyeOffIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

export default function LoginScreen() {
  const { client } = useApp();
  const { signInWithPhone } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);

    // Validation
    if (!phone.trim()) {
      setError('Please enter your mobile number.');
      return;
    }
    if (!/^[+0-9\s]{6,}$/.test(phone.trim())) {
      setError('Please enter a valid mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    // Prevent double submission while the request is in flight.
    if (loading) return;
    setLoading(true);

    try {
      // 1. Authenticate with Supabase Auth using REAL phone + password authentication
      //    (signInWithPassword with the `phone` identifier, via signInWithPhone).
      //    Supabase verifies the password against its own hashed copy — we never verify or
      //    store passwords ourselves. The authenticated session from Supabase is the single
      //    source of user identity.
      const data = await signInWithPhone.mutateAsync({
        phone: phone.trim(),
        password,
      });
      const userId = data?.session?.user?.id ?? data?.user?.id;
      if (!userId) {
        throw new Error('No session returned. Please try again.');
      }

      // 2. Load the user's profile to decide account status. We key on the authenticated
      //    Supabase session id — never a value supplied by the frontend.
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('account_status')
        .eq('id', userId)
        .maybeSingle();
      if (profileError) throw profileError;

      const status = profile?.account_status;

      // 3. Route based on account status. We FAIL CLOSED: an unknown or missing status must
      //    never be treated as access granted.
      if (status === 'active') {
        // Only an active account is allowed into the main application.
        router.replace('/(tabs)/index');
        return;
      }
      if (status === 'pending_verification') {
        // Phone not yet verified — back to verification. We only pass the phone identifier.
        router.replace({
          pathname: '/(auth)/verification',
          params: { phone: phone.trim(), full_name: '' },
        });
        return;
      }
      if (status === 'pending_pin') {
        // Verified but no PIN yet — create it.
        router.replace({
          pathname: '/(auth)/create-pin',
          params: { phone: phone.trim(), full_name: '' },
        });
        return;
      }
      if (status === 'suspended' || status === 'restricted') {
        setError('Your account is currently restricted. Please contact customer support.');
        return;
      }

      // 4. Unknown / missing status — do NOT grant access. Show a safe, generic error and stop.
      setError(
        'Your account could not be accessed right now. Please try again later or contact support.',
      );
    } catch (err: any) {
      const message = err?.message ?? 'Something went wrong. Please try again.';
      if (/invalid login|invalid credentials|password/i.test(message)) {
        setError('Incorrect phone number or password. Please try again.');
      } else if (/not found|no account|user not/i.test(message)) {
        setError('No account found for this number. Please create an account.');
      } else if (/network|fetch|connection|offline/i.test(message)) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('We could not sign you in. Please try again shortly.');
      }
    } finally {
      setLoading(false);
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
          {/* Header */}
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="mt-3 w-11 h-11 rounded-full bg-card border border-border items-center justify-center"
          >
            <ArrowLeftIcon size={20} className="text-foreground" />
          </Pressable>

          {/* Logo */}
          <View className="items-center mt-4 mb-6">
            <HaganaLogo width={170} height={80} />
          </View>

          {/* Title */}
          <View className="mt-2">
            <Text className="text-3xl font-black tracking-tight text-foreground">Welcome back</Text>
            <Text className="mt-1.5 text-base text-muted-foreground leading-5">
              Sign in to your Hagana Pay account.
            </Text>
          </View>

          {/* Form */}
          <View className="mt-6 gap-4">
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Mobile Number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                autoComplete="tel"
                className="bg-card rounded-2xl border border-border px-4 py-4 text-base text-foreground"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Password</Text>
              <View className="flex-row items-center bg-card rounded-2xl border border-border px-4">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPass}
                  className="flex-1 py-4 text-base text-foreground"
                />
                <Pressable onPress={() => setShowPass((s) => !s)} hitSlop={8}>
                  {showPass ? (
                    <EyeOffIcon size={20} className="text-muted-foreground" />
                  ) : (
                    <EyeIcon size={20} className="text-muted-foreground" />
                  )}
                </Pressable>
              </View>
            </View>
          </View>

          {/* Forgot password */}
          <Pressable onPress={() => {}} hitSlop={8} className="mt-4 self-end">
            <Text className="text-sm font-semibold text-primary">Forgot Password?</Text>
          </Pressable>

          {error ? <Text className="mt-3 text-xs text-destructive">{error}</Text> : null}

          {/* Submit */}
          <View className="mt-6">
            <PrimaryButton
              title={loading ? 'Signing in…' : 'Sign In'}
              onPress={handleSignIn}
              disabled={loading}
            />
          </View>

          {/* Create account link */}
          <Pressable
            onPress={() => router.replace('/(auth)/create-account')}
            hitSlop={8}
            className="mt-6 flex-row items-center justify-center"
          >
            <Text className="text-sm text-muted-foreground">
              New to Hagana Pay?{' '}
              <Text className="font-bold text-primary">Create Account</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
