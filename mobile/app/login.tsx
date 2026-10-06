import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { SITE_URL, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Session } from '@/lib/session';
import { appleAvailable, appleLogin, confirmOtp, googleLogin, sendOtp, webLogin, type OtpSession } from '@/lib/social';
import { C, R } from '@/lib/theme';

type Step = 'start' | 'password' | 'otp';

/** Zalo chặn lấy hồ sơ từ IP máy chủ ngoài Việt Nam (lỗi -501). Đặt true khi backend có IP Việt Nam hoặc proxy VN. */
const SHOW_ZALO = false;

/** Đăng nhập / Đăng ký: Google, Facebook, Zalo, Apple (iOS) hoặc số điện thoại (mật khẩu hoặc mã OTP). */
export default function Login() {
  const { signIn } = useAuth();
  const [step, setStep] = useState<Step>('start');
  const [phone, setPhone] = useState(''), [pw, setPw] = useState(''), [showPw, setShowPw] = useState(false), [otp, setOtp] = useState('');
  const [focus, setFocus] = useState(false), [apple, setApple] = useState(false);
  const [busy, setBusy] = useState<string | null>(null), [error, setError] = useState(''), [info, setInfo] = useState('');
  const [wait, setWait] = useState(0);
  const confirmation = useRef<OtpSession | null>(null);

  const normalized = phone.replace(/[\s.\-()]/g, '');
  const validPhone = /^(0|\+?84)\d{9}$/.test(normalized);

  useEffect(() => { Promise.resolve(appleAvailable()).then(v => setApple(!!v)).catch(() => setApple(false)); }, []);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);

  const done = async (s: Session | null) => { if (!s) return; await signIn(s); if (router.canGoBack()) router.back(); else router.replace('/'); };
  const run = async (key: string, fn: () => Promise<Session | null>) => {
    setBusy(key); setError('');
    try { await done(await fn()); } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  };
  const goBack = () => {
    setError(''); setInfo('');
    if (step !== 'start') { setStep('start'); setPw(''); setOtp(''); return; }
    if (router.canGoBack()) router.back(); else router.replace('/');
  };

  const requestOtp = async () => {
    setBusy('otp-send'); setError('');
    try { confirmation.current = await sendOtp(normalized); setOtp(''); setWait(60); setStep('otp'); }
    catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  };

  const next = async () => {
    if (!validPhone) return;
    setBusy('phone'); setError(''); setInfo('');
    try {
      const r = await api<{ exists: boolean }>('/auth/phone/check', { method: 'POST', body: { phone: normalized } });
      if (r.exists) { setStep('password'); return; }
      setInfo('Số điện thoại này chưa có tài khoản. Chúng tôi sẽ gửi mã OTP để tạo tài khoản mới.');
      await requestOtp();
    } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  };

  const openSite = (path: string) => Linking.openURL(SITE_URL + path).catch(() => undefined);
  const heading = step === 'start' ? 'Đăng nhập/Đăng ký' : step === 'password' ? 'Nhập mật khẩu' : 'Nhập mã OTP';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.wrap} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityLabel="Quay lại" hitSlop={12} onPress={goBack} style={st.back}><ArrowLeft size={26} color={C.ink} /></Pressable>

          <View style={st.titleRow}>
            <Text style={st.h1}>{heading}</Text>
            {step === 'start' ? <Image source={require('../assets/mascot.png')} style={st.mascot} contentFit="contain" /> : null}
          </View>

          {step === 'start' ? (
            <>
              <View style={{ gap: 14 }}>
                <Social title="Tiếp tục với Google" icon={<GoogleIcon />} loading={busy === 'google'} onPress={() => run('google', googleLogin)} />
                <Social title="Tiếp tục với Facebook" icon={<FacebookIcon />} loading={busy === 'facebook'} onPress={() => run('facebook', () => webLogin('facebook'))} />
                {SHOW_ZALO ? <Social title="Tiếp tục với Zalo" icon={<ZaloIcon />} loading={busy === 'zalo'} onPress={() => run('zalo', () => webLogin('zalo'))} /> : null}
                {apple ? <Social title="Tiếp tục với Apple" icon={<AppleIcon />} loading={busy === 'apple'} onPress={() => run('apple', appleLogin)} /> : null}
              </View>

              <View style={st.or}><View style={st.line} /><Text style={st.orText}>Hoặc</Text><View style={st.line} /></View>

              <View style={[st.phoneBox, focus && st.phoneBoxOn]}>
                <Text style={st.phoneLabel}>Số điện thoại</Text>
                <TextInput value={phone} onChangeText={t => { setPhone(t); setError(''); setInfo(''); }} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
                  keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" maxLength={16} style={st.phoneInput} onSubmitEditing={next} returnKeyType="go" />
              </View>
              {error ? <Text style={st.error}>{error}</Text> : null}
              {info ? <Text style={st.info}>{info}</Text> : null}
              <Pressable accessibilityRole="button" onPress={next} disabled={!validPhone || !!busy} style={[st.cta, validPhone && st.ctaOn]}>
                {busy === 'phone' || busy === 'otp-send' ? <ActivityIndicator color={validPhone ? C.white : C.ink} /> : <Text style={[st.ctaText, validPhone && { color: C.white }]}>Tiếp tục</Text>}
              </Pressable>
            </>
          ) : null}

          {step === 'password' ? (
            <View style={{ gap: 14 }}>
              <Text style={st.sub}>Tài khoản <Text style={{ fontWeight: '800', color: C.ink }}>{normalized}</Text> đã có trên Tất Tần Tật. Nhập mật khẩu để đăng nhập.</Text>
              <View style={[st.phoneBox, st.phoneBoxOn, { flexDirection: 'row', alignItems: 'center' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={st.phoneLabel}>Mật khẩu</Text>
                  <TextInput value={pw} onChangeText={t => { setPw(t); setError(''); }} secureTextEntry={!showPw} autoFocus textContentType="password" autoCapitalize="none" style={st.phoneInput}
                    onSubmitEditing={() => pw.length >= 6 && run('pw', () => api<Session>('/auth/login', { method: 'POST', body: { phoneOrEmail: normalized, password: pw } }))} />
                </View>
                <Pressable hitSlop={10} onPress={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={20} color={C.muted} /> : <Eye size={20} color={C.muted} />}</Pressable>
              </View>
              {error ? <Text style={st.error}>{error}</Text> : null}
              <Pressable accessibilityRole="button" disabled={pw.length < 6 || !!busy} style={[st.cta, pw.length >= 6 && st.ctaOn]}
                onPress={() => run('pw', () => api<Session>('/auth/login', { method: 'POST', body: { phoneOrEmail: normalized, password: pw } }))}>
                {busy === 'pw' ? <ActivityIndicator color={C.white} /> : <Text style={[st.ctaText, pw.length >= 6 && { color: C.white }]}>Đăng nhập</Text>}
              </Pressable>
              <View style={st.rowBetween}>
                <Pressable hitSlop={8} onPress={() => router.push('/forgot-password')}><Text style={st.link}>Quên mật khẩu?</Text></Pressable>
                <Pressable hitSlop={8} disabled={!!busy} onPress={requestOtp}>{busy === 'otp-send' ? <ActivityIndicator color={C.brand} /> : <Text style={st.link}>Đăng nhập bằng mã OTP</Text>}</Pressable>
              </View>
            </View>
          ) : null}

          {step === 'otp' ? (
            <View style={{ gap: 14 }}>
              <Text style={st.sub}>Mã gồm 6 số đã được gửi qua SMS tới <Text style={{ fontWeight: '800', color: C.ink }}>{normalized}</Text>.</Text>
              <View style={[st.phoneBox, st.phoneBoxOn]}>
                <Text style={st.phoneLabel}>Mã OTP</Text>
                <TextInput value={otp} onChangeText={t => { setOtp(t.replace(/\D/g, '').slice(0, 6)); setError(''); }} keyboardType="number-pad" autoFocus textContentType="oneTimeCode" autoComplete="sms-otp" maxLength={6}
                  style={[st.phoneInput, { letterSpacing: 6 }]} />
              </View>
              {error ? <Text style={st.error}>{error}</Text> : null}
              <Pressable accessibilityRole="button" disabled={otp.length < 6 || !!busy} style={[st.cta, otp.length === 6 && st.ctaOn]}
                onPress={() => run('otp', () => confirmOtp(confirmation.current!, otp))}>
                {busy === 'otp' ? <ActivityIndicator color={C.white} /> : <Text style={[st.ctaText, otp.length === 6 && { color: C.white }]}>Xác nhận</Text>}
              </Pressable>
              <Pressable hitSlop={8} disabled={wait > 0 || !!busy} onPress={requestOtp} style={{ alignSelf: 'center' }}>
                <Text style={[st.link, wait > 0 && { color: C.muted }]}>{wait > 0 ? `Gửi lại mã sau ${wait}s` : 'Gửi lại mã'}</Text>
              </Pressable>
            </View>
          ) : null}

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
    <Pressable accessibilityRole="button" onPress={onPress} disabled={loading} style={({ pressed }) => [st.social, pressed && { backgroundColor: C.paper }]}>
      <View style={st.socialIcon}>{icon}</View>
      {loading ? <ActivityIndicator color={C.ink} style={{ flex: 1 }} /> : <Text style={st.socialText}>{title}</Text>}
      <View style={st.socialIcon} />
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
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 28, marginBottom: 6, minHeight: 74 },
  h1: { fontSize: 26, fontWeight: '800', color: C.ink, flexShrink: 1, paddingBottom: 6, paddingRight: 8 },
  mascot: { width: 76, height: 76, marginBottom: -18 },
  sub: { fontSize: 15, lineHeight: 22, color: C.text },
  social: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: R.pill, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: C.white, paddingHorizontal: 18 },
  socialIcon: { width: 30, alignItems: 'center', justifyContent: 'center' },
  socialText: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: C.ink },
  or: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orText: { color: C.muted, fontSize: 16 },
  phoneBox: { borderRadius: R.lg, borderWidth: 1.5, borderColor: '#CBD5E1', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, backgroundColor: C.white },
  phoneBoxOn: { borderColor: C.ink, borderWidth: 2 },
  phoneLabel: { fontSize: 13, fontWeight: '700', color: C.ink },
  phoneInput: { fontSize: 18, color: C.ink, paddingVertical: 6, minHeight: 36 },
  cta: { marginTop: 14, height: 54, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F4' },
  ctaOn: { backgroundColor: C.brand },
  ctaText: { fontSize: 18, fontWeight: '800', color: C.ink },
  error: { color: C.danger, fontSize: 14, marginTop: 10 },
  info: { color: C.brandDark, fontSize: 14, marginTop: 10, lineHeight: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  link: { color: C.brand, fontWeight: '800', fontSize: 15 },
  footLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 4, paddingTop: 10 },
  footText: { color: C.muted, fontSize: 13.5, paddingHorizontal: 6 },
  sep: { width: 1, height: 16, backgroundColor: '#E2E8F0' },
});
