import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ImagePlus, MapPin, Send } from 'lucide-react-native';
import { api, media, upload } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { uid } from '@/lib/format';
import { C, R } from '@/lib/theme';
import type { Message } from '@/lib/types';
import { Loading } from '@/components/ui';

const time = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export default function ChatRoom() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const { session } = useAuth();
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [text, setText] = useState(''), [sending, setSending] = useState(false);
  const list = useRef<FlatList<Message>>(null);

  const load = useCallback(() => { api<Message[]>(`/chats/${id}/messages`, { auth: true }).then(setMsgs).catch(() => undefined); }, [id]);
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, [load]);

  const send = async () => {
    const content = text.trim(); if (!content || sending) return;
    setSending(true); setText('');
    try { const m = await api<Message>(`/chats/${id}/messages`, { method: 'POST', auth: true, body: { content }, idempotencyKey: uid() }); setMsgs(prev => [...(prev ?? []), m]); }
    catch (e) { setText(content); Alert.alert('Chưa gửi được', (e as Error).message); }
    finally { setSending(false); }
  };
  const sendImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    setSending(true);
    try { const m = await upload<Message>(`/chats/${id}/media`, { uri: a.uri, name: a.fileName ?? 'anh.jpg', type: a.mimeType ?? 'image/jpeg' }, undefined, 'files'); setMsgs(prev => [...(prev ?? []), m]); }
    catch (e) { Alert.alert('Chưa gửi được ảnh', (e as Error).message); }
    finally { setSending(false); }
  };

  const data = [...(msgs ?? [])].reverse();
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: title || 'Tin nhắn' }} />
      {!msgs ? <Loading /> : <FlatList ref={list} inverted data={data} keyExtractor={m => m.id} contentContainerStyle={{ padding: 12, gap: 6 }}
        renderItem={({ item }) => {
          const mine = item.sender_id === session?.user.id;
          const img = item.attachments?.find(a => a.url && (a.mime ?? a.kind ?? '').toString().includes('image'));
          const loc = item.attachments?.find(a => a.lat !== undefined && a.lng !== undefined);
          return (
            <View style={[st.bubble, mine ? st.mine : st.theirs]}>
              {item.recalled_at ? <Text style={[st.text, { fontStyle: 'italic', opacity: 0.7 }, mine && { color: C.white }]}>Tin nhắn đã được thu hồi</Text> : <>
                {img?.url ? <Image source={{ uri: media(img.url) }} style={{ width: 200, height: 200, borderRadius: 12 }} contentFit="cover" /> : null}
                {loc ? <Pressable onPress={() => Linking.openURL(`https://maps.google.com/?q=${loc.lat},${loc.lng}`)} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <MapPin size={16} color={mine ? C.white : C.brand} /><Text style={[st.text, mine && { color: C.white }, { textDecorationLine: 'underline' }]}>{loc.label ?? 'Vị trí đã chia sẻ'}</Text>
                </Pressable> : null}
                {item.content && !loc ? <Text style={[st.text, mine && { color: C.white }]}>{item.content}</Text> : null}
              </>}
              <Text style={[st.time, mine && { color: 'rgba(255,255,255,.75)' }]}>{time(item.created_at)}</Text>
            </View>
          );
        }} />}
      <SafeAreaView edges={['bottom']} style={st.bar}>
        <Pressable hitSlop={8} onPress={sendImage} disabled={sending}><ImagePlus size={24} color={C.brand} /></Pressable>
        <TextInput value={text} onChangeText={setText} placeholder="Nhập tin nhắn…" placeholderTextColor="#94A3B8" style={st.input} multiline maxLength={2000} />
        <Pressable onPress={send} disabled={!text.trim() || sending} style={[st.send, (!text.trim() || sending) && { opacity: 0.4 }]}><Send size={20} color={C.white} /></Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, gap: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: C.brand, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: C.white, borderBottomLeftRadius: 4 },
  text: { fontSize: 15, lineHeight: 21, color: C.ink },
  time: { fontSize: 11, color: C.muted, alignSelf: 'flex-end' },
  bar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line },
  input: { flex: 1, maxHeight: 120, minHeight: 42, backgroundColor: C.paper, borderRadius: R.xl, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontSize: 15, color: C.ink },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
});
