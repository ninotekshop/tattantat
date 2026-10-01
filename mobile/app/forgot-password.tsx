import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { Mail } from 'lucide-react-native';
import { api } from '@/lib/api';
import { C } from '@/lib/theme';
import { Button, Input } from '@/components/ui';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState(''), [error, setError] = useState('');
  const submit = async () => {
    setBusy(true); setError(''); setMsg('');
    try { await api('/auth/forgot-password', { method: 'POST', body: { email: email.trim() } }); setMsg('Nếu email này đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu trong ít phút. Hãy kiểm tra cả mục Spam.'); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <ScrollView style={{ backgroundColor: C.white }} contentContainerStyle={{ padding: 22, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Text style={{ color: C.text, fontSize: 15, lineHeight: 22 }}>Nhập email đăng ký, chúng tôi sẽ gửi liên kết để bạn tạo mật khẩu mới.</Text>
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" left={<Mail size={18} color={C.muted} />} />
      {error ? <Text style={{ color: C.danger }}>{error}</Text> : null}
      {msg ? <Text style={{ color: C.brandDark, backgroundColor: C.brandSoft, padding: 12, borderRadius: 12, lineHeight: 20 }}>{msg}</Text> : null}
      <Button title="Gửi liên kết" loading={busy} disabled={!/.+@.+\..+/.test(email.trim())} onPress={submit} />
    </ScrollView>
  );
}
