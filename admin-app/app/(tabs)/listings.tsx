import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { api, media } from '@/lib/api';
import { useCounts } from '@/lib/counts';
import { timeAgo, vnd } from '@/lib/format';
import { C, R, shadow } from '@/lib/theme';
import { AdminHeader } from '@/components/AdminHeader';
import { ReviewActions } from '@/components/ReviewActions';
import { Empty, ErrorBox, Loading } from '@/components/ui';

type Post = { id: string; title: string; price: string; image_url?: string | null; created_at: string; category_name?: string; seller_name?: string; description?: string | null };

export default function Listings() {
  const [items, setItems] = useState<Post[] | null>(null);
  const [error, setError] = useState(''), [refreshing, setRefreshing] = useState(false), [busy, setBusy] = useState<string | null>(null);
  const { reload } = useCounts();
  const load = useCallback(() => {
    setError('');
    api<Post[]>('/admin/posts?status=PENDING&limit=50', { auth: true }).then(setItems).catch(e => setError(e.message)).finally(() => setRefreshing(false));
  }, []);
  useFocusEffect(load);

  const act = async (p: Post, action: 'approve' | 'reject', reason?: string) => {
    setBusy(p.id);
    try {
      await api(`/admin/posts/${p.id}/${action}`, { method: 'POST', auth: true, body: action === 'reject' ? { reason } : {} });
      setItems(list => list?.filter(x => x.id !== p.id) ?? null); reload();
    } catch (e) { Alert.alert('Chưa xử lý được', (e as Error).message); } finally { setBusy(null); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <AdminHeader title="Tin chờ duyệt" />
      {!items ? (error ? <ErrorBox message={error} onRetry={load} /> : <Loading />) : (
        <FlatList data={items} keyExtractor={i => i.id} contentContainerStyle={{ padding: 14, gap: 12, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.brand} />}
          ListEmptyComponent={<Empty title="Không có tin nào chờ duyệt" text="Tin mới đăng sẽ hiện ở đây." />}
          renderItem={({ item }) => (
            <View style={st.card}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Image source={{ uri: media(item.image_url) }} style={st.img} contentFit="cover" />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text numberOfLines={2} style={st.title}>{item.title}</Text>
                  <Text style={st.price}>{vnd(item.price)}</Text>
                  <Text style={st.meta}>{item.category_name} · {item.seller_name}</Text>
                  <Text style={st.meta}>Đăng {timeAgo(item.created_at)}</Text>
                </View>
              </View>
              {item.description ? <Text numberOfLines={3} style={st.desc}>{item.description}</Text> : null}
              <ReviewActions approveLabel="Duyệt tin" busy={busy === item.id} onApprove={() => act(item, 'approve')} onReject={reason => act(item, 'reject', reason)} />
            </View>
          )} />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 12, gap: 10, ...shadow },
  img: { width: 88, height: 88, borderRadius: R.md, backgroundColor: C.brandSoft },
  title: { fontSize: 14.5, fontWeight: '700', color: C.ink, lineHeight: 19 },
  price: { fontSize: 15, fontWeight: '800', color: C.danger },
  meta: { fontSize: 12, color: C.muted },
  desc: { fontSize: 13, color: C.text, lineHeight: 18 },
});
