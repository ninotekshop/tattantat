import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { api, media } from '@/lib/api';
import { saveSession, currentSession } from '@/lib/session';
import { C } from '@/lib/theme';
import type { Me } from '@/lib/types';
import { Avatar, Button, Input, Loading } from '@/components/ui';
import ReferralCard from '@/components/ReferralCard';

export default function EditProfile() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState(''), [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<Me>('/me', { auth: true }).then(m => { setMe(m); setName(m.full_name); }).catch(e => Alert.alert('Lỗi', e.message)); }, []);

  /** Thu nhỏ ảnh vuông 384px (~30-60KB) để luôn nằm trong giới hạn của máy chủ. */
  const apply = async (uri: string) => {
    try {
      const ctx = ImageManipulator.manipulate(uri); ctx.resize({ width: 384 });
      const out = await (await ctx.renderAsync()).saveAsync({ compress: 0.8, format: SaveFormat.JPEG, base64: true });
      if (out.base64) setAvatar(`data:image/jpeg;base64,${out.base64}`);
    } catch { Alert.alert('Chưa xử lý được ảnh', 'Vui lòng chọn ảnh khác.'); }
  };
  const take = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Chưa có quyền', camera ? 'Hãy cho phép dùng camera để chụp ảnh chân dung.' : 'Hãy cho phép truy cập thư viện ảnh.'); return; }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, cameraType: ImagePicker.CameraType.front };
    const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!r.canceled && r.assets[0]?.uri) await apply(r.assets[0].uri);
  };
  const pick = () => Alert.alert('Ảnh đại diện', 'Nên dùng ảnh chân dung thật của bạn.', [
    { text: 'Chụp ảnh chân dung', onPress: () => void take(true) },
    { text: 'Chọn từ thư viện', onPress: () => void take(false) },
    { text: 'Hủy', style: 'cancel' },
  ]);
  const save = async () => {
    setBusy(true);
    try {
      const u = await api<{ full_name: string; avatar_url: string | null }>('/me', { method: 'PATCH', auth: true, body: { fullName: name.trim(), ...(avatar ? { avatarUrl: avatar } : {}) } });
      const s = currentSession(); if (s) await saveSession({ ...s, user: { ...s.user, fullName: u.full_name, avatarUrl: u.avatar_url } });
      Alert.alert('Đã lưu', 'Thông tin cá nhân đã được cập nhật.'); router.back();
    } catch (e) { Alert.alert('Chưa lưu được', (e as Error).message); } finally { setBusy(false); }
  };
  if (!me) return <Loading />;
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Pressable onPress={pick} style={{ alignSelf: 'center' }}>
        <Avatar name={name} url={avatar ?? media(me.avatar_url)} size={96} />
        <View style={{ position: 'absolute', right: 0, bottom: 0, backgroundColor: C.brand, borderRadius: 16, padding: 7, borderWidth: 2, borderColor: C.white }}><Camera size={16} color={C.white} /></View>
      </Pressable>
      <View style={{ backgroundColor: C.brandSoft, borderRadius: 12, padding: 12 }}>
        <Text style={{ color: C.brandDark, fontSize: 13.5, lineHeight: 19 }}>Dùng ảnh chân dung thật, rõ khuôn mặt (không dùng logo hay ảnh người khác). Hồ sơ có ảnh thật giúp người mua và người bán tin tưởng hơn và tăng điểm uy tín khi giao dịch.</Text>
      </View>
      <Input label="Họ và tên" value={name} onChangeText={setName} />
      <Input label="Email" value={me.email ?? 'Chưa có'} editable={false} />
      <Input label="Số điện thoại" value={me.phone ?? 'Chưa có'} editable={false} />
      <Text style={{ color: C.muted, fontSize: 13 }}>Để đổi email/số điện thoại, vui lòng liên hệ hotro@tattantat.vn.</Text>
      <ReferralCard />
      <Button title="Lưu thay đổi" loading={busy} disabled={name.trim().length < 2} onPress={save} />
    </ScrollView>
  );
}
