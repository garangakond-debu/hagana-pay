import { useState, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeftIcon,
  SearchIcon,
  PlusIcon,
  UserSearchIcon,
  UsersIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp, useAuth } from '@/src/hooks';
import { HaganaLogo } from '@/components';

cssInterop(ArrowLeftIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(SearchIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(PlusIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(UserSearchIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(UsersIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(CheckCircle2Icon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(XCircleIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

// Client-generated idempotency key. The database uses it as the transaction
// reference (PK of the ledger), so retrying the SAME key can never move money twice.
function newClientRef(recipientId: string, amount: number) {
  const rand =
    typeof crypto !== 'undefined' && crypto?.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `ref_${Date.now()}_${rand}_${recipientId.slice(0, 8)}_${Math.round(amount * 100)}`.slice(0, 40);
}

/** Minimum recipient identity returned by the secure search_recipients RPC. */
interface Recipient {
  id: string;
  full_name: string | null;
  hagana_id: string | null;
  avatar_url: string | null;
}

/** Dynamic Avatar component with defensive fallback parsing */
function Avatar({ name, uri, size = 40 }: { name?: string | null; uri?: string | null; size?: number }) {
  const [imageError, setImageError] = useState(false);

  const safeName = name?.trim() || '';
  const initials = safeName.length > 0
    ? safeName
        .split(/\s+/)
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'HP';

  if (uri && !imageError) {
    return (
      <Image
        source={{ uri }}
        onError={() => setImageError(true)}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-primary/20 items-center justify-center border border-primary/30"
    >
      <Text style={{ fontSize: size * 0.38 }} className="font-bold text-primary">
        {initials}
      </Text>
    </View>
  );
}

export default function SendMoneyScreen() {
  const { client } = useApp();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [amount, setAmount] = useState(45000);
  const [debouncedAmount, setDebouncedAmount] = useState(45000);
  const [selected, setSelected] = useState<Recipient | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    reference: string;
    status: string;
    fee: number;
    total: number;
  } | null>(null);
  const [usedRef, setUsedRef] = useState<string | null>(null);

  // Debounce the search so we don't fire an RPC on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Debounce the amount so the fee quote RPC isn't fired on every keypress.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAmount(amount), 250);
    return () => clearTimeout(t);
  }, [amount]);

  const showingSearch = debounced.length > 0;

  // Search real Hagana Pay users via the secure SECURITY DEFINER RPC.
  const searchQuery = useQuery({
    queryKey: ['recipients', 'search', debounced, user?.id],
    queryFn: async () => {
      const { data, error } = await client.rpc('search_recipients', { search: debounced });
      if (error) throw error;
      return (data as Recipient[]).filter((r) => r.id !== user?.id);
    },
    enabled: showingSearch && !!user?.id,
  });

  const results = searchQuery.data ?? [];

  // Real SSP wallet balance — read-only, fetch-only.
  const walletQuery = useQuery({
    queryKey: ['wallet', user?.id, 'SSP'],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await client
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .eq('currency', 'SSP')
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const availableBalance = walletQuery.data?.balance ?? 0;

  // Real fee quote from the database.
  const feeQuery = useQuery({
    queryKey: ['transfer-fee', debouncedAmount],
    queryFn: async () => {
      const { data, error } = await client.rpc('get_transfer_fee', {
        p_amount: debouncedAmount,
      });
      if (error) throw error;
      const row = (data as { fee: number; total: number }[] | null)?.[0];
      return row ?? { fee: 0, total: debouncedAmount };
    },
    enabled: debouncedAmount > 0,
    staleTime: 60_000,
  });

  const fee = feeQuery.data?.fee ?? 0;
  const total = amount + fee;

  const quickAmounts = [1000, 5000, 10000];
  const addAmount = (v: number) => setAmount((a) => a + v);

  const balanceLoaded = walletQuery.isSuccess && walletQuery.data != null;
  const isAmountValid = amount > 0 && (!balanceLoaded || total <= availableBalance);
  const cannotProceed = !selected || !isAmountValid;

  // Real secure transfer.
  const sendMoney = useMutation({
    mutationFn: async ({ recipient, amount }: { recipient: Recipient; amount: number }) => {
      const ref = newClientRef(recipient.id, amount);
      setUsedRef(ref);
      const { data, error } = await client.rpc('send_money', {
        p_recipient_id: recipient.id,
        p_amount: amount,
        p_client_ref: ref,
      });
      if (error) throw error;
      const row = (data as {
        reference: string;
        status: string;
        fee: number;
        total: number;
      }[] | null)?.[0];
      if (!row) throw new Error('NO_RESULT');
      return row;
    },
    onSuccess: (data) => {
      setResult(data);
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['wallet', user?.id, 'SSP'] });
      queryClient.invalidateQueries({ queryKey: ['transfers', user?.id] });
    },
    onError: (err: unknown) => {
      setConfirmOpen(false);
      setSendError(mapSendError(err));
      setResult(null);
    },
  });

  const openConfirm = () => {
    setSendError(null);
    setResult(null);
    setConfirmOpen(true);
  };

  const onTransfer = () => {
    if (!selected || sendMoney.isPending) return;
    setSendError(null);
    sendMoney.mutate({ recipient: selected, amount });
  };

  const onDone = () => {
    setResult(null);
    setConfirmOpen(false);
    setSelected(null);
    setAmount(45000);
    setUsedRef(null);
    setSendError(null);
  };

  const onSendAnother = () => {
    onDone();
  };

  const selectRecipient = (r: Recipient) => {
    setSelected(r);
    setQuery('');
    setDebounced('');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center gap-4 pt-2 pb-4">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center active:scale-[0.95]"
              hitSlop={8}
            >
              <ArrowLeftIcon size={20} className="text-foreground" />
            </Pressable>
            <HaganaLogo width={110} height={46} />
          </View>

          {/* Search */}
          <View className="flex-row items-center gap-3 bg-card rounded-2xl border border-border px-4 py-3.5">
            <SearchIcon size={20} className="text-muted-foreground" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search Hagana ID or name"
              placeholderTextColor="#94a3b8"
              className="flex-1 text-base text-foreground"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          {/* Live search results */}
          {showingSearch && (
            <View className="mt-3 bg-card rounded-2xl border border-border overflow-hidden">
              {searchQuery.isLoading ? (
                <View className="flex-row items-center justify-center gap-2 px-4 py-4">
                  <ActivityIndicator size="small" color="#0D5C2E" />
                  <Text className="text-sm text-muted-foreground">Searching…</Text>
                </View>
              ) : searchQuery.isError ? (
                <View className="px-4 py-4">
                  <Text className="text-sm font-semibold text-destructive">Search failed</Text>
                  <Text className="mt-1 text-xs text-muted-foreground">
                    Please try again in a moment.
                  </Text>
                </View>
              ) : results.length > 0 ? (
                results.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => selectRecipient(r)}
                    className="flex-row items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 active:bg-muted"
                  >
                    <Avatar name={r.full_name} uri={r.avatar_url} size={40} />
                    <View className="flex-1 min-w-0">
                      <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                        {r.full_name ?? 'Hagana User'}
                      </Text>
                      <Text className="text-xs text-muted-foreground">{r.hagana_id}</Text>
                    </View>
                    <Text className="text-sm font-semibold text-primary">Select</Text>
                  </Pressable>
                ))
              ) : (
                <View className="flex-row items-center gap-3 px-4 py-4">
                  <UserSearchIcon size={18} className="text-muted-foreground" />
                  <Text className="flex-1 text-sm text-muted-foreground">
                    No recipient found for “{debounced}”.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Selected recipient */}
          {selected && (
            <View className="mt-3 flex-row items-center gap-3 bg-primary/5 rounded-2xl border border-primary/20 px-4 py-3">
              <Avatar name={selected.full_name} uri={selected.avatar_url} size={40} />
              <View className="flex-1 min-w-0">
                <Text className="text-base font-bold text-foreground" numberOfLines={1}>
                  {selected.full_name ?? 'Hagana User'}
                </Text>
                <Text className="text-xs text-muted-foreground">{selected.hagana_id}</Text>
              </View>
              <Text className="text-sm font-bold text-primary">✓ Selected</Text>
            </View>
          )}

          {/* Recent contacts — empty state */}
          {!showingSearch && !selected && (
            <View className="mt-6 flex-col items-center justify-center rounded-2xl bg-card border border-border px-6 py-8">
              <View className="w-12 h-12 rounded-full bg-muted items-center justify-center">
                <UsersIcon size={22} className="text-muted-foreground" />
              </View>
              <Text className="mt-3 text-sm font-bold text-foreground">No recent recipients</Text>
              <Text className="mt-1 text-center text-xs text-muted-foreground">
                Search for a Hagana Pay user by Hagana ID or their name.
              </Text>
            </View>
          )}

          {/* Amount card */}
          <LinearGradient
            colors={['#0D5C2E', '#0A4A26', '#093D1F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="mt-4 rounded-[28px] p-6"
            style={{ overflow: 'hidden' }}
          >
            <View
              className="absolute -top-16 -right-10 w-48 h-48 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            />
            <View
              className="absolute -bottom-20 -left-12 w-52 h-52 rounded-full"
              style={{ backgroundColor: 'rgba(212,175,55,0.10)' }}
            />

            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
                Enter Amount to Send
              </Text>
              <View className="bg-white/15 rounded-full px-2.5 py-1">
                <Text className="text-[11px] font-bold text-white">SSP</Text>
              </View>
            </View>

            <Text className="mt-4 text-[44px] leading-tight font-black tracking-tight text-white">
              {Number(amount).toLocaleString('en-US')}
            </Text>

            {/* Balance pill */}
            <View className="mt-4 self-start flex-row items-center gap-1.5 bg-white/12 rounded-full px-3.5 py-1.5">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              {walletQuery.isLoading ? (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
              ) : walletQuery.isError ? (
                <Text className="text-xs font-semibold text-white/80">Balance unavailable</Text>
              ) : (
                <Text className="text-xs font-semibold text-white/80">
                  Balance:{' '}
                  {Number(availableBalance).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              )}
            </View>

            {/* Divider */}
            <View className="h-px bg-white/15 my-5" />

            {/* Quick amount buttons */}
            <View className="flex-row gap-3 w-full">
              {quickAmounts.map((v) => (
                <Pressable
                  key={v}
                  onPress={() => addAmount(v)}
                  className="flex-1 bg-white rounded-2xl px-2 py-3 items-center active:scale-[0.94] active:bg-emerald-50"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.18,
                    shadowRadius: 6,
                    elevation: 3,
                  }}
                >
                  <View className="flex-row items-center gap-1">
                    <PlusIcon size={14} className="text-primary" />
                    <Text className="text-[15px] font-black text-[#0D5C2E]">
                      {Number(v).toLocaleString('en-US')}
                    </Text>
                  </View>
                  <Text className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                    Add
                  </Text>
                </Pressable>
              ))}
            </View>
          </LinearGradient>

          {/* Validation hint */}
          {selected && balanceLoaded && total > availableBalance && (
            <View className="mt-3 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
              <Text className="text-xs font-semibold text-destructive">
                This transfer (amount + fee) exceeds your available balance. Enter an amount up to{' '}
                {Number(availableBalance).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          )}

          {/* Send button */}
          <Pressable
            onPress={openConfirm}
            disabled={cannotProceed}
            className={`mt-8 w-full rounded-2xl py-4 items-center justify-center active:scale-[0.98] ${
              cannotProceed ? 'bg-muted' : 'bg-primary'
            }`}
          >
            <Text
              className={`text-base font-bold ${
                cannotProceed ? 'text-muted-foreground' : 'text-primary-foreground'
              }`}
            >
              Send SSP {Number(amount).toLocaleString('en-US')}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirmation modal */}
      <Modal visible={confirmOpen} transparent animationType="slide" onRequestClose={() => setConfirmOpen(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-card rounded-t-3xl px-5 pt-6 pb-10">
            <View className="w-10 h-1 rounded-full bg-muted self-center mb-5" />
            <Text className="text-lg font-bold text-foreground">Confirm Transfer</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Money moves the moment you confirm. This cannot be undone.
            </Text>

            <View className="mt-5 bg-muted/60 rounded-2xl px-4 py-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">Recipient</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {selected?.full_name ?? 'Hagana User'}
                </Text>
              </View>
              <View className="h-px bg-border my-3" />
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">Amount</Text>
                <Text className="text-base font-black text-foreground">
                  SSP {Number(amount).toLocaleString('en-US')}
                </Text>
              </View>
              <View className="h-px bg-border my-3" />
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">Transfer Fee</Text>
                <Text className="text-base font-semibold text-foreground">
                  SSP {Number(fee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View className="h-px bg-border my-3" />
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">Total</Text>
                <Text className="text-base font-black text-primary">
                  SSP {Number(total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {sendError && (
              <View className="mt-4 flex-row items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
                <XCircleIcon size={18} className="text-destructive" />
                <Text className="flex-1 text-xs font-semibold text-destructive">{sendError}</Text>
              </View>
            )}

            <Pressable
              onPress={onTransfer}
              disabled={sendMoney.isPending}
              className={`mt-6 w-full rounded-2xl py-4 items-center justify-center active:scale-[0.98] ${
                sendMoney.isPending ? 'bg-muted' : 'bg-primary'
              }`}
            >
              {sendMoney.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-base font-bold text-primary-foreground">Confirm & Send</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => setConfirmOpen(false)}
              disabled={sendMoney.isPending}
              className="mt-2 w-full rounded-2xl py-3 items-center active:scale-[0.98]"
            >
              <Text className="text-sm font-semibold text-muted-foreground">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Success modal */}
      <Modal
        visible={!!result}
        transparent
        animationType="slide"
        onRequestClose={onDone}
      >
        <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="w-full bg-card rounded-3xl px-6 pt-8 pb-8 items-center">
            <CheckCircle2Icon size={56} className="text-primary" />
            <Text className="mt-4 text-xl font-black text-foreground">Transfer Successful</Text>
            <Text className="mt-1 text-sm text-muted-foreground text-center">
              SSP {Number(amount).toLocaleString('en-US')} sent to {selected?.full_name ?? 'Hagana User'}
            </Text>

            <View className="mt-5 w-full bg-muted/60 rounded-2xl px-4 py-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-muted-foreground">Transfer Fee</Text>
                <Text className="text-xs font-semibold text-foreground">
                  SSP {Number(result?.fee ?? fee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View className="h-px bg-border/60 my-2" />
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-muted-foreground">Total Deducted</Text>
                <Text className="text-xs font-semibold text-foreground">
                  SSP {Number(result?.total ?? total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View className="h-px bg-border/60 my-2" />
              <Text className="text-xs text-muted-foreground">Transaction Reference</Text>
              <Text className="text-sm font-bold text-foreground" selectable>
                {usedRef ?? result?.reference}
              </Text>
            </View>

            <Pressable
              onPress={onSendAnother}
              className="mt-6 w-full rounded-2xl py-4 items-center bg-primary active:scale-[0.98]"
            >
              <Text className="text-base font-bold text-primary-foreground">Send Another</Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              className="mt-2 w-full rounded-2xl py-3 items-center active:scale-[0.98]"
            >
              <Text className="text-sm font-semibold text-primary">Back to Home</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/** Map DB ERR_* messages and PostgREST errors to friendly UI messages. */
function mapSendError(err: unknown): string {
  const message = err && typeof err === 'object' && 'message' in err ? String((err as any).message) : '';
  const details = err && typeof err === 'object' && 'details' in err ? String((err as any).details) : '';
  const combined = message + ' ' + details;

  if (/ERR_INSUFFICIENT_BALANCE/.test(combined))
    return 'You do not have enough available balance for this transfer.';
  if (/ERR_AMOUNT_EXCEEDS/.test(combined))
    return 'Amount exceeds your available balance.';
  if (/ERR_SELF_TRANSFER/.test(combined)) return 'You cannot send money to yourself.';
  if (/ERR_INVALID_AMOUNT/.test(combined)) return 'Please enter a valid amount greater than zero.';
  if (/ERR_NO_RECIPIENT/.test(combined))
    return 'Please select a recipient before sending.';
  if (/ERR_RECIPIENT_NOT_FOUND/.test(combined))
    return 'That recipient no longer exists on Hagana Pay.';
  if (/ERR_RECIPIENT_UNAVAILABLE/.test(combined))
    return 'That recipient’s account is not available to receive money right now.';
  if (/ERR_NO_SENDER_WALLET/.test(combined))
    return 'Your SSP wallet is not set up yet.';
  if (/ERR_NO_RECIPIENT_WALLET/.test(combined))
    return 'The recipient’s SSP wallet is not set up yet.';
  if (/ERR_COMMISSION_ACCOUNT/.test(combined))
    return 'The transfer could not be completed at this time. Please try again — your balance was not changed.';
  if (/ERR_UNAUTHENTICATED/.test(combined))
    return 'Your session has expired. Please sign in again.';
  if (/ERR_INVALID_REF/.test(combined))
    return 'Transfer could not be processed. Please try again.';

  return 'The transfer could not be completed. Please try again — your balance was not changed.';
}