import { Text, Pressable, TextInput, View } from 'react-native';
import { type LucideIcon } from 'lucide-react-native';

/* ---------------- Primary Button ---------------- */
export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`w-full rounded-2xl py-4 items-center justify-center flex-row active:scale-[0.98] ${
        disabled || loading ? 'bg-primary/50' : 'bg-primary'
      }`}
    >
      <Text className="text-base font-bold text-primary-foreground">
        {loading ? 'Please wait…' : title}
      </Text>
    </Pressable>
  );
}

/* ---------------- Outline button ---------------- */
export function OutlineButton({
  title,
  onPress,
  icon: Icon,
}: {
  title: string;
  onPress: () => void;
  icon: LucideIcon;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="w-full rounded-2xl py-4 items-center justify-center flex-row gap-2 bg-secondary border border-border active:scale-[0.98]"
    >
      {Icon ? <Icon size={20} className="text-primary" /> : null}
      <Text className="text-base font-semibold text-primary">{title}</Text>
    </Pressable>
  );
}

/* ---------------- Input field ---------------- */
export function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  suffix,
  keyboardType = 'default',
  editable = true,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  suffix?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  editable?: boolean;
}) {
  const hasValue = value.trim().length > 0;
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <View className="flex-row items-center bg-card rounded-[40px] border border-border px-5">
        {suffix ? <Text className="mr-2 text-base font-bold text-primary">{suffix}</Text> : null}
        <View className="flex-1 py-4 justify-center">
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={''}
            keyboardType={keyboardType}
            accessibilityLabel={placeholder}
            editable={editable}
            className="text-base text-foreground"
            style={{ fontVariant: ['tabular-nums'] }}
          />
          {/* Placeholder overlay — fully unmounts once the user types, never overlaps input */}
          {hasValue ? null : (
            <View pointerEvents="none" className="absolute left-0 top-0 right-0 bottom-0 justify-center">
              <Text className="text-base" style={{ color: '#9aa4b2' }}>
                {placeholder}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

/* ---------------- Field row (for confirmation cards) ---------------- */
export function FieldRow({ label, value, highlighted }: { label: string; value: string; highlighted?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className={`text-sm font-semibold ${highlighted ? 'text-primary text-base' : 'text-foreground'}`}>
        {value}
      </Text>
    </View>
  );
}

/* ---------------- Confirmation card ---------------- */
export function ConfirmationCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View className="bg-card rounded-3xl p-5 border border-border">
      <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</Text>
      <View className="mt-1 divide-y divide-border">{children}</View>
    </View>
  );
}

/* ---------------- Demo notice ---------------- */
export function DemoNotice() {
  return (
    <View className="flex-row items-center gap-2 bg-accent/15 rounded-2xl px-4 py-3">
      <Text className="text-base">🧪</Text>
      <View className="flex-1">
        <Text className="text-sm font-bold text-accent-foreground">Demo Mode</Text>
        <Text className="text-xs text-muted-foreground">No real money is being transferred.</Text>
      </View>
    </View>
  );
}

/* ---------------- Security strip ---------------- */
export function SecurityStrip() {
  return (
    <View className="flex-row items-center justify-center gap-2 bg-muted rounded-2xl px-4 py-3">
      <Text className="text-sm">🔒</Text>
      <View>
        <Text className="text-xs font-semibold text-foreground">Secure Hagana Wallet</Text>
        <Text className="text-[11px] text-muted-foreground">Your transactions are protected.</Text>
      </View>
    </View>
  );
}
