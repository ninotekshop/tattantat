import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Eye, EyeOff, Lock, UserRound } from 'lucide-react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Session } from '@/lib/session';
import { C } from '@/lib/theme';
import { Button, Input } from '@/components/ui';

export default function Login() {
  const { signIn } = useAuth();
  const [id, setId] = useState(''), [pw, setPw] = useState(''), [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const s = await api<Session>('/auth/login', { method: 'POST', body: { phoneOrEmail: id.trim(), password: pw } });
      await signIn(s);
      router.replace('/');
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={st.wrap} keyboardShouldPersistTaps="handled">
        <Image source={require('../assets/logo.png')} style={{ width: 220, height: 64, alignSelf: 'center' }} contentFit="contain" />
        <View style={st.chip}><Text style={st.chipText}>Ứng dụng quản trị</Text></View>
        <Text style={st.sub}>Đăng nhập bằng tài khoản quản trị để duyệt xác minh và tin đăng.</Text>
        <View style={{ gap: 14 }}>
          <Input label="Email hoặc số điện thoại" value={id} onChangeText={setId} autoCapitalize="none" keyboardType="email-address" left={<UserRound size={18} color={C.muted} />} />
          <Input label="Mật khẩu" value={pw} onChangeText={setPw} secureTextEntry={!show} left={<Lock size={18} color={C.muted} />}
            right={<Pressable hitSlop={8} onPress={() => setShow(!show)}>{show ? <EyeOff size={18} color={C.muted} /> : <Eye size={18} color={C.muted} />}</Pressable>} />
          {error ? <Text style={st.error}>{error}</Text> : null}
          <Button title="Đăng nhập" loading={busy} disabled={!id.trim() || pw.length < 6} onPress={submit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 18 },
  chip: { alignSelf: 'center', backgroundColor: C.brandDark, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5 },
  chipText: { color: C.white, fontSize: 12.5, fontWeight: '800' },
  sub: { textAlign: 'center', color: C.muted, fontSize: 14, lineHeight: 20 },
  error: { color: C.danger, fontSize: 14 },
});
