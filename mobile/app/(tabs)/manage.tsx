import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, useWindowDimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { ExternalLink, Eye, EyeOff, FileText, Pencil, Trash2 } from 'lucide-react-native';
import { api, media } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { vnd } from '@/lib/format';
import { STATUS } from '@/lib/listing';
import { C, R, shadow } from '@/lib/theme';
import type { ListingSummary } from '@/lib/types';
import { Button, Empty, ErrorBox, Loading } from '@/components/ui';
import { LoginRequired } from '@/components/LoginRequired';

const FILTERS = [
  { key: 'ALL', label: 'Tất cả' }, { key: 'ACTIVE', label: 'Đang hiển thị' }, { key: 'PENDING_REVIEW', label: 'Chờ duyệt' },
  { key: 'HIDDEN', label: 'Đã ẩn' }, { key: 'DRAFT', label: 'Bản nháp' },
] as const;

type Row = { id: string; title: string; price?: string; priceMode?: string; imageUrl?: string | null; status: string; postedAt?: string | null; productId?: string; listingId?: string | null; draft?: boolean };

export default function Manage() {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('ALL');
  const load = useCallback(() => {
    if (!session) return;
    Promise.all([api<any[]>('/products/mine', { auth: true }), api<ListingSummary[]>('/listings/mine', { auth: true })]).then(([prods, lists]) => {
      const rows: Row[] = [
        ...lists.filter(d => !d.productId).map(d => ({ id: d.id, title: d.title || 'Bản nháp chưa có tiêu đề', status: 'DRAFT', postedAt: d.updatedAt, listingId: d.id, draft: true })),
        ...prods.map(p => ({ id: p.id, title: p.title, price: String(p.price ?? '').replace(/\.0+$/, ''), priceMode: p.priceMode, imageUrl: p.imageUrl, status: p.status || '', postedAt: p.postedAt, productId: p.id, listingId: p.listingId })),
      ];
      setItems(rows);
    }).catch(e => setError(e.message));
  }, [session]);
  useFocusEffect(load);

  const shown = useMemo(() => (items ?? []).filter(i => filter === 'ALL' || i.status === filter), [items, filter]);
  const cardW = (width - 12 * 2 - 10) / 2;
  const toggle = async (l: Row) => {
    try { await api(`/products/${l.id}/status`, { method: 'PATCH', auth: true, body: { status: l.status === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN' } }); load(); }
    catch (e) { Alert.alert('Chưa đổi được trạng thái', (e as Error).message); }
  };
  const remove = (l: Row) => Alert.alert('Xóa bản nháp?', `“${l.title}” sẽ bị xóa và không thể khôi phục.`, [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Xóa', style: 'destructive', onPress: () => { api(`/listings/${l.id}`, { method: 'DELETE', auth: true }).then(load).catch(e => Alert.alert('Chưa xóa được', e.message)); } },
  ]);
  const edit = (l: Row) => router.push({ pathname: '/sell', params: { id: l.listingId! } });

  if (!session) return <LoginRequired text="Đăng nhập để quản lý các tin đã đăng của bạn." />;
  if (!items) return error ? <ErrorBox message={error} onRetry={load} /> : <Loading />;
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={st.bar}><Text style={st.barTitle}>Tin đã đăng</Text><View style={st.count}><Text style={st.countText}>{items.length}</Text></View></View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 8 }}>
          {FILTERS.map(f => (
            <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[st.chip, filter === f.key && st.chipOn]}>
              <Text style={[st.chipText, filter === f.key && { color: C.white }]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <FlatList data={shown} numColumns={2} key="grid" keyExtractor={i => i.id} columnWrapperStyle={{ gap: 10 }} contentContainerStyle={{ padding: 12, paddingTop: 0, gap: 10, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={C.brand} />}
        ListEmptyComponent={<Empty title="Chưa có tin nào" text="Đăng tin miễn phí chỉ trong vài phút." action={<Button title="Đăng tin ngay" onPress={() => router.push('/sell')} style={{ marginTop: 12, minWidth: 200 }} />} />}
        renderItem={({ item }) => {
          const s = STATUS[item.status] ?? { label: item.status, color: C.muted };
          const canToggle = !!item.productId && (item.status === 'ACTIVE' || item.status === 'HIDDEN');
          return (
            <View style={[st.card, { width: cardW }]}>
              <Pressable onPress={() => item.draft ? edit(item) : router.push({ pathname: '/products/[id]', params: { id: item.id } })}>
                <View style={st.thumb}>
                  {item.imageUrl ? <Image source={{ uri: media(item.imageUrl) }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <FileText size={30} color={C.muted} />}
                  <View style={[st.chipS, { backgroundColor: s.color }]}><Text style={st.chipSText}>{s.label}</Text></View>
                </View>
                <View style={st.body}>
                  <Text numberOfLines={2} style={st.title}>{item.title}</Text>
                  {!item.draft ? <Text style={st.price}>{vnd(item.price, item.priceMode)}</Text> : null}
                  {item.postedAt ? <Text style={st.date}>{item.draft ? 'Cập nhật' : 'Đăng'} {new Date(item.postedAt).toLocaleDateString('vi-VN')}</Text> : null}
                </View>
              </Pressable>
              <View style={st.actions}>
                {item.status === 'ACTIVE' ? <Pressable onPress={() => router.push({ pathname: '/products/[id]', params: { id: item.id } })} style={st.act}><ExternalLink size={13} color={C.brand} /><Text style={st.actText}>Xem</Text></Pressable> : null}
                {item.listingId ? <Pressable onPress={() => edit(item)} style={st.act}><Pencil size={13} color={C.brand} /><Text style={st.actText}>Sửa</Text></Pressable> : null}
                {canToggle ? <Pressable onPress={() => toggle(item)} style={st.act}>{item.status === 'ACTIVE' ? <EyeOff size={13} color={C.brand} /> : <Eye size={13} color={C.brand} />}<Text style={st.actText}>{item.status === 'ACTIVE' ? 'Ẩn' : 'Hiện'}</Text></Pressable> : null}
                {item.draft ? <Pressable onPress={() => remove(item)} style={st.act}><Trash2 size={13} color={C.danger} /><Text style={[st.actText, { color: C.danger }]}>Xóa</Text></Pressable> : null}
              </View>
            </View>
          );
        }} />
    </View>
  );
}

const st = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 10, backgroundColor: C.paper },
  barTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  count: { backgroundColor: C.brandSoft, borderRadius: R.pill, paddingHorizontal: 9, paddingVertical: 2 },
  countText: { color: C.brandDark, fontWeight: '800', fontSize: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.pill, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  chipOn: { backgroundColor: C.brand, borderColor: C.brand },
  chipText: { fontSize: 13, fontWeight: '700', color: C.text },
  card: { backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.line },
  thumb: { height: 120, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  chipS: { position: 'absolute', top: 8, left: 8, borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 2 },
  chipSText: { color: C.white, fontSize: 11, fontWeight: '700' },
  body: { padding: 10, gap: 3 },
  title: { fontSize: 14, fontWeight: '700', color: C.ink, lineHeight: 19, minHeight: 38 },
  price: { fontSize: 15, fontWeight: '800', color: C.brand },
  date: { fontSize: 12, color: C.muted },
  actions: { flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingBottom: 10 },
  act: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.line },
  actText: { color: C.brand, fontWeight: '700', fontSize: 12.5 },
});
