import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Send } from 'lucide-react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { C, R } from '@/lib/theme';

type Msg = { role: 'user' | 'assistant'; content: string };
const HELLO: Msg = { role: 'assistant', content: 'Xin chào! Mình là Trợ lý TTT. Bạn cần hỗ trợ về đăng tin, mua bán, thanh toán QR hay tài khoản? Cứ hỏi mình nhé.' };
const SUGGEST = ['Cách đăng tin?', 'Thanh toán QR hoạt động thế nào?', 'Gặp tin lừa đảo thì làm gì?'];

export default function Support() {
  const { session } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([HELLO]);
  const [text, setText] = useState(''), [busy, setBusy] = useState(false);
  const list = useRef<FlatList<Msg>>(null);

  const send = async (q: string) => {
    const content = q.trim(); if (!content || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', content }];
    setMsgs(next); setText(''); setBusy(true);
    try {
      const r = await api<{ reply: string }>(session ? '/ai/support-chat' : '/ai/support-chat/guest', { method: 'POST', auth: !!session, body: { messages: next.slice(-10) } });
      setMsgs([...next, { role: 'assistant', content: r.reply }]);
    } catch (e) { setMsgs([...next, { role: 'assistant', content: (e as Error).message }]); }
    finally { setBusy(false); setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList ref={list} data={msgs} keyExtractor={(_, i) => String(i)} contentContainerStyle={{ padding: 12, gap: 8 }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={<Image source={require('../assets/mascot.png')} style={{ width: 96, height: 96, alignSelf: 'center', marginBottom: 6 }} contentFit="contain" />}
        renderItem={({ item }) => <View style={[st.b, item.role === 'user' ? st.me : st.bot]}><Text style={[st.t, item.role === 'user' && { color: C.white }]}>{item.content}</Text></View>}
        ListFooterComponent={<>
          {busy ? <Text style={{ color: C.muted, fontStyle: 'italic', padding: 6 }}>Trợ lý đang trả lời…</Text> : null}
          {msgs.length === 1 ? <View style={{ gap: 6, marginTop: 6 }}>{SUGGEST.map(s => <Pressable key={s} onPress={() => send(s)} style={st.sug}><Text style={{ color: C.brand, fontWeight: '600' }}>{s}</Text></Pressable>)}</View> : null}
        </>} />
      <SafeAreaView edges={['bottom']} style={st.bar}>
        <TextInput value={text} onChangeText={setText} placeholder="Nhập câu hỏi…" placeholderTextColor="#94A3B8" style={st.input} maxLength={1000} onSubmitEditing={() => send(text)} returnKeyType="send" />
        <Pressable onPress={() => send(text)} disabled={busy || !text.trim()} style={[st.send, (busy || !text.trim()) && { opacity: 0.4 }]}><Send size={20} color={C.white} /></Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
const st = StyleSheet.create({
  b: { maxWidth: '85%', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9 },
  me: { alignSelf: 'flex-end', backgroundColor: C.brand },
  bot: { alignSelf: 'flex-start', backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  t: { fontSize: 15, lineHeight: 21, color: C.ink },
  sug: { borderWidth: 1.5, borderColor: C.brand, borderRadius: R.md, padding: 10, backgroundColor: C.white },
  bar: { flexDirection: 'row', gap: 10, padding: 10, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line },
  input: { flex: 1, height: 44, backgroundColor: C.paper, borderRadius: R.xl, paddingHorizontal: 14, fontSize: 15, color: C.ink },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
});
