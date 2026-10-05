import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SITE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { C, R, shadow } from '@/lib/theme';
import { AdminHeader } from '@/components/AdminHeader';
import { Avatar, Button } from '@/components/ui';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const u = session?.user;
  const out = () => Alert.alert('Đăng xuất?', 'Bạn sẽ không nhận thông báo đẩy trên thiết bị này nữa.', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Đăng xuất', style: 'destructive', onPress: () => { void signOut().then(() => router.replace('/login')); } },
  ]);
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <AdminHeader title="Cài đặt" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={st.card}>
          <Avatar name={u?.fullName} url={u?.avatarUrl} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={st.name}>{u?.fullName ?? 'Quản trị viên'}</Text>
            <Text style={st.role}>{u?.role === 'SUPER_ADMIN' ? 'Quản trị cấp cao' : u?.role === 'ADMIN' ? 'Quản trị viên' : 'Kiểm duyệt viên'}</Text>
          </View>
        </View>
        <Button variant="outline" title="Mở trang web quản trị đầy đủ" onPress={() => void Linking.openURL(SITE_URL + '/adminttt')} />
        <Button variant="danger" title="Đăng xuất" onPress={out} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.white, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 14, ...shadow },
  name: { fontSize: 17, fontWeight: '800', color: C.ink },
  role: { fontSize: 13, color: C.muted, marginTop: 2 },
});
