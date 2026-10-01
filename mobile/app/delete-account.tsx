import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { clearSession } from '@/lib/session';
import { C, R } from '@/lib/theme';
import type { Me } from '@/lib/types';
import { Button, Input } from '@/components/ui';

export default function DeleteAccount() {
  const { signOut } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [pw, setPw] = useState(''), [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { api<Me>('/me', { auth: true }).then(setMe).catch(() => undefined); }, []);
  const usesPassword = !!me?.email; // tài khoản email thường có mật khẩu; tài khoản OTP/mạng xã hội gõ XOA

  const submit = () => Alert.alert('Xóa vĩnh viễn tài khoản?', 'Hành động này không thể hoàn tác.', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Xóa tài khoản', style: 'destructive', onPress: async () => {
      setBusy(true); setError('');
      try {
        await api('/me', { method: 'DELETE', auth: true, body: usesPassword && pw ? { password: pw } : { confirm } });
        await signOut().catch(() => clearSession());
        Alert.alert('Đã xóa tài khoản', 'Cảm ơn bạn đã sử dụng Tất Tần Tật.');
        router.dismissAll(); router.replace('/');
      } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
    } },
  ]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View style={{ backgroundColor: C.dangerSoft, borderRadius: R.lg, padding: 16, gap: 8 }}>
        <TriangleAlert size={28} color={C.danger} />
        <Text style={{ fontSize: 17, fontWeight: '800', color: C.danger }}>Bạn sắp xóa tài khoản</Text>
        <Text style={{ color: C.text, lineHeight: 21 }}>• Hồ sơ, email, số điện thoại sẽ bị xóa.{'\n'}• Tất cả tin đăng sẽ bị gỡ, tin đã lưu bị xóa.{'\n'}• Lịch sử đơn hàng được giữ ẩn danh theo quy định giao dịch.{'\n'}• Bạn cần hoàn tất các đơn đang xử lý trước khi xóa.</Text>
      </View>
      {usesPassword
        ? <Input label="Nhập mật khẩu để xác nhận" value={pw} onChangeText={setPw} secureTextEntry />
        : <Input label='Gõ "XOA" để xác nhận' value={confirm} onChangeText={setConfirm} autoCapitalize="characters" />}
      {usesPassword ? <Text style={{ color: C.muted, fontSize: 13 }}>Tài khoản đăng nhập bằng Google/Apple không có mật khẩu? Để trống ô trên và gõ XOA vào ô dưới.</Text> : null}
      {usesPassword ? <Input label='Hoặc gõ "XOA"' value={confirm} onChangeText={setConfirm} autoCapitalize="characters" /> : null}
      {error ? <Text style={{ color: C.danger }}>{error}</Text> : null}
      <Button variant="danger" title="Xóa vĩnh viễn tài khoản" loading={busy} disabled={!pw && confirm.trim().toUpperCase() !== 'XOA'} onPress={submit} />
    </ScrollView>
  );
}
