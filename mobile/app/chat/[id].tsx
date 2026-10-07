import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Copy, ImagePlus, MapPin, Send, ShieldCheck, Trash2, TriangleAlert, Undo2, Video, X } from 'lucide-react-native';
import { ApiError, api, media, uploadMany } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { uid, vnd } from '@/lib/format';
import { C, R } from '@/lib/theme';
import type { Attachment, Chat, Message } from '@/lib/types';
import { Loading } from '@/components/ui';
import TrustBadge from '@/components/TrustBadge';

const time = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const FLAG_TEXT: Record<string, string> = { ADVANCE_PAYMENT: 'yêu cầu chuyển khoản/đặt cọc trước', OFF_PLATFORM: 'mời liên hệ ngoài Tất Tần Tật', PHONE: 'có số điện thoại', LINK: 'có đường link', BANK_ACCOUNT: 'có số tài khoản ngân hàng', OTP_REQUEST: 'hỏi mã OTP / thông tin cá nhân' };
const QUICK_BUYER = ['Sản phẩm còn không bạn?', 'Bạn có thể bớt giá được không?', 'Sản phẩm có lỗi gì không bạn?', 'Mình đặt mua qua Tất Tần Tật được không?'];
const QUICK_SELLER = ['Chào bạn, hàng vẫn còn nhé.', 'Bạn muốn xem hàng vào lúc nào?', 'Giá này đã là giá tốt nhất rồi bạn nhé.', 'Mình sẽ giao hàng qua đơn trên Tất Tần Tật.'];
const isPlaceholder = (m: Message) => ['[Hình ảnh]', '[Video]', '[Vị trí]'].includes(m.content) || /^\[\d+ hình ảnh\]$/.test(m.content);
type Picked = { uri: string; name: string; type: string; video: boolean };

function ChatVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, p => { p.loop = false; });
  return <VideoView player={player} style={{ width: 220, height: 160, borderRadius: 12, backgroundColor: '#000' }} nativeControls contentFit="contain" />;
}

