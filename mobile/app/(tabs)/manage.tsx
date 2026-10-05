import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/format';
import { STATUS } from '@/lib/listing';
import { C, R, shadow } from '@/lib/theme';
import type { ListingSummary } from '@/lib/types';
import { Button, Empty, ErrorBox, Loading } from '@/components/ui';
import { LoginRequired } from '@/components/LoginRequired';

const FILTERS = [
  { key: 'ALL', label: 'Tất cả' }, { key: 'ACTIVE', label: 'Đang hiển thị' }, { key: 'PENDING_REVIEW', label: 'Chờ duyệt' },
  { key: 'HIDDEN', label: 'Đã ẩn' }, { key: 'DRAFT', label: 'Bản nháp' },
] as const;

export default function Manage() {
  const { session } = useAuth();
  const [items, setItems] = useState<ListingSummary[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('ALL');
  const load = useCallback(() => { if (!session) return; api<ListingSummary[]>('/listings/mine', { auth: true }).then(setItems).catch(e => setError(e.message)); }, [session]);
  useFocusEffect(load);

  const shown = useMemo(() => (items ?? []).filter(i => filter === 'ALL' || i.status === filter), [items, filter]);
  const toggle = async (l: ListingSummary) => {
    if (!l.productId) return;
    try { await api(`/products/${l.productId}/status`, { method: 'PATCH', auth: true, body: { status: l.status === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN' } }); load(); }
    catch (e) { Alert.alert('Chưa đổi được trạng thái', (e as Error).message); }
  };
  const remove = (l: ListingSummary) => Alert.alert('Xóa tin đăng?', `“${l.title ?? 'Bản nháp'}” sẽ bị xóa và không thể khôi phục.`, [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Xóa', style: 'destructive', onPress: () => { api(`/listings/${l.id}`, { method: 'DELETE', auth: true }).then(load).catch(e => Alert.alert('Chưa xóa được', e.message)); } },
  ]);

  if (!session) return <LoginRequired text="Đăng nhập để quản lý các tin đã đăng của bạn." />;
  if (!items) return error ? <ErrorBox message={error} onRetry={load} /> : <Loading />;
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 8 }}>
          {FILTERS.map(f => (
            <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[st.chip, filter === f.key && st.chipOn]}>
              <Text style={[st.chipText, filter === f.key && { color: C.white }]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <FlatList data={shown} keyExtractor={i => i.id} contentContainerStyle={{ padding: 12, paddingTop: 0, gap: 10, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={C.brand} />}
        ListEmptyComponent={<Empty title="Chưa có tin nào" text="Đăng tin miễn phí chỉ trong vài phút." action={<Button title="Đăng tin ngay" onPress={() => router.push('/sell')} style={{ marginTop: 12, minWidth: 200 }} />} />}
        renderItem={({ item }) => {
          const s = STATUS[item.status] ?? { label: item.status, color: C.muted };
          return (
            <View style={st.card}>
              <Pressable onPress={() => item.productId && item.status !== 'DRAFT' ? router.push({ pathname: '/products/[id]', params: { id: item.productId } }) : router.push({ pathname: '/sell', params: { id: item.id } })}>
                <Text numberOfLines={2} style={st.title}>{item.title || 'Bản nháp chưa có tiêu đề'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <View style={[st.badge, { backgroundColor: s.color + '1A' }]}><Text style={[st.badgeText, { color: s.color }]}>{s.label}</Text></View>
                  <Text style={st.time}>Cập nhật {timeAgo(item.updatedAt)}</Text>
                </View>
              </Pressable>
              <View style={st.actions}>
                <Pressable onPress={() => router.push({ pathname: '/sell', params: { id: item.id } })} style={st.act}><Pencil size={16} color={C.brand} /><Text style={st.actText}>Sửa</Text></Pressable>
                {item.productId && (item.status === 'ACTIVE' || item.status === 'HIDDEN') ? <Pressable onPress={() => toggle(item)} style={st.act}>
                  {item.status === 'HIDDEN' ? <Eye size={16} color={C.brand} /> : <EyeOff size={16} color={C.brand} />}<Text style={st.actText}>{item.status === 'HIDDEN' ? 'Hiện tin' : 'Ẩn tin'}</Text>
                </Pressable> : null}
                <Pressable onPress={() => remove(item)} style={st.act}><Trash2 size={16} color={C.danger} /><Text style={[st.actText, { color: C.danger }]}>Xóa</Text></Pressable>
              </View>
            </View>
          );
        }} />
    </View>
  );
}

const st = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.pill, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  chipOn: { backgroundColor: C.brand, borderColor: C.brand },
  chipText: { fontSize: 13, fontWeight: '700', color: C.text },
  card: { backgroundColor: C.white, borderRadius: R.lg, padding: 14, ...shadow },
  title: { fontSize: 16, fontWeight: '700', color: C.ink },
  badge: { borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  time: { color: C.muted, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 18, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line },
  act: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actText: { color: C.brand, fontWeight: '700' },
});
