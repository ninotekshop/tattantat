import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Session } from '@/lib/session';
import { C } from '@/lib/theme';
import { Button, Input } from '@/components/ui';

export default function Register() {
  const { signIn } = useAuth();
  const [f, setF] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const valid = f.fullName.trim().length >= 2 && (f.email.trim() || f.phone.trim()) && f.password.length >= 8 && f.password === f.confirm;

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const s = await api<Session>('/auth/register', { method: 'POST', body: { fullName: f.fullName.trim(), email: f.email.trim() || undefined, phone: f.phone.trim() || undefined, password: f.password } });
      await signIn(s); router.dismissAll(); router.replace('/');
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 22, gap: 14, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Text style={st.h1}>Tạo tài khoản Tất Tần Tật</Text>
        <Input label="Họ và tên" value={f.fullName} onChangeText={set('fullName')} textContentType="name" />
        <Input label="Email" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
        <Input label="Số điện thoại (không bắt buộc)" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <Input label="Mật khẩu (ít nhất 8 ký tự)" value={f.password} onChangeText={set('password')} secureTextEntry textContentType="newPassword" />
        <Input label="Nhập lại mật khẩu" value={f.confirm} onChangeText={set('confirm')} secureTextEntry error={f.confirm && f.confirm !== f.password ? 'Mật khẩu nhập lại chưa khớp.' : undefined} />
        {error ? <Text style={{ color: C.danger }}>{error}</Text> : null}
        <Button title="Đăng ký" loading={busy} disabled={!valid} onPress={submit} />
        <Text style={{ color: C.muted, fontSize: 12, textAlign: 'center' }}>Khi đăng ký, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Tất Tần Tật.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const st = StyleSheet.create({ h1: { fontSize: 22, fontWeight: '800', color: C.ink, marginBottom: 4 } });
