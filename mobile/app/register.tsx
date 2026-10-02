import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Check, Eye, EyeOff, Lock, Mail, MapPin, Phone, UserRound } from 'lucide-react-native';
import { api, SITE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Session } from '@/lib/session';
import { ALL_PROVINCES } from '@/lib/locations';
import { C, R } from '@/lib/theme';
import { Button, Input } from '@/components/ui';
import { Picker } from '@/components/Picker';

/** Đăng ký 3 bước, giống web: (1) số điện thoại → (2) họ tên, email, mật khẩu → (3) địa chỉ + đồng ý điều khoản. */
export default function Register() {
  const { signIn } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [f, setF] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [addr, setAddr] = useState({ province: '', district: '', ward: '', street: '' });
  const [terms, setTerms] = useState(true);
  const [wards, setWards] = useState<string[]>([]);
  const wardsData = useRef<Record<string, string[]> | null>(null);
  const setField = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }));

  const provinces = useMemo(() => ALL_PROVINCES.map(p => ({ value: p.name, label: p.name })), []);
  const districtNodes = useMemo(() => ALL_PROVINCES.find(p => p.name === addr.province)?.children ?? [], [addr.province]);
  const districts = useMemo(() => districtNodes.map(d => ({ value: d.name, label: d.name })), [districtNodes]);
  const districtCode = districtNodes.find(d => d.name === addr.district)?.code;

  useEffect(() => {
    if (!districtCode) { setWards([]); return; }
    let on = true;
    (async () => {
      try {
        if (!wardsData.current) wardsData.current = await (await fetch(`${SITE_URL}/data/vn-wards.json`)).json();
        if (on) setWards(wardsData.current?.[districtCode] ?? []);
      } catch { if (on) setWards([]); }
    })();
    return () => { on = false; };
  }, [districtCode]);

  const normalizedPhone = phone.replace(/[\s.-]/g, '');
  const guard = async (fn: () => Promise<void>) => { setBusy(true); setError(''); try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };

  const next1 = () => guard(async () => {
    if (!/^(0|\+84)\d{9}$/.test(normalizedPhone)) throw new Error('Số điện thoại chưa hợp lệ (ví dụ 0901234567).');
    const r = await api<{ exists: boolean }>('/auth/phone/check', { method: 'POST', body: { phone: normalizedPhone } });
    if (r.exists) throw new Error('Số điện thoại này đã được đăng ký. Vui lòng đăng nhập hoặc dùng số khác.');
    setStep(2);
  });
  const next2 = () => guard(async () => {
    if (f.fullName.trim().length < 2 || !f.email.trim() || !f.password) throw new Error('Vui lòng điền đầy đủ họ tên, email và mật khẩu');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) throw new Error('Địa chỉ email chưa hợp lệ');
    if (f.password.length < 8) throw new Error('Mật khẩu tối thiểu 8 ký tự');
    if (f.password !== f.confirm) throw new Error('Mật khẩu xác nhận không trùng khớp');
    const r = await api<{ exists: boolean }>('/auth/email/check', { method: 'POST', body: { email: f.email.trim() } });
    if (r.exists) throw new Error('Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.');
    setStep(3);
  });
  const submit = () => guard(async () => {
    if (!addr.province || !addr.district.trim()) throw new Error('Vui lòng chọn Tỉnh / Thành phố và Quận / Huyện');
    if (!terms) throw new Error('Bạn cần đồng ý với Điều khoản sử dụng & Chính sách bảo mật');
    const address = [addr.street.trim(), addr.ward.trim(), addr.district.trim(), addr.province].filter(Boolean).join(', ').slice(0, 255);
    const s = await api<Session>('/auth/register', { method: 'POST', body: { fullName: f.fullName.trim(), email: f.email.trim(), phone: normalizedPhone, address, password: f.password, termsAgreed: true } });
    await signIn(s); router.dismissAll(); router.replace('/');
    router.push({ pathname: '/welcome', params: { name: f.fullName.trim().split(/\s+/).slice(-1)[0] } });
  });

  const titles = ['Số điện thoại của bạn', 'Thông tin tài khoản', 'Địa chỉ & điều khoản'];
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 22, gap: 14, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Text style={st.h1}>Tạo tài khoản Tất Tần Tật</Text>
        <View style={st.steps}>{[1, 2, 3].map(n => <View key={n} style={[st.dot, step >= n && { backgroundColor: C.brand }]} />)}</View>
        <Text style={st.stepTitle}>Bước {step}/3 · {titles[step - 1]}</Text>

        {step === 1 ? <>
          <Input label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0901234567" textContentType="telephoneNumber" left={<Phone size={18} color={C.muted} />} />
        </> : null}

        {step === 2 ? <>
          <Input label="Họ và tên" value={f.fullName} onChangeText={setField('fullName')} textContentType="name" left={<UserRound size={18} color={C.muted} />} />
          <Input label="Email" value={f.email} onChangeText={setField('email')} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" left={<Mail size={18} color={C.muted} />} />
          <Input label="Mật khẩu (ít nhất 8 ký tự)" value={f.password} onChangeText={setField('password')} secureTextEntry={!show} textContentType="newPassword" left={<Lock size={18} color={C.muted} />}
            right={<Pressable hitSlop={8} onPress={() => setShow(!show)}>{show ? <EyeOff size={18} color={C.muted} /> : <Eye size={18} color={C.muted} />}</Pressable>} />
          <Input label="Nhập lại mật khẩu" value={f.confirm} onChangeText={setField('confirm')} secureTextEntry={!show} left={<Lock size={18} color={C.muted} />}
            error={f.confirm && f.confirm !== f.password ? 'Mật khẩu nhập lại chưa khớp.' : undefined} />
        </> : null}

        {step === 3 ? <>
          <Text style={{ color: C.text }}>Địa chỉ của bạn, dùng cho đăng tin và giao dịch sau này.</Text>
          <Picker label="Tỉnh / Thành phố" value={addr.province} options={provinces} placeholder="Chọn Tỉnh / Thành phố" onChange={v => setAddr({ province: v as string, district: '', ward: '', street: addr.street })} />
          <Picker label="Quận / Huyện / Thị xã / TP" value={addr.district} options={districts} placeholder={addr.province ? 'Chọn Quận / Huyện' : 'Chọn tỉnh trước'} onChange={v => setAddr({ ...addr, district: v as string, ward: '' })} />
          {wards.length > 0
            ? <Picker label="Phường / Xã / Thị trấn" value={addr.ward} options={wards.map(w => ({ value: w, label: w }))} placeholder="Chọn Phường / Xã" onChange={v => setAddr({ ...addr, ward: v as string })} />
            : <Input label="Phường / Xã / Thị trấn" value={addr.ward} onChangeText={v => setAddr({ ...addr, ward: v })} left={<MapPin size={18} color={C.muted} />} />}
          <Input label="Số nhà, tên đường" value={addr.street} onChangeText={v => setAddr({ ...addr, street: v })} textContentType="streetAddressLine1" />
          <Pressable onPress={() => setTerms(!terms)} style={st.terms}>
            <View style={[st.box, terms && { backgroundColor: C.brand, borderColor: C.brand }]}>{terms ? <Check size={14} color={C.white} /> : null}</View>
            <Text style={{ flex: 1, color: C.text, lineHeight: 20 }}>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Tất Tần Tật.</Text>
          </Pressable>
        </> : null}

        {error ? <Text style={{ color: C.danger }}>{error}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {step > 1 ? <Button style={{ flex: 1 }} variant="outline" title="Quay lại" disabled={busy} onPress={() => { setError(''); setStep((step - 1) as 1 | 2); }} /> : null}
          <Button style={{ flex: 2 }} title={step === 3 ? 'Hoàn tất đăng ký' : 'Tiếp tục'} loading={busy} onPress={step === 1 ? next1 : step === 2 ? next2 : submit} />
        </View>
        <Text style={{ textAlign: 'center', color: C.text }}>Đã có tài khoản? <Link href="/login" style={{ color: C.brand, fontWeight: '800' }}>Đăng nhập</Link></Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const st = StyleSheet.create({
  h1: { fontSize: 22, fontWeight: '800', color: C.ink },
  steps: { flexDirection: 'row', gap: 6 },
  dot: { flex: 1, height: 5, borderRadius: R.pill, backgroundColor: C.line },
  stepTitle: { color: C.muted, fontWeight: '700' },
  terms: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: C.muted, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
