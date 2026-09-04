import { Text, View } from 'react-native';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BuildingIcon,
  FileTextIcon,
  ShoppingBagIcon,
} from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import type { Transaction } from '@/src/db/types';

cssInterop(ArrowDownLeftIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ArrowUpRightIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(BuildingIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(FileTextIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ShoppingBagIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

export function transactionIcon(type: string) {
  switch (type) {
    case 'deposit':
    case 'transfer_received':
      return { Icon: ArrowDownLeftIcon, incoming: true };
    case 'withdrawal':
      return { Icon: ArrowUpRightIcon, incoming: false };
    case 'merchant_payment':
      return { Icon: ShoppingBagIcon, incoming: false };
    case 'loan_repayment':
      return { Icon: FileTextIcon, incoming: false };
    default:
      return { Icon: ArrowUpRightIcon, incoming: false };
  }
}

export function relativeDay(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startToday - start) / 86400000);
  if (dayDiff === 0) return 'Today';
  if (dayDiff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatAmount(amount: number): string {
  const sign = amount >= 0 ? '+' : '-';
  const abs = Math.abs(amount).toLocaleString();
  return `${sign} ${abs} SSP`;
}

export function TransactionItem({ txn }: { txn: Transaction }) {
  const { Icon, incoming } = transactionIcon(txn.type);
  return (
    <View className="flex-row items-center gap-4 py-3.5">
      <View className={`w-11 h-11 rounded-2xl items-center justify-center ${incoming ? 'bg-emerald/15' : 'bg-red/10'}`}>
        <Icon size={20} className={incoming ? 'text-emerald' : 'text-red'} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {txn.title}
        </Text>
        <Text className="text-xs text-muted-foreground">{relativeDay(txn.created_at)}</Text>
      </View>
      <Text className={`text-base font-bold ${incoming ? 'text-emerald' : 'text-red'}`}>
        {formatAmount(Number(txn.amount))}
      </Text>
    </View>
  );
}

export function TransactionList({ items }: { items: Transaction[] }) {
  return (
    <View className="bg-card rounded-3xl px-5 divide-y divide-border">
      {items.map((txn) => (
        <TransactionItem key={txn.id} txn={txn} />
      ))}
    </View>
  );
}
