import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';
import { vnd } from '@/lib/format';
import { C, R, shadow } from '@/lib/theme';
import { ErrorBox, Loading } from '@/components/ui';

type Overview = { balance: string; subscription: { name: string; endsAt: string | null } | null };
const PLAN_LABELS: Record<string, string> = { free: 'Free (Miễn phí)', 'miễn phí': 'Free (Miễn phí)', pro: 'Pro (Chuyên nghiệp)', business: 'Business (Kinh doanh)', enterprise: 'Enterprise (Cao cấp)' };
const planLabel = (n: string) => PLAN_LABELS[n.trim().toLowerCase()] ?? n;
const dateVi = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

/** Chỉ xem: số dư và gói đang dùng. Ứng dụng không có thao tác nạp tiền hay mua gói. */
export default function Wallet() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => { setError(''); api<Overview>('/billing/overview', { auth: true }).then(setData).catch(e => setError((e as Error).message)); }, []);
  useFocusEffect(load);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!data) return <Loading />;
  return (
    <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
      <View style={st.card}>
        <Text style={st.label}>Số dư tài khoản</Text>
        <Text style={st.big}>{vnd(data.balance)}</Text>
      </View>
      <View style={st.card}>
        <Text style={st.label}>Gói đang sử dụng</Text>
        <Text style={st.plan}>{data.subscription ? planLabel(data.subscription.name) : 'Free (Miễn phí)'}</Text>
        {data.subscription?.endsAt ? <Text style={st.sub}>Hết hạn: {dateVi(data.subscription.endsAt)}</Text> : null}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: R.lg, padding: 18, gap: 4, ...shadow },
  label: { color: C.muted, fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  big: { color: C.brand, fontSize: 30, fontWeight: '800' },
  plan: { color: C.ink, fontSize: 20, fontWeight: '800' },
  sub: { color: C.text, marginTop: 2 },
});
