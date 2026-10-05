import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { C, R } from '@/lib/theme';
import { AdminHeader } from '@/components/AdminHeader';
import { Empty, ErrorBox, Loading } from '@/components/ui';

type Notice = { id: string; type: string; title: string; content: string; reference_type: string | null; is_read: boolean; created_at: string };

export default function Notices() {
  const [items, setItems] = useState<Notice[] | null>(null);
  const [error, setError] = useState(''), [refreshing, setRefreshing] = useState(false);
  const load = useCallback(() => { api<Notice[]>('/notifications', { auth: true }).then(setItems).catch(e => setError(e.message)).finally(() => setRefreshing(false)); }, []);
  useFocusEffect(load);

  const open = (n: Notice) => {
    if (!n.is_read) { setItems(l => l?.map(x => x.id === n.id ? { ...x, is_read: true } : x) ?? null); void api(`/notifications/${n.id}/read`, { method: 'PATCH', auth: true }).catch(() => undefined); }
    if (n.type.includes('PHONE') || n.type.includes('IDENTITY')) router.push('/verify');
    else if (n.type.includes('LISTING') || n.type.includes('MODERATION')) router.push('/listings');
  };
  const readAll = () => { setItems(l => l?.map(x => ({ ...x, is_read: true })) ?? null); void api('/notifications/read-all', { method: 'PATCH', auth: true }).catch(() => undefined); };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <AdminHeader title="Thông báo" right={items?.some(i => !i.is_read) ? <Text onPress={readAll} style={{ color: C.brandDark, fontWeight: '800' }}>Đọc tất cả</Text> : null} />
      {!items ? (error ? <ErrorBox message={error} onRetry={load} /> : <Loading />) : (
        <FlatList data={items} keyExtractor={n => n.id} contentContainerStyle={{ padding: 14, gap: 10, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.brand} />}
          ListEmptyComponent={<Empty title="Chưa có thông báo" text="Yêu cầu xác minh và tin chờ duyệt sẽ báo ở đây." />}
          renderItem={({ item }) => (
            <Pressable onPress={() => open(item)} style={[st.item, !item.is_read && st.unread]}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={st.title}>{item.title}</Text>
                <Text style={st.body}>{item.content}</Text>
                <Text style={st.time}>{timeAgo(item.created_at)}</Text>
              </View>
            </Pressable>
          )} />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  item: { flexDirection: 'row', backgroundColor: C.white, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 14 },
  unread: { borderColor: '#9FD8BB', backgroundColor: '#F2FBF6' },
  title: { fontSize: 14.5, fontWeight: '800', color: C.ink },
  body: { fontSize: 13, color: C.text, lineHeight: 18 },
  time: { fontSize: 11.5, color: C.muted },
});
