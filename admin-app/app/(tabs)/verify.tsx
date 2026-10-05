import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';
import { useCounts } from '@/lib/counts';
import { timeAgo } from '@/lib/format';
import { C, R, shadow } from '@/lib/theme';
import { AdminHeader } from '@/components/AdminHeader';
import { ReviewActions } from '@/components/ReviewActions';
import { Empty, ErrorBox, Loading } from '@/components/ui';

type Row = { id: string; full_name?: string | null; email?: string | null; phone?: string | null; id_last4?: string | null; created_at: string };
type Images = { front?: string; back?: string; selfie?: string };

export default function Verify() {
  const [kind, setKind] = useState<'phone' | 'identity'>('phone');
  const [items, setItems] = useState<Row[] | null>(null);
  const [error, setError] = useState(''), [refreshing, setRefreshing] = useState(false), [busy, setBusy] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, Images>>({});
  const { reload } = useCounts();

  const load = useCallback((k = kind) => {
    setError('');
    const path = k === 'phone' ? '/admin/verifications/phone?status=PENDING' : '/admin/verifications?status=PENDING';
    api<{ items: Row[] }>(path, { auth: true }).then(r => setItems(r.items)).catch(e => setError(e.message)).finally(() => setRefreshing(false));
  }, [kind]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pick = (k: 'phone' | 'identity') => { setKind(k); setItems(null); load(k); };
  const review = async (r: Row, action: 'APPROVE' | 'REJECT', reason?: string) => {
    setBusy(r.id);
    try {
      const base = kind === 'phone' ? '/admin/verifications/phone/' : '/admin/verifications/';
      await api(base + r.id + '/review', { method: 'POST', auth: true, body: { action, reason } });
      setItems(list => list?.filter(x => x.id !== r.id) ?? null); reload();
    } catch (e) { Alert.alert('Chưa xử lý được', (e as Error).message); } finally { setBusy(null); }
  };
  const showImages = async (r: Row) => {
    if (images[r.id]) { setImages(m => { const n = { ...m }; delete n[r.id]; return n; }); return; }
    try { const d = await api<{ images: Images }>('/admin/verifications/' + r.id, { auth: true }); setImages(m => ({ ...m, [r.id]: d.images })); }
    catch (e) { Alert.alert('Chưa tải được ảnh', (e as Error).message); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <AdminHeader title="Duyệt xác minh" />
      <View style={st.seg}>
        {([['phone', 'Số điện thoại'], ['identity', 'CCCD']] as const).map(([k, label]) => (
          <Pressable key={k} onPress={() => pick(k)} style={[st.segItem, kind === k && st.segOn]}><Text style={[st.segText, kind === k && { color: C.white }]}>{label}</Text></Pressable>
        ))}
      </View>
      {!items ? (error ? <ErrorBox message={error} onRetry={() => load()} /> : <Loading />) : (
        <FlatList data={items} keyExtractor={i => i.id} contentContainerStyle={{ padding: 14, paddingTop: 4, gap: 12, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.brand} />}
          ListEmptyComponent={<Empty title="Không có yêu cầu nào đang chờ" text="Yêu cầu mới sẽ hiện ở đây và có thông báo đẩy." />}
          renderItem={({ item }) => (
            <View style={st.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={st.name}>{item.full_name || 'Người dùng'}</Text>
                  <Text style={st.meta}>Gửi {timeAgo(item.created_at)}{item.email ? ' · ' + item.email : ''}</Text>
                </View>
                <View style={st.pending}><Text style={st.pendingText}>Chờ duyệt</Text></View>
              </View>
              <View style={st.box}>
                {kind === 'phone' ? <Text style={st.boxText}>Số điện thoại: <Text style={{ fontWeight: '800' }}>{item.phone}</Text></Text>
                  : <Text style={st.boxText}>CCCD: <Text style={{ fontWeight: '800' }}>**** {item.id_last4 ?? ''}</Text>{item.phone ? '  ·  SĐT ' + item.phone : ''}</Text>}
              </View>
              {kind === 'identity' ? (
                <>
                  <Pressable onPress={() => showImages(item)}><Text style={st.link}>{images[item.id] ? 'Ẩn ảnh hồ sơ' : 'Xem ảnh hồ sơ'}</Text></Pressable>
                  {images[item.id] ? <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['front', 'back', 'selfie'] as const).map(k => images[item.id][k] ? <Image key={k} source={{ uri: images[item.id][k] }} style={st.img} contentFit="cover" /> : null)}
                  </View> : null}
                </>
              ) : null}
              <ReviewActions busy={busy === item.id} onApprove={() => review(item, 'APPROVE')} onReject={reason => review(item, 'REJECT', reason)} />
            </View>
          )} />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  seg: { flexDirection: 'row', gap: 8, padding: 14 },
  segItem: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: R.pill, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  segOn: { backgroundColor: C.brandDark, borderColor: C.brandDark },
  segText: { fontSize: 13.5, fontWeight: '700', color: C.text },
  card: { backgroundColor: C.white, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 14, gap: 10, ...shadow },
  name: { fontSize: 15, fontWeight: '800', color: C.ink },
  meta: { fontSize: 12, color: C.muted, marginTop: 2 },
  pending: { backgroundColor: '#FFF4DB', borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 },
  pendingText: { color: '#8A5A00', fontSize: 11.5, fontWeight: '800' },
  box: { backgroundColor: C.paper, borderRadius: R.md, padding: 12 },
  boxText: { fontSize: 14, color: C.ink },
  link: { color: C.brandDark, fontWeight: '700', fontSize: 13.5 },
  img: { flex: 1, height: 96, borderRadius: R.md, backgroundColor: C.paper },
});
