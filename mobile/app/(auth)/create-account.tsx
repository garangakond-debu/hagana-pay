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
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, CheckIcon, ChevronDownIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { PrimaryButton } from '@/components/ui';
import { HaganaLogo } from '@/components';
import { useAuth } from '@/src/hooks';

cssInterop(ArrowLeftIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(EyeIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(EyeOffIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(CheckIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ChevronDownIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

export default function CreateAccountScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setError(null);
    if (!fullName.trim() || !phone.trim() || !password.trim() || !confirm.trim()) {
      setError('Please fill in all the required fields.');
      return;
    }
    if (!/^[+0-9\s]{6,}$/.test(phone.trim())) {
      setError('Please enter a valid mobile number.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!agree) {
      setError('Please accept the Terms & Conditions to continue.');
      return;
    }
    // Prevent double submission while the request is in flight.
    if (loading) return;
    setLoading(true);
    try {
      // 1. Request the Supabase Auth phone signup. With phone confirmation enabled, Supabase
      //    creates the (unconfirmed) account keyed by the phone number and sends an OTP to it —
      //    it does NOT return a usable session here. Any failure (account already exists, weak
      //    password, invalid phone, unreachable OTP provider, network) throws and is caught below.
      //    The password is handled only by Supabase Auth and is never stored in our database.
      await signUp.mutateAsync({
        phone: phone.trim(),
        password,
      });

      // 2. OTP was requested successfully. We do NOT navigate into the app and do NOT create the
      //    profile yet — the account is still unconfirmed. Pass only the minimum information the
      //    verification screen needs to confirm the phone: the identifier (phone) and the user's
      //    full name (preserved so the profile can be created with the authenticated user id once
      //    verification succeeds). No user id is accepted or forwarded from the client.
      router.push({
        pathname: '/(auth)/verification',
        params: {
          phone: phone.trim(),
          full_name: fullName.trim(),
        },
      });
    } catch (err: any) {
      const message = err?.message ?? 'Something went wrong. Please try again.';
      if (/already registered|already been registered|exists/i.test(message)) {
        setError('An account already exists for this number. Please sign in instead.');
      } else if (/password|weak/i.test(message)) {
        setError(message);
      } else if (/sms|otp|message|phone/i.test(message)) {
        setError('We could not send a verification code to this number. Please try again.');
      } else if (/network|fetch|connection/i.test(message)) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(message);
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
          <View className="flex-row items-center justify-between mt-3">
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              className="w-11 h-11 rounded-full bg-card border border-border items-center justify-center"
            >
              <ArrowLeftIcon size={20} className="text-foreground" />
            </Pressable>
            <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={10}>
              <Text className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Text className="font-bold text-primary">Sign In</Text>
              </Text>
            </Pressable>
          </View>

          {/* Logo */}
          <View className="items-center mt-4 mb-6">
            <HaganaLogo width={170} height={80} />
          </View>

          {/* Title */}
          <View className="mt-2">
            <Text className="text-3xl font-black tracking-tight text-foreground">
              Let's get started
            </Text>
            <Text className="mt-1.5 text-base text-muted-foreground leading-5">
              Create your account to access Hagana Pay.
            </Text>
          </View>

          {/* Form */}
          <View className="mt-6 gap-4">
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Full Name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#94a3b8"
                className="bg-card rounded-2xl border border-border px-4 py-4 text-base text-foreground"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Mobile Number</Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-row items-center gap-1 bg-card rounded-2xl border border-border px-3 py-4">
                  <Text className="text-base font-bold text-foreground">+211</Text>
                  <ChevronDownIcon size={16} className="text-muted-foreground" />
                </View>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  className="flex-1 bg-card rounded-2xl border border-border px-4 py-4 text-base text-foreground"
                />
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Password</Text>
              <View className="flex-row items-center bg-card rounded-2xl border border-border px-4">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
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

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Confirm Password</Text>
              <View className="flex-row items-center bg-card rounded-2xl border border-border px-4">
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Confirm your password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showConfirm}
                  className="flex-1 py-4 text-base text-foreground"
                />
                <Pressable onPress={() => setShowConfirm((s) => !s)} hitSlop={8}>
                  {showConfirm ? (
                    <EyeOffIcon size={20} className="text-muted-foreground" />
                  ) : (
                    <EyeIcon size={20} className="text-muted-foreground" />
                  )}
                </Pressable>
              </View>
            </View>
          </View>

          {/* Your Hagana Account preview */}
          <View className="mt-6 bg-card rounded-3xl p-5 border border-border">
            <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Your Hagana Account
            </Text>
            <Text className="mt-2 text-2xl font-black tracking-wider text-primary">
              HGN-XXXXXX
            </Text>
            <Text className="mt-1.5 text-xs text-muted-foreground leading-4">
              Your Hagana ID will be used to identify your Hagana Pay account.
            </Text>
          </View>

          {/* Terms */}
          <Pressable
            onPress={() => setAgree((a) => !a)}
            className="mt-5 flex-row items-start gap-3"
          >
            <View
              className={`mt-0.5 w-6 h-6 rounded-md items-center justify-center border ${
                agree ? 'bg-primary border-primary' : 'border-border bg-card'
              }`}
            >
              {agree ? <CheckIcon size={15} className="text-primary-foreground" /> : null}
            </View>
            <Text className="flex-1 text-sm text-muted-foreground leading-5">
              I agree to Hagana Pay's{' '}
              <Text className="font-bold text-primary underline">Terms &amp; Conditions</Text>{' '}
              and{' '}
              <Text className="font-bold text-primary underline">Privacy Policy</Text>.
            </Text>
          </Pressable>

          {error ? <Text className="mt-3 text-xs text-destructive">{error}</Text> : null}

          <View className="mt-6">
            <PrimaryButton
              title={loading ? 'Creating account…' : 'Create Account'}
              onPress={handleCreate}
              disabled={loading}
            />
          </View>

          <Text className="mt-4 text-center text-[11px] text-muted-foreground">
            {loading ? 'Requesting verification code…' : 'We\'ll text you a code to verify your number.'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
