import { Text, View, ActivityIndicator, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApp, useAuth, useTheme } from '@/src/hooks';
import { TransactionList } from '@/components/transactions';
import { HaganaLogo } from '@/components';
import type { Transaction } from '@/src/db/types';

type Filter = 'all' | 'in' | 'out';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in', label: 'Money In' },
  { key: 'out', label: 'Money Out' },
];

// Deposit and received transfers credit the wallet; the rest debit it.
const MONEY_IN: string[] = ['deposit', 'transfer_received'];

export default function TransactionsScreen() {
  const { client } = useApp();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');

  const txnsQuery = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await client
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
    enabled: !!user?.id,
  });

  const items = useMemo(() => {
    const all = txnsQuery.data ?? [];
    if (filter === 'all') return all;
    return all.filter((t) =>
      filter === 'in' ? MONEY_IN.includes(t.type) : !MONEY_IN.includes(t.type)
    );
  }, [txnsQuery.data, filter]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={txnsQuery.isFetching}
            onRefresh={() => txnsQuery.refetch()}
            tintColor={isDark ? '#9aa69e' : '#0d5c2e'}
          />
        }
      >
        <View className="pt-2 pb-4">
          <HaganaLogo width={110} height={46} />
          <Text className="text-2xl font-black tracking-tight text-foreground mt-2">Transactions</Text>
          <Text className="text-sm text-muted-foreground mt-1">Your wallet activity</Text>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 ${
                filter === f.key ? 'bg-primary' : 'bg-card border border-border'
              }`}
            >
              <Text className={`text-sm font-semibold ${filter === f.key ? 'text-primary-foreground' : 'text-foreground'}`}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {txnsQuery.isLoading ? (
          <View className="py-16 items-center">
            <ActivityIndicator size="large" color={isDark ? '#2ecd71' : '#0d5c2e'} />
          </View>
        ) : items.length > 0 ? (
          <View className="mt-4">
            <TransactionList items={items} />
          </View>
        ) : (
          <View className="mt-4 bg-card rounded-3xl px-5 py-14 items-center">
            <Text className="text-3xl">📭</Text>
            <Text className="mt-3 text-base font-semibold text-foreground">No transactions</Text>
            <Text className="text-sm text-muted-foreground text-center mt-1">
              No {filter === 'in' ? 'incoming' : filter === 'out' ? 'outgoing' : ''} activity yet.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
