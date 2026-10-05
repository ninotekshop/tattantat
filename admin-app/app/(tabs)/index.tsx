import { useCallback, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight, ClipboardList, ExternalLink, Flag, ShieldCheck } from 'lucide-react-native';
import { SITE_URL } from '@/lib/api';
import { useCounts } from '@/lib/counts';
import { C, R, shadow } from '@/lib/theme';
import { AdminHeader } from '@/components/AdminHeader';

export default function Overview() {
  const { counts, reload } = useCounts();
  const [refreshing, setRefreshing] = useState(false);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  const items = [
    { label: 'Tin chờ duyệt', n: counts['tin-dang'] },
    { label: 'Xác minh SĐT / CCCD', n: counts['xac-minh'] },
    { label: 'Báo cáo vi phạm', n: counts.reports },
    { label: 'Đơn hàng mới (24 giờ)', n: counts['don-hang'] },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <AdminHeader />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); reload(); setTimeout(() => setRefreshing(false), 600); }} tintColor={C.brand} />}>
        <Text style={st.h}>Cần xử lý hôm nay</Text>
        <View style={st.grid}>
          {items.map(i => <View key={i.label} style={st.kpi}><Text style={st.kn}>{i.n}</Text><Text style={st.kl}>{i.label}</Text></View>)}
        </View>
        <Text style={st.h}>Lối tắt</Text>
        <View style={st.list}>
          <Row icon={<ShieldCheck size={22} color={C.brandDark} />} label="Duyệt xác minh" onPress={() => router.push('/verify')} />
          <Row icon={<ClipboardList size={22} color={C.brandDark} />} label="Duyệt tin đăng" onPress={() => router.push('/listings')} />
          <Row icon={<Flag size={22} color={C.brandDark} />} label="Báo cáo, đơn hàng, thanh toán (trang web quản trị)" onPress={() => void Linking.openURL(SITE_URL + '/adminttt')} last icon2 />
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, onPress, last, icon2 }: { icon: React.ReactNode; label: string; onPress: () => void; last?: boolean; icon2?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[st.row, !last && { borderBottomWidth: 1, borderBottomColor: C.line }]}>
      {icon}<Text style={st.rowText}>{label}</Text>{icon2 ? <ExternalLink size={18} color={C.muted} /> : <ChevronRight size={18} color={C.muted} />}
    </Pressable>
  );
}

const st = StyleSheet.create({
  h: { fontSize: 16, fontWeight: '800', color: C.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpi: { width: '47.5%', backgroundColor: C.white, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 14, gap: 6, ...shadow },
  kn: { fontSize: 28, fontWeight: '900', color: C.brandDark },
  kl: { fontSize: 12.5, color: C.text, fontWeight: '600' },
  list: { backgroundColor: C.white, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowText: { flex: 1, fontSize: 15, fontWeight: '600', color: C.ink },
});
