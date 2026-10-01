import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { C, R } from '@/lib/theme';
import type { Notice } from '@/lib/types';
import { Empty, ErrorBox, Loading } from '@/components/ui';

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notice[] | null>(null);
  const [error, setError] = useState(''), [refreshing, setRefreshing] = useState(false);
  const load = useCallback(() => { api<Notice[]>('/notifications', { auth: true }).then(setItems).catch(e => setError(e.message)).finally(() => setRefreshing(false)); }, []);
  useEffect(() => { load(); Notifications.setBadgeCountAsync(0).catch(() => undefined); }, [load]);

  const open = (n: Notice) => {
    if (!n.is_read) { setItems(list => list?.map(x => x.id === n.id ? { ...x, is_read: true } : x) ?? null); void api(`/notifications/${n.id}/read`, { method: 'PATCH', auth: true }).catch(() => undefined); }
    if (n.reference_type === 'PRODUCT' && n.reference_id) router.push({ pathname: '/products/[id]', params: { id: n.reference_id } });
    else if (n.reference_type === 'CHAT' && n.reference_id) router.push({ pathname: '/chat/[id]', params: { id: n.reference_id } });
  };
  const readAll = () => { setItems(list => list?.map(x => ({ ...x, is_read: true })) ?? null); void api('/notifications/read-all', { method: 'PATCH', auth: true }).catch(() => undefined); };

  if (!items) return error ? <ErrorBox message={error} onRetry={load} /> : <Loading />;
  return (
    <>
      <Stack.Screen options={{ headerRight: () => items.some(i => !i.is_read) ? <Text onPress={readAll} style={{ color: C.brand, fontWeight: '700' }}>Đọc hết</Text> : null }} />
      <FlatList data={items} keyExtractor={n => n.id} contentContainerStyle={{ padding: 12, gap: 8, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.brand} />}
        ListEmptyComponent={<Empty title="Chưa có thông báo" text="Các cập nhật về tin đăng, đơn hàng và tin nhắn sẽ hiện ở đây." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => open(item)} style={[st.item, !item.is_read && st.unread]}>
            {!item.is_read ? <View style={st.dot} /> : null}
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={st.title}>{item.title}</Text>
              <Text style={st.body}>{item.content}</Text>
              <Text style={st.time}>{timeAgo(item.created_at)}</Text>
            </View>
          </Pressable>
        )} />
    </>
  );
}

const st = StyleSheet.create({
  item: { flexDirection: 'row', gap: 10, backgroundColor: C.white, borderRadius: R.lg, padding: 14 },
  unread: { backgroundColor: '#EAF8F0', borderLeftWidth: 3, borderLeftColor: C.brand },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.brand, marginTop: 6 },
  title: { fontSize: 15, fontWeight: '700', color: C.ink },
  body: { fontSize: 14, color: C.text, lineHeight: 20 },
  time: { fontSize: 12, color: C.muted },
});
