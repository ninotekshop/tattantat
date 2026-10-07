import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';
import { C, R, shadow } from '@/lib/theme';
import { ErrorBox, Loading } from '@/components/ui';

type Overview = { balance: string; subscription: { name: string; endsAt: string | null } | null };
type Summary = { coinBalance: number; totalDeposited: number; totalSpent: number };
type Tx = { id: string; type: string; amount: string; description: string | null; createdAt: string; direction: 'CREDIT' | 'DEBIT'; amountVnd: string | null };
const PLAN_LABELS: Record<string, string> = { free: 'Free (Miễn phí)', 'miễn phí': 'Free (Miễn phí)', pro: 'Pro (Chuyên nghiệp)', business: 'Business (Kinh doanh)', enterprise: 'Enterprise (Cao cấp)' };
const planLabel = (n: string) => PLAN_LABELS[n.trim().toLowerCase()] ?? n;
const dateVi = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');
const dateTimeVi = (iso: string) => new Date(iso).toLocaleString('vi-VN');
const coin = (v: number | string) => (Number(v) || 0).toLocaleString('vi-VN') + ' TTTCoin';
const TX_LABEL: Record<string, string> = { TOPUP: 'Nạp TTTCoin', SPEND: 'Thanh toán bằng TTTCoin', REFUND: 'Hoàn', ADJUST: 'Điều chỉnh', BONUS: 'Khuyến mãi' };

/** Xem Ví TTTCoin: số dư, tổng đã nạp/đã dùng, lịch sử. Không có thao tác nạp, link hay hướng dẫn thanh toán trong app (quy định Google Play / App Store). */
export default function Wallet() {
  const [data, setData] = useState<Overview | null>(null);
  const [sum, setSum] = useState<Summary | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setError('');
    Promise.all([api<Overview>('/billing/overview', { auth: true }), api<Summary>('/wallet', { auth: true }), api<{ items: Tx[] }>('/wallet/transactions?limit=30', { auth: true })])
      .then(([o, s, t]) => { setData(o); setSum(s); setTxs(t.items); }).catch(e => setError((e as Error).message));
  }, []);
  useFocusEffect(load);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!data || !sum) return <Loading />;
  return (
    <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
      <View style={st.card}>
        <Text style={st.label}>Ví TTTCoin</Text>
        <Text style={st.big}>{coin(sum.coinBalance)}</Text>
        <Text style={st.sub}>Đã nạp: {coin(sum.totalDeposited)}</Text>
        <Text style={st.sub}>Đã sử dụng: {coin(sum.totalSpent)}</Text>
        <Text style={[st.sub, { marginTop: 8, color: C.muted, fontSize: 12 }]}>TTTCoin là đơn vị tín dụng nội bộ của Tất Tần Tật, dùng để thanh toán các gói và dịch vụ trên nền tảng.</Text>
      </View>
      <View style={st.card}>
        <Text style={st.label}>Gói đang sử dụng</Text>
        <Text style={st.plan}>{data.subscription ? planLabel(data.subscription.name) : 'Free (Miễn phí)'}</Text>
        {data.subscription?.endsAt ? <Text style={st.sub}>Hết hạn: {dateVi(data.subscription.endsAt)}</Text> : null}
      </View>
      <View style={st.card}>
        <Text style={st.label}>Lịch sử giao dịch</Text>
        {txs.length === 0 ? <Text style={st.sub}>Chưa có giao dịch nào.</Text> : txs.map(t => {
          const credit = t.direction === 'CREDIT';
          return (
            <View key={t.id} style={st.tx}>
              <View style={[st.dot, { backgroundColor: credit ? C.brandSoft : C.dangerSoft }]}><Text style={{ color: credit ? C.brandDark : C.danger, fontWeight: '800' }}>{credit ? '↓' : '↑'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: C.ink }}>{TX_LABEL[t.type] ?? t.type}{t.amountVnd ? ` · ${(Number(t.amountVnd) || 0).toLocaleString('vi-VN')}đ` : ''}</Text>
                {t.description ? <Text numberOfLines={1} style={{ color: C.muted, fontSize: 12 }}>{t.description}</Text> : null}
                <Text style={{ color: C.muted, fontSize: 12 }}>Thành công · {dateTimeVi(t.createdAt)}</Text>
              </View>
              <Text style={{ fontWeight: '800', color: credit ? C.brandDark : C.danger }}>{credit ? '+' : '-'}{coin(Math.abs(Number(t.amount)))}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: R.lg, padding: 18, gap: 4, ...shadow },
  label: { color: C.muted, fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  big: { color: C.brand, fontSize: 28, fontWeight: '800' },
  plan: { color: C.ink, fontSize: 20, fontWeight: '800' },
  sub: { color: C.text, marginTop: 2 },
  tx: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.line },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
