import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Eye, EyeOff, Lock, Phone, UserRound } from 'lucide-react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Session } from '@/lib/session';
import { appleAvailable, appleLogin, confirmOtp, googleLogin, sendOtp, type ConfirmationResult } from '@/lib/social';
import { C, R } from '@/lib/theme';
import { Button, Input } from '@/components/ui';

export default function Login() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [id, setId] = useState(''), [pw, setPw] = useState(''), [show, setShow] = useState(false);
  const [phone, setPhone] = useState(''), [code, setCode] = useState('');
  const [busy, setBusy] = useState<string | null>(null), [error, setError] = useState('');
  const [apple, setApple] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const confirmation = useRef<ConfirmationResult | null>(null);

  useEffect(() => { Promise.resolve(appleAvailable()).then(v => setApple(!!v)).catch(() => setApple(false)); }, []);
  useEffect(() => { if (countdown <= 0) return; const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }, [countdown]);

  const done = async (s: Session | null) => { if (!s) return; await signIn(s); if (router.canGoBack()) router.back(); else router.replace('/'); };
  const run = async (key: string, fn: () => Promise<Session | null>) => {
    setBusy(key); setError('');
    try { await done(await fn()); } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  };

  const passwordLogin = () => run('pw', () => api<Session>('/auth/login', { method: 'POST', body: { phoneOrEmail: id.trim(), password: pw } }));
  const requestOtp = async () => {
    setBusy('send'); setError('');
    try { confirmation.current = await sendOtp(phone); setCountdown(60); Alert.alert('Đã gửi mã', `Mã OTP đã được gửi tới ${phone}.`); }
    catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  };
  const verifyOtp = () => run('otp', async () => {
    if (!confirmation.current) throw new Error('Hãy bấm “Gửi mã” trước.');
    return confirmOtp(confirmation.current, code);
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={st.wrap} keyboardShouldPersistTaps="handled">
        <Image source={require('../assets/mascot.png')} style={{ width: 110, height: 110, alignSelf: 'center' }} contentFit="contain" />
        <Text style={st.h1}>Chào mừng bạn!</Text>
        <Text style={st.sub}>Đăng nhập để mua bán, nhắn tin và lưu tin yêu thích.</Text>

        <View style={st.tabs}>
          {(['password', 'otp'] as const).map(m => (
            <Pressable key={m} onPress={() => { setMode(m); setError(''); }} style={[st.tab, mode === m && st.tabOn]}>
              <Text style={[st.tabText, mode === m && { color: C.white }]}>{m === 'password' ? 'Mật khẩu' : 'Mã OTP (SMS)'}</Text>
            </Pressable>
          ))}
        </View>

        {mode === 'password' ? <View style={{ gap: 14 }}>
          <Input label="Email hoặc số điện thoại" value={id} onChangeText={setId} autoCapitalize="none" keyboardType="email-address" textContentType="username" left={<UserRound size={18} color={C.muted} />} />
          <Input label="Mật khẩu" value={pw} onChangeText={setPw} secureTextEntry={!show} textContentType="password" left={<Lock size={18} color={C.muted} />}
            right={<Pressable hitSlop={8} onPress={() => setShow(!show)}>{show ? <EyeOff size={18} color={C.muted} /> : <Eye size={18} color={C.muted} />}</Pressable>} />
          <Link href="/forgot-password" style={st.link}>Quên mật khẩu?</Link>
          {error ? <Text style={st.error}>{error}</Text> : null}
          <Button title="Đăng nhập" loading={busy === 'pw'} disabled={!id.trim() || pw.length < 6} onPress={passwordLogin} />
        </View> : <View style={{ gap: 14 }}>
          <Input label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0912 345 678" left={<Phone size={18} color={C.muted} />}
            right={<Pressable disabled={!!busy || countdown > 0 || phone.replace(/\D/g, '').length < 9} onPress={requestOtp}>
              <Text style={{ color: countdown > 0 ? C.muted : C.brand, fontWeight: '700' }}>{busy === 'send' ? 'Đang gửi…' : countdown > 0 ? `Gửi lại (${countdown}s)` : confirmation.current ? 'Gửi lại' : 'Gửi mã'}</Text>
            </Pressable>} />
          <Input label="Mã OTP" value={code} onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" placeholder="Nhập 6 số" maxLength={6} />
          {error ? <Text style={st.error}>{error}</Text> : null}
          <Button title="Xác nhận & đăng nhập" loading={busy === 'otp'} disabled={code.length < 6} onPress={verifyOtp} />
          <Text style={st.hint}>Lần đầu đăng nhập bằng số điện thoại sẽ tự tạo tài khoản mới.</Text>
        </View>}

        <View style={st.or}><View style={st.line} /><Text style={st.orText}>hoặc</Text><View style={st.line} /></View>
        <Button variant="outline" title="Tiếp tục với Google" loading={busy === 'google'} onPress={() => run('google', googleLogin)}
          icon={<Text style={{ fontSize: 18, fontWeight: '900', color: '#4285F4' }}>G</Text>} />
        {apple ? <AppleAuthentication.AppleAuthenticationButton buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK} cornerRadius={R.pill} style={{ height: 50, marginTop: 12 }}
          onPress={() => run('apple', appleLogin)} /> : null}

        <Text style={st.foot}>Chưa có tài khoản? <Link href="/register" style={st.linkInline}>Đăng ký ngay</Link></Text>
        <Text style={st.terms}>Khi tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Tất Tần Tật.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 48, gap: 6 },
  h1: { fontSize: 26, fontWeight: '800', color: C.ink, textAlign: 'center', marginTop: 6 },
  sub: { fontSize: 15, color: C.muted, textAlign: 'center', marginBottom: 18 },
  tabs: { flexDirection: 'row', backgroundColor: C.paper, borderRadius: R.pill, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: R.pill, alignItems: 'center' },
  tabOn: { backgroundColor: C.brand },
  tabText: { fontWeight: '700', color: C.text },
  link: { color: C.brand, fontWeight: '700', alignSelf: 'flex-end' },
  linkInline: { color: C.brand, fontWeight: '800' },
  error: { color: C.danger, fontSize: 14 },
  hint: { color: C.muted, fontSize: 13, textAlign: 'center' },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: C.line },
  orText: { color: C.muted },
  foot: { textAlign: 'center', marginTop: 22, color: C.text, fontSize: 15 },
  terms: { textAlign: 'center', marginTop: 10, color: C.muted, fontSize: 12, lineHeight: 18 },
});
