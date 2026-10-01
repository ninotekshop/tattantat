import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Flag, Heart, MapPin, MessageCircle, Share2, ShieldCheck, Clock } from 'lucide-react-native';
import { api, media, SITE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { timeAgo, vnd } from '@/lib/format';
import { C, R, shadow } from '@/lib/theme';
import type { Product } from '@/lib/types';
import { Avatar, Button, ErrorBox, Loading } from '@/components/ui';

const CONDITION: Record<string, string> = { NEW: 'Mới', LIKE_NEW: 'Như mới', USED_GOOD: 'Đã dùng, còn tốt', USED_FAIR: 'Đã dùng, có hao mòn', FOR_PARTS: 'Cần sửa / lấy linh kiện' };
const REASONS: [string, string][] = [['FRAUD', 'Lừa đảo'], ['PROHIBITED', 'Hàng cấm'], ['SPAM', 'Tin rác / trùng lặp'], ['OTHER', 'Lý do khác']];

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const [p, setP] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError('');
    api<Product>(`/products/${id}`).then(setP).catch(e => setError(e.message));
  }, [id]);
  useEffect(load, [load]);
  useEffect(() => {
    if (!session) { setFav(false); return; }
    api<Product[]>('/favorites', { auth: true }).then(list => setFav(list.some(x => x.id === id))).catch(() => undefined);
  }, [session, id]);

  const needLogin = () => { router.push('/login'); };
  const toggleFav = async () => {
    if (!session) return needLogin();
    const next = !fav; setFav(next);
    try { await api(`/favorites/${id}`, { method: next ? 'POST' : 'DELETE', auth: true }); }
    catch (e) { setFav(!next); Alert.alert('Chưa lưu được', (e as Error).message); }
  };
  const chat = async () => {
    if (!session) return needLogin();
    setBusy(true);
    try { const c = await api<{ id: string }>('/chats', { method: 'POST', auth: true, body: { productId: id } }); router.push({ pathname: '/chat/[id]', params: { id: c.id } }); }
    catch (e) { Alert.alert('Chưa mở được tin nhắn', (e as Error).message); }
    finally { setBusy(false); }
  };
  const report = () => {
    if (!session) return needLogin();
    Alert.alert('Báo cáo tin đăng', 'Chọn lý do báo cáo', [
      ...REASONS.map(([reason, label]) => ({ text: label, onPress: () => { api('/reports', { method: 'POST', auth: true, body: { productId: id, reason } }).then(() => Alert.alert('Đã gửi báo cáo', 'Cảm ơn bạn! Đội ngũ Tất Tần Tật sẽ xem xét sớm.')).catch(e => Alert.alert('Chưa gửi được', e.message)); } })),
      { text: 'Hủy', style: 'cancel' as const },
    ]);
  };

  if (error) return <SafeAreaView style={{ flex: 1 }}><ErrorBox message={error} onRetry={load} /></SafeAreaView>;
  if (!p) return <Loading />;
  const images = (p.images?.length ? p.images : [p.imageUrl]).filter(Boolean).map(media);
  const mine = session?.user.id === p.sellerId;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Stack.Screen options={{
        headerRight: () => <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable hitSlop={8} style={st.round} onPress={() => Share.share({ message: `${p.title} — ${SITE_URL}/products/${p.id}` })}><Share2 size={19} color={C.ink} /></Pressable>
          <Pressable hitSlop={8} style={st.round} onPress={toggleFav}><Heart size={19} color={fav ? C.danger : C.ink} fill={fav ? C.danger : 'transparent'} /></Pressable>
        </View>,
      }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View>
          <FlatList data={images.length ? images : ['']} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={(u, i) => u + i}
            onMomentumScrollEnd={e => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => <Image source={{ uri: item }} style={{ width, height: width, backgroundColor: '#E2E8F0' }} contentFit="cover" />} />
          {images.length > 1 ? <View style={st.counter}><Text style={{ color: C.white, fontWeight: '700', fontSize: 12 }}>{index + 1}/{images.length}</Text></View> : null}
        </View>
        <View style={st.block}>
          <Text style={st.title}>{p.title}</Text>
          <Text style={st.price}>{vnd(p.price, p.priceMode)}</Text>
          <View style={st.metaRow}><MapPin size={15} color={C.muted} /><Text style={st.meta}>{p.location}</Text></View>
          <View style={st.metaRow}><Clock size={15} color={C.muted} /><Text style={st.meta}>Đăng {timeAgo(p.postedAt)}</Text></View>
          {p.condition ? <View style={st.tag}><Text style={st.tagText}>{CONDITION[p.condition] ?? p.condition}</Text></View> : null}
        </View>
        <View style={st.block}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={p.sellerName} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', fontSize: 16, color: C.ink }}>{p.sellerName}</Text>
              <Text style={{ color: C.muted, fontSize: 13 }}>{p.sellerVerified ? 'Đã xác thực danh tính' : 'Người bán'}</Text>
            </View>
          </View>
        </View>
        {p.description ? <View style={st.block}>
          <Text style={st.h}>Mô tả chi tiết</Text>
          <Text style={st.desc} selectable>{p.description}</Text>
        </View> : null}
        <View style={[st.block, { flexDirection: 'row', gap: 10, backgroundColor: C.brandSoft }]}>
          <ShieldCheck size={22} color={C.brand} />
          <Text style={{ flex: 1, color: C.brandDark, lineHeight: 20 }}>Thanh toán qua Tất Tần Tật để được giữ tiền an toàn. Không chuyển khoản trước cho người lạ.</Text>
        </View>
        {!mine ? <Pressable onPress={report} style={st.report}><Flag size={16} color={C.muted} /><Text style={{ color: C.muted }}>Báo cáo tin đăng này</Text></Pressable> : null}
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={st.footer}>
        {mine
          ? <Button style={{ flex: 1 }} title="Quản lý tin đăng" onPress={() => router.push('/my-listings')} />
          : <Button style={{ flex: 1 }} title="Nhắn tin với người bán" loading={busy} icon={<MessageCircle size={20} color={C.white} />} onPress={chat} />}
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  round: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,.92)', alignItems: 'center', justifyContent: 'center' },
  counter: { position: 'absolute', right: 12, bottom: 12, backgroundColor: 'rgba(0,0,0,.5)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  block: { backgroundColor: C.white, marginHorizontal: 12, marginTop: 12, borderRadius: R.lg, padding: 16, gap: 8, ...shadow },
  title: { fontSize: 20, fontWeight: '800', color: C.ink, lineHeight: 26 },
  price: { fontSize: 22, fontWeight: '800', color: C.danger },
  metaRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  meta: { color: C.muted, fontSize: 14, flex: 1 },
  tag: { alignSelf: 'flex-start', backgroundColor: C.brandSoft, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { color: C.brandDark, fontWeight: '700', fontSize: 13 },
  h: { fontSize: 16, fontWeight: '800', color: C.ink },
  desc: { fontSize: 15, lineHeight: 23, color: C.text },
  report: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', padding: 18 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.white, paddingHorizontal: 16, paddingTop: 10, flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line },
});
