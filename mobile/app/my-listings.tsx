import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react-native';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { STATUS } from '@/lib/listing';
import { C, R, shadow } from '@/lib/theme';
import type { ListingSummary } from '@/lib/types';
import { Button, Empty, ErrorBox, Loading } from '@/components/ui';

export default function MyListings() {
  const [items, setItems] = useState<ListingSummary[] | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => { api<ListingSummary[]>('/listings/mine', { auth: true }).then(setItems).catch(e => setError(e.message)); }, []);
  useFocusEffect(load);

  const toggle = async (l: ListingSummary) => {
    if (!l.productId) return;
    const next = l.status === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN';
    try { await api(`/products/${l.productId}/status`, { method: 'PATCH', auth: true, body: { status: next } }); load(); }
    catch (e) { Alert.alert('Chưa đổi được trạng thái', (e as Error).message); }
  };
  const remove = (l: ListingSummary) => Alert.alert('Xóa tin đăng?', `“${l.title ?? 'Bản nháp'}” sẽ bị xóa và không thể khôi phục.`, [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Xóa', style: 'destructive', onPress: () => { api(`/listings/${l.id}`, { method: 'DELETE', auth: true }).then(load).catch(e => Alert.alert('Chưa xóa được', e.message)); } },
  ]);

  if (!items) return error ? <ErrorBox message={error} onRetry={load} /> : <Loading />;
  return (
    <FlatList data={items} keyExtractor={i => i.id} contentContainerStyle={{ padding: 12, gap: 10, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={C.brand} />}
      ListEmptyComponent={<Empty title="Bạn chưa có tin đăng nào" text="Đăng tin miễn phí chỉ trong vài phút." action={<Button title="Đăng tin ngay" onPress={() => router.push('/sell')} style={{ marginTop: 12, minWidth: 200 }} />} />}
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
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: R.lg, padding: 14, ...shadow },
  title: { fontSize: 16, fontWeight: '700', color: C.ink },
  badge: { borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  time: { color: C.muted, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 18, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line },
  act: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actText: { color: C.brand, fontWeight: '700' },
});
