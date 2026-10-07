import { memo, useState } from 'react';
import { Alert, Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BadgeCheck, EyeOff, Flag, Heart, MapPin, MessageCircle, MoreHorizontal, PlayCircle, Share2 } from 'lucide-react-native';
import { SITE_URL, api, media } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useFavorites } from '@/lib/favorites';
import { useHiddenProducts } from '@/lib/hidden';
import { vnd, timeAgo } from '@/lib/format';
import { C, R, shadow } from '@/lib/theme';
import { Avatar } from '@/components/ui';
import type { Product } from '@/lib/types';

const REASONS: [string, string][] = [['FRAUD', 'Nghi lừa đảo'], ['SPAM', 'Tin rác / trùng lặp'], ['PROHIBITED', 'Hàng cấm / vi phạm quy định'], ['ABUSE', 'Nội dung xúc phạm'], ['OTHER', 'Lý do khác']];

export const ProductCard = memo(function ProductCard({ p, width }: { p: Product; width: number }) {
  const { session } = useAuth();
  const { isFav, toggle } = useFavorites();
  const { isHidden, hide } = useHiddenProducts();
  const [menu, setMenu] = useState(false), [busy, setBusy] = useState(false);
  const fav = isFav(p.id);
  const mine = !!session && session.user.id === p.sellerId;
  if (isHidden(p.id)) return null;

  const needLogin = () => router.push('/login');
  const chat = async () => {
    if (!session) return needLogin();
    if (busy) return;
    setBusy(true);
    try { const c = await api<{ id: string }>('/chats', { method: 'POST', auth: true, body: { productId: p.id } }); router.push({ pathname: '/chat/[id]', params: { id: c.id } }); }
    catch (e) { Alert.alert('Chưa mở được tin nhắn', (e as Error).message); }
    finally { setBusy(false); }
  };
  const share = () => { Share.share({ message: `${p.title}\n${SITE_URL}/products/${p.id}`, url: `${SITE_URL}/products/${p.id}` }).catch(() => undefined); };
  const report = () => {
    if (!session) return needLogin();
    Alert.alert('Báo cáo tin đăng', 'Chọn lý do báo cáo', [
      ...REASONS.map(([reason, label]) => ({ text: label, onPress: () => { api('/reports', { method: 'POST', auth: true, body: { productId: p.id, reason } }).then(() => Alert.alert('Đã gửi báo cáo', 'Cảm ơn bạn! Đội ngũ Tất Tần Tật sẽ xem xét sớm.')).catch(e => Alert.alert('Chưa gửi được', (e as Error).message)); } })),
      { text: 'Hủy', style: 'cancel' as const },
    ]);
  };
  const pick = (fn: () => void) => () => { setMenu(false); setTimeout(fn, 150); };

  return (
    <>
      <Pressable onPress={() => router.push({ pathname: '/products/[id]', params: { id: p.id } })} style={({ pressed }) => [st.card, { width }, pressed && { opacity: 0.9 }]}>
        <View>
          <Image source={{ uri: media(p.imageUrl || p.images?.[0]) }} style={{ width, height: width, backgroundColor: C.paper }} contentFit="cover" transition={150} placeholder={require('../../assets/splash-icon.png')} placeholderContentFit="contain" />
          {p.hasVideo ? <View style={st.video}><PlayCircle size={18} color={C.white} /></View> : null}
          <Pressable accessibilityLabel={fav ? 'Bỏ lưu tin' : 'Lưu tin'} hitSlop={8} onPress={() => void toggle(p.id)} style={st.heart}>
            <Heart size={18} color={fav ? C.danger : C.ink} fill={fav ? C.danger : 'none'} />
          </Pressable>
        </View>
        <View style={{ padding: 10, gap: 4 }}>
          <Text numberOfLines={2} style={st.title}>{p.title}</Text>
          <Text style={st.price}>{vnd(p.price, p.priceMode)}</Text>
          <View style={st.row}><MapPin size={12} color={C.muted} /><Text numberOfLines={1} style={st.meta}>{p.location}</Text></View>
          <View style={st.row}>
            <Avatar name={p.sellerName} url={p.sellerAvatar ? media(p.sellerAvatar) : null} size={18} />
            <Text numberOfLines={1} style={[st.meta, { flex: 0, maxWidth: '50%', color: C.text }]}>{p.sellerName}</Text>
            {p.sellerVerified ? <BadgeCheck size={12} color={C.brand} /> : null}
            <Text numberOfLines={1} style={st.meta}>· {timeAgo(p.postedAt)}</Text>
          </View>
        </View>
        <View style={st.footer}>
          {mine ? <View style={{ flex: 1 }} /> : (
            <Pressable accessibilityLabel="Nhắn tin với người bán" hitSlop={6} onPress={chat} style={st.msg}>
              <MessageCircle size={15} color={C.text} /><Text style={st.msgText}>Nhắn tin</Text>
            </Pressable>
          )}
          <Pressable accessibilityLabel="Tùy chọn" hitSlop={8} onPress={() => setMenu(true)} style={st.more}>
            <MoreHorizontal size={20} color={C.muted} />
          </Pressable>
        </View>
      </Pressable>

      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={st.backdrop} onPress={() => setMenu(false)}>
          <View style={st.sheet}>
            <Text numberOfLines={1} style={st.sheetTitle}>{p.title}</Text>
            <Item icon={<Heart size={20} color={C.ink} fill={fav ? C.danger : 'none'} />} label={fav ? 'Bỏ lưu tin' : 'Lưu tin đăng'} onPress={pick(() => void toggle(p.id))} />
            <Item icon={<Share2 size={20} color={C.ink} />} label="Chia sẻ tin" onPress={pick(share)} />
            {!mine ? <Item icon={<EyeOff size={20} color={C.ink} />} label="Không quan tâm" onPress={pick(() => hide(p.id))} /> : null}
            {!mine ? <Item icon={<Flag size={20} color={C.danger} />} label="Báo cáo vi phạm" danger onPress={pick(report)} /> : null}
            <Pressable onPress={() => setMenu(false)} style={st.cancel}><Text style={st.cancelText}>Đóng</Text></Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
});

function Item({ icon, label, onPress, danger }: { icon: React.ReactNode; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.item, pressed && { backgroundColor: C.paper }]}>
      {icon}<Text style={[st.itemText, danger && { color: C.danger }]}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: R.md, overflow: 'hidden', ...shadow },
  title: { fontSize: 14, fontWeight: '600', color: C.ink, minHeight: 36 },
  price: { fontSize: 15, fontWeight: '800', color: C.danger },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12, color: C.muted, flex: 1 },
  heart: { position: 'absolute', right: 6, top: 6, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.92)', alignItems: 'center', justifyContent: 'center' },
  video: { position: 'absolute', left: 6, top: 6, backgroundColor: 'rgba(0,0,0,.45)', borderRadius: 99, padding: 3 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.line, paddingHorizontal: 10, height: 38 },
  msg: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  msgText: { fontSize: 13, fontWeight: '700', color: C.text },
  more: { paddingHorizontal: 4, height: 38, justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 14, paddingBottom: 22, paddingHorizontal: 8 },
  sheetTitle: { fontSize: 13.5, color: C.muted, textAlign: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, height: 52, borderRadius: R.md },
  itemText: { fontSize: 16, fontWeight: '600', color: C.ink },
  cancel: { marginTop: 6, height: 50, borderRadius: R.md, backgroundColor: '#F1F5F4', alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 16, fontWeight: '800', color: C.ink },
});
