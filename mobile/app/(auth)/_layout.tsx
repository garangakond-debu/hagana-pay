import { Stack } from 'expo-router';
import { useTheme } from '@/src/hooks';

/**
 * AuthNavigator — the headless account flow.
 *
 * Verification -> Create Account -> Account Created (then into the app).
 * Future: Login, Forgot/Reset Password, PIN setup, Biometric.
 */
export default function AuthLayout() {
  const { isDark } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? '#0b1810' : '#f7f9f7' },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="create-account" />
      <Stack.Screen name="create-pin" />
      <Stack.Screen name="account-created" />
    </Stack>
  );
}
