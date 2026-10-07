import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { BadgeCheck, Camera, RefreshCw } from 'lucide-react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { C, R } from '@/lib/theme';
import { ErrorBox, Loading } from '@/components/ui';

type Review = 'PENDING' | 'APPROVED' | 'REJECTED';
type Status = {
  phone: string | null; phoneVerified: boolean;
  phoneRequest: { phone: string; status: Review; rejectReason: string | null } | null;
  identityVerified: boolean;
  identity: { status: Review; rejectReason: string | null; createdAt: string } | null;
};
type Pic = { uri: string; name: string; type: string };
type Cap = { token: string; image: string };
type Slot = 'front' | 'back' | 'selfie';

/** Xác minh tài khoản ngay trong app: (1) số điện thoại, (2) danh tính CMND/CCCD. Quản trị viên duyệt thủ công. */
export default function Verify() {
  const { session } = useAuth();
  const [st, setSt] = useState<Status | null>(null), [loadErr, setLoadErr] = useState('');
  const [otpSent, setOtpSent] = useState(false), [code, setCode] = useState('');
  const [phone, setPhone] = useState(''), [name, setName] = useState(''), [idNo, setIdNo] = useState('');
  const [pics, setPics] = useState<Partial<Record<Slot, Pic>>>({});
  const [cap, setCap] = useState<Cap | null>(null), [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState<string | null>(null), [error, setError] = useState(''), [ok, setOk] = useState('');

  const load = useCallback(() => {
    api<Status>('/me/verification', { auth: true }).then(s => { setSt(s); setPhone(p => p || s.phone || ''); setLoadErr(''); }).catch(e => setLoadErr((e as Error).message));
  }, []);
  const newCaptcha = useCallback(() => {
    setAnswer('');
    api<Cap>('/me/verification/captcha', { auth: true }).then(setCap).catch(() => setCap(null));
  }, []);
  useEffect(() => { if (!session) { router.replace('/login'); return; } load(); newCaptcha(); }, [session, load, newCaptcha]);

  const run = async (key: string, fn: () => Promise<string | void>) => {
    setBusy(key); setError(''); setOk('');
    try { const m = await fn(); if (m) setOk(m); load(); } catch (e) { setError((e as Error).message); }
    finally { setBusy(null); newCaptcha(); }
  };
  const sendOtp = () => run('phone', async () => {
    await api('/me/verification/phone/send-otp', { method: 'POST', auth: true, body: { phone: phone.trim() } });
    setOtpSent(true); setCode('');
    return 'Đã gửi mã OTP qua Zalo. Vui lòng nhập mã gồm 6 số.';
  });
  const confirmOtp = () => run('phone-ok', async () => {
    await api('/me/verification/phone/confirm', { method: 'POST', auth: true, body: { code } });
    setOtpSent(false); setCode('');
    return 'Đã xác minh số điện thoại.';
  });
  const submitId = () => run('id', async () => {
    if (!pics.front || !pics.back || !pics.selfie) throw new Error('Vui lòng chọn đủ 3 ảnh.');
    const fd = new FormData();
    fd.append('fullName', name.trim()); fd.append('idNumber', idNo.trim());
    fd.append('front', pics.front as unknown as Blob); fd.append('back', pics.back as unknown as Blob); fd.append('selfie', pics.selfie as unknown as Blob);
    fd.append('captchaToken', cap?.token ?? ''); fd.append('captchaAnswer', answer.trim());
    await api('/me/verification/identity', { method: 'POST', auth: true, body: fd });
    return 'Đã gửi hồ sơ. Quản trị viên sẽ duyệt trong vòng 24 giờ.';
  });

  const pick = async (slot: Slot) => {
    const useCamera = slot === 'selfie';
    const perm = useCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Chưa có quyền', useCamera ? 'Hãy cho phép dùng camera để chụp ảnh chân dung cầm giấy tờ.' : 'Hãy cho phép truy cập thư viện ảnh để chọn ảnh giấy tờ.'); return; }
    const r = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.75 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 });
    const a = r.canceled ? null : r.assets?.[0];
    if (a) setPics(p => ({ ...p, [slot]: { uri: a.uri, name: `${slot}.jpg`, type: a.mimeType || 'image/jpeg' } }));
  };

  if (!st) return loadErr ? <ErrorBox message={loadErr} onRetry={load} /> : <Loading />;

  const captcha = (
    <View style={s.capRow}>
      {cap ? <Image source={{ uri: cap.image }} style={s.capImg} contentFit="contain" /> : <View style={[s.capImg, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={C.brand} /></View>}
      <Pressable accessibilityLabel="Đổi mã khác" hitSlop={8} onPress={newCaptcha} style={s.capBtn}><RefreshCw size={18} color={C.ink} /></Pressable>
      <TextInput value={answer} onChangeText={t => setAnswer(t.toUpperCase())} maxLength={5} autoCapitalize="characters" autoCorrect={false} placeholder="Nhập mã" placeholderTextColor={C.muted} style={[s.input, { flex: 1, minWidth: 90 }]} />
    </View>
  );
  const capOk = answer.trim().length >= 5;
  const Btn = ({ title, onPress, disabled, loading }: { title: string; onPress: () => void; disabled?: boolean; loading?: boolean }) => (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled || !!busy} style={[s.btn, !disabled && s.btnOn]}>
      {loading ? <ActivityIndicator color={C.white} /> : <Text style={[s.btnText, !disabled && { color: C.white }]}>{title}</Text>}
    </Pressable>
  );
  const photo = (slot: Slot, label: string) => (
    <Pressable key={slot} onPress={() => void pick(slot)} style={s.photo}>
      {pics[slot] ? <Image source={{ uri: pics[slot]!.uri }} style={s.photoImg} contentFit="cover" /> : <View style={[s.photoImg, { alignItems: 'center', justifyContent: 'center' }]}><Camera size={22} color={C.muted} /></View>}
      <Text style={s.photoText}>{label}</Text>
      <Text style={s.photoSub}>{pics[slot] ? 'Chạm để đổi ảnh' : slot === 'selfie' ? 'Chạm để chụp' : 'Chạm để chọn'}</Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <Text style={s.lead}>Tài khoản đã xác minh được tin tưởng hơn, không bị giới hạn tin đăng/tin nhắn như tài khoản mới và hiển thị huy hiệu “Đã xác thực”.</Text>
        {error ? <Text style={s.err}>{error}</Text> : null}
        {ok ? <Text style={s.okText}>{ok}</Text> : null}

        <View style={s.card}>
          <Text style={s.h}>1. Số điện thoại {st.phoneVerified ? <Text style={s.done}> <BadgeCheck size={14} color={C.brand} /> Đã xác minh</Text> : null}</Text>
          {st.phoneVerified ? <Text style={s.p}>Số <Text style={s.b}>{st.phone}</Text> đã được xác minh.</Text>
            : <View style={{ gap: 10 }}>
                <TextInput value={phone} onChangeText={setPhone} editable={!otpSent} keyboardType="phone-pad" placeholder="Số điện thoại Zalo, ví dụ 0912345678" placeholderTextColor={C.muted} style={s.input} />
                {!otpSent ? <>
                  <Text style={s.small}>Chúng tôi sẽ gửi mã OTP 6 số qua Zalo tới số này. Xác minh xong ngay, không cần quản trị viên duyệt.</Text>
                  <Btn title="Gửi mã OTP qua Zalo" onPress={sendOtp} disabled={!phone.trim()} loading={busy === 'phone'} />
                </> : <>
                  <TextInput value={code} onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} placeholder="Nhập mã OTP 6 số" placeholderTextColor={C.muted} style={[s.input, { letterSpacing: 4 }]} />
                  <Btn title="Xác nhận" onPress={confirmOtp} disabled={code.length < 6} loading={busy === 'phone-ok'} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Pressable hitSlop={8} disabled={!!busy} onPress={sendOtp}><Text style={s.link}>Gửi lại mã</Text></Pressable>
                    <Pressable hitSlop={8} disabled={!!busy} onPress={() => { setOtpSent(false); setCode(''); }}><Text style={s.link}>Đổi số</Text></Pressable>
                  </View>
                </>}
              </View>}
        </View>

        <View style={s.card}>
          <Text style={s.h}>2. Danh tính (CMND/CCCD) {st.identityVerified ? <Text style={s.done}> <BadgeCheck size={14} color={C.brand} /> Đã xác thực</Text> : null}</Text>
          {st.identityVerified ? <Text style={s.p}>Danh tính của bạn đã được xác thực.</Text>
            : st.identity?.status === 'PENDING' ? <Text style={s.p}>Hồ sơ đang chờ duyệt (thường trong 24 giờ).</Text>
            : <View style={{ gap: 10 }}>
                {st.identity?.status === 'REJECTED' ? <Text style={s.err}>Hồ sơ trước bị từ chối: {st.identity.rejectReason}. Bạn có thể gửi lại.</Text> : null}
                <TextInput value={name} onChangeText={setName} placeholder="Họ và tên đúng như trên giấy tờ" placeholderTextColor={C.muted} style={s.input} />
                <TextInput value={idNo} onChangeText={t => setIdNo(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={12} placeholder="Số CMND (9 số) hoặc CCCD (12 số)" placeholderTextColor={C.muted} style={s.input} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {photo('front', 'Mặt trước')}{photo('back', 'Mặt sau')}{photo('selfie', 'Chân dung')}
                </View>
                <Text style={s.small}>Ảnh chân dung: bạn cầm giấy tờ cạnh mặt. Ảnh được lưu riêng tư, chỉ quản trị viên xác minh xem được và không hiển thị công khai.</Text>
                {captcha}
                <Btn title="Gửi hồ sơ" onPress={submitId} disabled={!name.trim() || !idNo || !pics.front || !pics.back || !pics.selfie || !capOk} loading={busy === 'id'} />
              </View>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 14, paddingBottom: 40 },
  lead: { color: C.muted, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: C.white, borderRadius: R.lg, padding: 14, gap: 10, borderWidth: 1, borderColor: C.line },
  h: { fontSize: 16, fontWeight: '800', color: C.ink },
  done: { color: C.brand, fontSize: 13, fontWeight: '700' },
  p: { fontSize: 14, lineHeight: 20, color: C.text },
  b: { fontWeight: '800', color: C.ink },
  small: { fontSize: 12.5, lineHeight: 18, color: C.muted },
  input: { height: 48, borderRadius: R.md, borderWidth: 1.5, borderColor: '#CBD5E1', paddingHorizontal: 12, fontSize: 15, color: C.ink, backgroundColor: C.white },
  capRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  capImg: { width: 150, height: 50, borderRadius: R.sm, borderWidth: 1, borderColor: C.line, backgroundColor: C.paper },
  capBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  btn: { height: 50, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F4' },
  btnOn: { backgroundColor: C.brand },
  btnText: { fontSize: 16, fontWeight: '800', color: C.ink },
  photo: { flex: 1, alignItems: 'center', gap: 4 },
  photoImg: { width: '100%', aspectRatio: 1, borderRadius: R.md, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  photoText: { fontSize: 13, fontWeight: '700', color: C.ink },
  photoSub: { fontSize: 11.5, color: C.muted },
  link: { color: C.brand, fontWeight: '800', fontSize: 14 },
  err: { color: C.danger, fontSize: 13.5, lineHeight: 19 },
  okText: { color: C.brandDark, fontSize: 13.5, lineHeight: 19, fontWeight: '600' },
});
