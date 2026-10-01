import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { api, media } from '@/lib/api';
import { saveSession, currentSession } from '@/lib/session';
import { C } from '@/lib/theme';
import type { Me } from '@/lib/types';
import { Avatar, Button, Input, Loading } from '@/components/ui';

export default function EditProfile() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState(''), [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<Me>('/me', { auth: true }).then(m => { setMe(m); setName(m.full_name); }).catch(e => Alert.alert('Lỗi', e.message)); }, []);

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true });
    if (!r.canceled && r.assets[0]?.base64) setAvatar(`data:${r.assets[0].mimeType ?? 'image/jpeg'};base64,${r.assets[0].base64}`);
  };
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
      <Input label="Họ và tên" value={name} onChangeText={setName} />
      <Input label="Email" value={me.email ?? 'Chưa có'} editable={false} />
      <Input label="Số điện thoại" value={me.phone ?? 'Chưa có'} editable={false} />
      <Text style={{ color: C.muted, fontSize: 13 }}>Để đổi email/số điện thoại, vui lòng liên hệ hotro@tattantat.vn.</Text>
      <Button title="Lưu thay đổi" loading={busy} disabled={name.trim().length < 2} onPress={save} />
    </ScrollView>
  );
}
