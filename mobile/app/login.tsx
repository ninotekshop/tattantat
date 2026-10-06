import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { SITE_URL, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Session } from '@/lib/session';
import { appleAvailable, appleLogin, googleLogin, webLogin } from '@/lib/social';
import { C, R } from '@/lib/theme';

/** Zalo chặn lấy hồ sơ từ IP máy chủ ngoài Việt Nam (lỗi -501). Đặt true khi backend có IP Việt Nam hoặc proxy VN. */
const SHOW_ZALO = false;

/** Đăng nhập / Đăng ký giống web: email hoặc số điện thoại + mật khẩu, hoặc tiếp tục với Google, Facebook, Apple. Không dùng mã OTP. */
export default function Login() {
  const { signIn } = useAuth();
  const [id, setId] = useState(''), [pw, setPw] = useState(''), [showPw, setShowPw] = useState(false);
  const [apple, setApple] = useState(false);
  const [busy, setBusy] = useState<string | null>(null), [error, setError] = useState('');

  useEffect(() => { Promise.resolve(appleAvailable()).then(v => setApple(!!v)).catch(() => setApple(false)); }, []);

  const done = async (s: Session | null) => { if (!s) return; await signIn(s); if (router.canGoBack()) router.back(); else router.replace('/'); };
  const run = async (key: string, fn: () => Promise<Session | null>) => {
    setBusy(key); setError('');
    try { await done(await fn()); } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  };
  const goBack = () => { if (router.canGoBack()) router.back(); else router.replace('/'); };

  const canSubmit = id.trim().length > 0 && pw.length >= 6;
  const submit = () => {
    if (!canSubmit || busy) return;
    const phoneOrEmail = id.trim().replace(/^(\+?84|0)(\d[\d\s.\-()]{8,})$/, (m) => m.replace(/[\s.\-()]/g, ''));
    void run('pw', () => api<Session>('/auth/login', { method: 'POST', body: { phoneOrEmail, password: pw } }));
  };

  const openSite = (path: string) => Linking.openURL(SITE_URL + path).catch(() => undefined);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.wrap} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityLabel="Quay lại" hitSlop={12} onPress={goBack} style={st.back}><ArrowLeft size={26} color={C.ink} /></Pressable>

          <View style={st.titleRow}>
            <View style={{ flexShrink: 1 }}>
              <Text style={st.h1}>Chào mừng đến Tất Tần Tật</Text>
              <Text style={st.sub}>Mua bán dễ dàng - Kết nối mọi người</Text>
            </View>
            <Image source={require('../assets/mascot.png')} style={st.mascot} contentFit="contain" />
          </View>

          <View style={st.tabs}>
            <View style={[st.tab, st.tabOn]}><Text style={[st.tabText, st.tabTextOn]}>Đăng nhập</Text></View>
            <Pressable style={st.tab} onPress={() => router.replace('/register')}><Text style={st.tabText}>Đăng ký</Text></Pressable>
          </View>

          <View style={{ gap: 14 }}>
            <View style={st.field}>
              <Text style={st.label}>Email hoặc Số điện thoại</Text>
              <View style={st.inputRow}>
                <Mail size={18} color={C.muted} />
                <TextInput value={id} onChangeText={t => { setId(t); setError(''); }} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="username" style={st.input} returnKeyType="next" />
              </View>
            </View>
            <View style={st.field}>
              <Text style={st.label}>Mật khẩu</Text>
              <View style={st.inputRow}>
                <Lock size={18} color={C.muted} />
                <TextInput value={pw} onChangeText={t => { setPw(t); setError(''); }} secureTextEntry={!showPw} autoCapitalize="none" textContentType="password" autoComplete="password" style={st.input} onSubmitEditing={submit} returnKeyType="go" />
                <Pressable hitSlop={10} onPress={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={20} color={C.muted} /> : <Eye size={20} color={C.muted} />}</Pressable>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Pressable hitSlop={8} onPress={() => router.push('/forgot-password')}><Text style={st.link}>Quên mật khẩu?</Text></Pressable>
            </View>
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" onPress={submit} disabled={!canSubmit || !!busy} style={[st.cta, canSubmit && st.ctaOn]}>
              {busy === 'pw' ? <ActivityIndicator color={C.white} /> : <Text style={[st.ctaText, canSubmit && { color: C.white }]}>Đăng nhập</Text>}
            </Pressable>
          </View>

          <View style={st.or}><View style={st.line} /><Text style={st.orText}>HOẶC TIẾP TỤC VỚI</Text><View style={st.line} /></View>

          <View style={st.socialRow}>
            <Social title="Google" icon={<GoogleIcon />} loading={busy === 'google'} onPress={() => run('google', googleLogin)} />
            <Social title="Facebook" icon={<FacebookIcon />} loading={busy === 'facebook'} onPress={() => run('facebook', () => webLogin('facebook'))} />
            {SHOW_ZALO ? <Social title="Zalo" icon={<ZaloIcon />} loading={busy === 'zalo'} onPress={() => run('zalo', () => webLogin('zalo'))} /> : null}
            {apple ? <Social title="Apple" icon={<AppleIcon />} loading={busy === 'apple'} onPress={() => run('apple', appleLogin)} /> : null}
          </View>

          <View style={{ flex: 1, minHeight: 40 }} />
          <View style={st.footLinks}>
            <Pressable onPress={() => openSite('/regulations')}><Text style={st.footText}>Quy chế hoạt động sàn</Text></Pressable>
            <View style={st.sep} />
            <Pressable onPress={() => openSite('/privacy')}><Text style={st.footText}>Chính sách bảo mật</Text></Pressable>
            <View style={st.sep} />
            <Pressable onPress={() => router.push('/support')}><Text style={st.footText}>Liên hệ hỗ trợ</Text></Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Social({ title, icon, onPress, loading }: { title: string; icon: ReactNode; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Tiếp tục với ${title}`} onPress={onPress} disabled={loading} style={({ pressed }) => [st.social, pressed && { backgroundColor: C.paper }]}>
      {loading ? <ActivityIndicator color={C.ink} /> : <><View style={st.socialIcon}>{icon}</View><Text style={st.socialText} numberOfLines={1}>{title}</Text></>}
    </Pressable>
  );
}

const GoogleIcon = () => (
  <Svg width={26} height={26} viewBox="0 0 48 48">
    <Path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <Path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
    <Path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
    <Path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </Svg>
);
const FacebookIcon = () => (
  <Svg width={26} height={26} viewBox="0 0 48 48">
    <Circle cx={24} cy={24} r={24} fill="#1877F2" />
    <Path fill="#fff" d="M33.4 30.9l1.1-6.9h-6.6v-4.5c0-1.9.9-3.7 3.9-3.7h3V10c0 0-2.7-.5-5.3-.5-5.4 0-8.9 3.3-8.9 9.2V24h-6v6.9h6V48h7.4V30.9z" />
  </Svg>
);
const ZaloIcon = () => (
  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#0068FF', alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: -0.3 }}>Zalo</Text>
  </View>
);
const AppleIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path fill="#000" d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.8 3-.8 1.4 0 1.8.8 3 .7 1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8zM14.1 5.8c.6-.8 1.1-1.8.9-2.9-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1 .1 2.1-.5 2.8-1.3z" />
  </Svg>
);

const st = StyleSheet.create({
  wrap: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  back: { width: 40, height: 40, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12, marginBottom: 18 },
  h1: { fontSize: 24, fontWeight: '800', color: C.ink, paddingRight: 8 },
  sub: { fontSize: 14, lineHeight: 20, color: C.muted, marginTop: 4 },
  mascot: { width: 76, height: 76 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 18 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: C.brand },
  tabText: { fontSize: 16, fontWeight: '700', color: C.muted },
  tabTextOn: { color: C.brand },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: C.ink },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: R.md, borderWidth: 1.5, borderColor: '#CBD5E1', paddingHorizontal: 14, backgroundColor: C.white },
  input: { flex: 1, fontSize: 16, color: C.ink, paddingVertical: 12, minHeight: 48 },
  socialRow: { flexDirection: 'row', gap: 10 },
  social: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: R.md, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: C.white, paddingHorizontal: 8 },
  socialIcon: { alignItems: 'center', justifyContent: 'center' },
  socialText: { fontSize: 14, fontWeight: '800', color: C.ink },
  or: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orText: { color: C.muted, fontSize: 12, fontWeight: '600' },
  cta: { marginTop: 4, height: 54, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F4' },
  ctaOn: { backgroundColor: C.brand },
  ctaText: { fontSize: 18, fontWeight: '800', color: C.ink },
  error: { color: C.danger, fontSize: 14, lineHeight: 20 },
  link: { color: C.brand, fontWeight: '800', fontSize: 14 },
  footLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 4, paddingTop: 10 },
  footText: { color: C.muted, fontSize: 13.5, paddingHorizontal: 6 },
  sep: { width: 1, height: 16, backgroundColor: '#E2E8F0' },
});