export default function ChatRoom() {
  const { id, title, otherId } = useLocalSearchParams<{ id: string; title?: string; otherId?: string }>();
  const { session } = useAuth();
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [text, setText] = useState(''), [sending, setSending] = useState(false), [progress, setProgress] = useState<number | null>(null);
  const [files, setFiles] = useState<Picked[]>([]), [lightbox, setLightbox] = useState(''), [menu, setMenu] = useState<Message | null>(null);
  const [error, setError] = useState('');
  const pending = useRef<{ key: string; content: string } | null>(null);

  const load = useCallback(() => { api<Message[]>(`/chats/${id}/messages`, { auth: true }).then(setMsgs).catch(() => undefined); }, [id]);
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, [load]);
  const loadChat = useCallback(() => { api<Chat[]>('/chats', { auth: true }).then(list => setChat(list.find(c => c.id === id) ?? null)).catch(() => undefined); }, [id]);
  useEffect(() => { loadChat(); const t = setInterval(loadChat, 20000); return () => clearInterval(t); }, [loadChat]);

  const append = (m: Message) => setMsgs(prev => (prev?.some(x => x.id === m.id) ? prev.map(x => x.id === m.id ? m : x) : [...(prev ?? []), m]));

  const sendText = async () => {
    const content = text.trim(); if (!content || sending) return;
    if (!pending.current || pending.current.content !== content) pending.current = { key: uid(), content };
    const req = pending.current;
    setSending(true); setError('');
    try { const m = await api<Message>(`/chats/${id}/messages`, { method: 'POST', auth: true, body: { content: req.content }, idempotencyKey: req.key }); append(m); setText(''); pending.current = null; }
    catch (e) {
      if (e instanceof ApiError && [400, 401, 403, 404, 429].includes(e.status)) { pending.current = null; setError(e.message); }
      else setError('Chưa xác nhận được kết quả gửi. Bấm gửi lại để kiểm tra cùng tin nhắn, không tạo bản sao.');
    } finally { setSending(false); }
  };
  const sendFiles = async () => {
    if (!files.length || sending) return;
    setSending(true); setError(''); setProgress(0);
    try {
      const m = await uploadMany<Message>(`/chats/${id}/media`, files.map(({ uri, name, type }) => ({ uri, name, type })), setProgress, text.trim() ? { caption: text.trim() } : {});
      append(m); setFiles([]); setText('');
    } catch (e) { setError((e as Error).message); }
    finally { setSending(false); setProgress(null); }
  };
  const submit = () => (files.length ? sendFiles() : sendText());

  const pickImages = async () => {
    if (files.some(f => f.video)) return setError('Mỗi tin nhắn chỉ gửi 1 video, không gửi kèm ảnh khác.');
    const left = 5 - files.length; if (left <= 0) return setError('Tối đa 5 ảnh mỗi tin nhắn.');
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: left, quality: 0.8 });
    if (r.canceled) return;
    const big = r.assets.find(a => (a.fileSize ?? 0) > 8 * 1024 * 1024);
    if (big) return setError('Mỗi ảnh tối đa 8 MB.');
    setError(''); setFiles(prev => [...prev, ...r.assets.map((a, i) => ({ uri: a.uri, name: a.fileName ?? `anh${i}.jpg`, type: a.mimeType ?? 'image/jpeg', video: false }))].slice(0, 5));
  };
  const pickVideo = async () => {
    if (files.length) return setError('Mỗi tin nhắn chỉ gửi 1 video, không gửi kèm ảnh khác.');
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 0.7 });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    if ((a.fileSize ?? 0) > 25 * 1024 * 1024) return setError('Video tối đa 25 MB.');
    setError(''); setFiles([{ uri: a.uri, name: a.fileName ?? 'video.mp4', type: a.mimeType ?? 'video/mp4', video: true }]);
  };
  const shareLocation = async () => {
    setError('');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return setError('Hãy cho phép ứng dụng truy cập vị trí để chia sẻ vị trí.');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude: lat, longitude: lng } = pos.coords;
      let address = '';
      try { address = (await api<{ displayName: string }>(`/geo/reverse?lat=${lat}&lng=${lng}`, { auth: true })).displayName; } catch { /* chỉ gửi tọa độ */ }
      Alert.alert('Gửi vị trí hiện tại?', `${address ? address + '\n\n' : ''}Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}\n\nChỉ chia sẻ vị trí ở nơi công cộng khi hẹn gặp giao dịch, tránh gửi địa chỉ nhà riêng cho người lạ.`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Gửi vị trí', onPress: async () => {
          setSending(true);
          try { append(await api<Message>(`/chats/${id}/location`, { method: 'POST', auth: true, body: { lat, lng, label: address ? address.slice(0, 200) : undefined } })); }
          catch (e) { setError((e as Error).message); } finally { setSending(false); }
        } },
      ]);
    } catch { setError('Không lấy được vị trí. Hãy bật định vị và thử lại.'); }
  };

  const recall = async (m: Message) => {
    setMenu(null);
    try { append(await api<Message>(`/chats/${id}/messages/${m.id}/recall`, { method: 'POST', auth: true })); } catch (e) { Alert.alert('Chưa thu hồi được', (e as Error).message); }
  };
  const hide = async (m: Message) => {
    setMenu(null);
    try { await api(`/chats/${id}/messages/${m.id}`, { method: 'DELETE', auth: true }); setMsgs(prev => (prev ?? []).filter(x => x.id !== m.id)); } catch (e) { Alert.alert('Chưa xóa được', (e as Error).message); }
  };
  const confirm = (title: string, body: string, action: string, fn: () => void) => { setMenu(null); setTimeout(() => Alert.alert(title, body, [{ text: 'Hủy', style: 'cancel' }, { text: action, style: 'destructive', onPress: fn }]), 150); };

  const mineSeller = !!chat?.seller_id_is_me;
  const data = [...(msgs ?? [])].reverse();
  const canSend = !!(text.trim() || files.length) && !sending;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ headerTitle: () => (<View><Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>{chat?.other_name || title || 'Tin nhắn'}</Text>{(chat?.other_id || otherId) ? <TrustBadge userId={(chat?.other_id || otherId) as string} compact /> : null}</View>) }} />
      {chat ? (
        <Pressable onPress={() => router.push({ pathname: '/products/[id]', params: { id: chat.product_id } })} style={st.product}>
          {chat.product_image ? <Image source={{ uri: media(chat.product_image) }} style={st.pThumb} contentFit="cover" /> : <View style={st.pThumb} />}
          <View style={{ flex: 1 }}>
            <Text style={st.pLabel}>{mineSeller ? 'Người mua hỏi về tin của bạn' : 'Bạn đang hỏi về tin'}</Text>
            <Text numberOfLines={1} style={st.pTitle}>{chat.product_title}</Text>
            <Text style={st.pPrice}>{vnd(chat.product_price, chat.product_price_mode)}{chat.product_status !== 'ACTIVE' ? ' · Tin không còn mở bán' : ''}</Text>
          </View>
        </Pressable>
      ) : null}
      <View style={st.safe}><ShieldCheck size={14} color={C.brandDark} /><Text style={st.safeText}>Không chuyển khoản trước cho người lạ, không chia sẻ mã OTP/mật khẩu. Ưu tiên giao dịch có bảo vệ trong Tất Tần Tật.</Text></View>
      {!msgs ? <Loading /> : <FlatList inverted data={data} keyExtractor={m => m.id} contentContainerStyle={{ padding: 12, gap: 6 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: C.muted, transform: [{ scaleY: -1 }] }}>Hãy gửi lời chào đầu tiên.</Text>}
        renderItem={({ item }) => {
          const mine = item.sender_id === session?.user.id;
          const recalled = !!item.recalled_at || item.kind === 'RECALLED';
          const atts: Attachment[] = item.attachments ?? [];
          const images = atts.filter(a => a.type === 'image' && a.url), videos = atts.filter(a => a.type === 'video' && a.url), loc = atts.find(a => a.type === 'location' && a.lat !== undefined && a.lng !== undefined);
          const flags = !mine ? (item.safety_flags ?? []).map(f => FLAG_TEXT[f]).filter(Boolean) : [];
          return (
            <Pressable onLongPress={() => setMenu(item)} delayLongPress={250} style={[st.bubble, mine ? st.mine : st.theirs]}>
              {recalled ? <Text style={[st.text, { fontStyle: 'italic', opacity: 0.7 }, mine && { color: C.white }]}>{mine ? 'Bạn đã thu hồi một tin nhắn' : 'Tin nhắn đã được thu hồi'}</Text> : <>
                {images.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>{images.map((a, i) => (
                  <Pressable key={i} onPress={() => setLightbox(media(a.url))}><Image source={{ uri: media(a.url) }} style={images.length === 1 ? { width: 200, height: 200, borderRadius: 12 } : { width: 96, height: 96, borderRadius: 10 }} contentFit="cover" /></Pressable>))}</View> : null}
                {videos.map((a, i) => <ChatVideo key={i} url={media(a.url)} />)}
                {loc ? <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps?q=${loc.lat},${loc.lng}`)} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <MapPin size={16} color={mine ? C.white : C.brand} /><Text style={[st.text, mine && { color: C.white }, { textDecorationLine: 'underline', flexShrink: 1 }]}>{loc.label ?? 'Vị trí được chia sẻ'} · Mở Google Maps</Text>
                </Pressable> : null}
                {item.content && !isPlaceholder(item) && !loc ? <Text style={[st.text, mine && { color: C.white }]}>{item.content}</Text> : null}
                {flags.length ? <View style={st.warn}><TriangleAlert size={14} color="#8A4B00" /><Text style={st.warnText}>Cẩn trọng: tin nhắn này {flags.join(', ')}. Đừng chuyển tiền trước hay cung cấp mã OTP; hãy thanh toán và nhận hàng qua Tất Tần Tật.</Text></View> : null}
              </>}
              <Text style={[st.time, mine && { color: 'rgba(255,255,255,.75)' }]}>{time(item.created_at)}</Text>
            </Pressable>
          );
        }} />}
      {error ? <Text style={st.error}>{error}</Text> : null}
      <SafeAreaView edges={['bottom']} style={st.bottom}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 6, paddingHorizontal: 12, paddingTop: 8 }}>
          {(mineSeller ? QUICK_SELLER : QUICK_BUYER).map(t => <Pressable key={t} disabled={sending} onPress={() => setText(c => c || t)} style={st.chip}><Text style={st.chipText}>{t}</Text></Pressable>)}
        </ScrollView>
        {files.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingTop: 8 }}>
          {files.map((f, i) => <View key={f.uri + i} style={st.prev}>
            {f.video ? <View style={[st.prevImg, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }]}><Video size={26} color={C.white} /></View> : <Image source={{ uri: f.uri }} style={st.prevImg} contentFit="cover" />}
            {progress === null ? <Pressable hitSlop={6} onPress={() => setFiles(l => l.filter((_, j) => j !== i))} style={st.prevX}><X size={12} color={C.white} /></Pressable> : <View style={[st.prevImg, st.prog]}><Text style={{ color: C.white, fontWeight: '700', fontSize: 12 }}>{progress}%</Text></View>}
          </View>)}
        </ScrollView> : null}
        <View style={st.bar}>
          <Pressable hitSlop={8} onPress={pickImages} disabled={sending} accessibilityLabel="Gửi ảnh"><ImagePlus size={24} color={C.brand} /></Pressable>
          <Pressable hitSlop={8} onPress={pickVideo} disabled={sending} accessibilityLabel="Gửi video"><Video size={24} color={C.brand} /></Pressable>
          <Pressable hitSlop={8} onPress={shareLocation} disabled={sending} accessibilityLabel="Gửi vị trí"><MapPin size={24} color={C.brand} /></Pressable>
          <TextInput value={text} onChangeText={setText} placeholder={files.length ? 'Thêm chú thích…' : 'Nhập tin nhắn…'} placeholderTextColor="#94A3B8" style={st.input} multiline maxLength={2000} />
          <Pressable onPress={submit} disabled={!canSend} style={[st.send, !canSend && { opacity: 0.4 }]}>{sending ? <ActivityIndicator color={C.white} /> : <Send size={20} color={C.white} />}</Pressable>
        </View>
      </SafeAreaView>

      <Modal visible={!!menu} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
        <Pressable style={st.backdrop} onPress={() => setMenu(null)}>
          {menu ? <View style={st.sheet}>
            {menu.content && !isPlaceholder(menu) && !menu.recalled_at ? <Opt icon={<Copy size={20} color={C.ink} />} label="Sao chép" onPress={() => { void Clipboard.setStringAsync(menu.content); setMenu(null); }} /> : null}
            {menu.sender_id === session?.user.id && !menu.recalled_at && menu.can_recall ? <Opt icon={<Undo2 size={20} color={C.ink} />} label="Thu hồi (với mọi người)" onPress={() => confirm('Thu hồi tin nhắn?', 'Người kia sẽ không còn xem được nội dung.', 'Thu hồi', () => void recall(menu))} /> : null}
            <Opt icon={<Trash2 size={20} color={C.danger} />} label="Xóa ở phía tôi" danger onPress={() => confirm('Xóa tin nhắn?', 'Người kia vẫn thấy tin nhắn này.', 'Xóa', () => void hide(menu))} />
            <Pressable onPress={() => setMenu(null)} style={st.cancel}><Text style={st.cancelText}>Đóng</Text></Pressable>
          </View> : null}
        </Pressable>
      </Modal>
      <Modal visible={!!lightbox} transparent animationType="fade" onRequestClose={() => setLightbox('')}>
        <Pressable style={[st.backdrop, { backgroundColor: 'rgba(0,0,0,.92)', justifyContent: 'center' }]} onPress={() => setLightbox('')}>
          {lightbox ? <Image source={{ uri: lightbox }} style={{ width: '100%', height: '80%' }} contentFit="contain" /> : null}
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function Opt({ icon, label, onPress, danger }: { icon: React.ReactNode; label: string; onPress: () => void; danger?: boolean }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [st.opt, pressed && { backgroundColor: C.paper }]}>{icon}<Text style={[st.optText, danger && { color: C.danger }]}>{label}</Text></Pressable>;
}

const st = StyleSheet.create({
  product: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: C.white, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  pThumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: C.paper },
  pLabel: { fontSize: 11.5, color: C.muted },
  pTitle: { fontSize: 14.5, fontWeight: '700', color: C.ink },
  pPrice: { fontSize: 13.5, fontWeight: '700', color: C.danger },
  safe: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#EEF7F1', paddingHorizontal: 12, paddingVertical: 6 },
  safeText: { flex: 1, fontSize: 11.5, color: C.text },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, gap: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: C.brand, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: C.white, borderBottomLeftRadius: 4 },
  text: { fontSize: 15, lineHeight: 21, color: C.ink },
  time: { fontSize: 11, color: C.muted, alignSelf: 'flex-end' },
  warn: { flexDirection: 'row', gap: 6, backgroundColor: '#FFF4E5', borderWidth: 1, borderColor: '#F5C98A', borderRadius: 8, padding: 6 },
  warnText: { flex: 1, fontSize: 12, color: '#8A4B00' },
  error: { color: C.danger, fontSize: 13, paddingHorizontal: 14, paddingVertical: 4, backgroundColor: C.white },
  bottom: { backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line },
  chip: { borderWidth: 1, borderColor: '#CFE3D6', backgroundColor: '#F4FBF6', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 5 },
  chipText: { fontSize: 12.5, color: C.text },
  prev: { width: 64, height: 64 },
  prevImg: { width: 64, height: 64, borderRadius: 10 },
  prevX: { position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,.65)', alignItems: 'center', justifyContent: 'center' },
  prog: { position: 'absolute', backgroundColor: 'rgba(0,0,0,.55)', alignItems: 'center', justifyContent: 'center' },
  bar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  input: { flex: 1, maxHeight: 120, minHeight: 42, backgroundColor: C.paper, borderRadius: R.xl, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontSize: 15, color: C.ink },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 10, paddingBottom: 22, paddingHorizontal: 8 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, height: 52, borderRadius: R.md },
  optText: { fontSize: 16, fontWeight: '600', color: C.ink },
  cancel: { marginTop: 6, height: 50, borderRadius: R.md, backgroundColor: '#F1F5F4', alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 16, fontWeight: '800', color: C.ink },
});
