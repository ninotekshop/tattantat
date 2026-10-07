import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { Bell, Bot, ChevronRight, FileText, Heart, LogOut, PackageOpen, ShieldCheck, Sparkles, Trash2, UserRound, type LucideIcon } from 'lucide-react-native';
import { api, media, SITE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { C, R, shadow } from '@/lib/theme';
import type { Me } from '@/lib/types';
import { Avatar } from '@/components/ui';
import TrustBadge from '@/components/TrustBadge';
import { LoginRequired } from '@/components/LoginRequired';

function Row({ icon: Icon, label, onPress, danger }: { icon: LucideIcon; label: string; onPress: () => void; danger?: boolean }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [st.row, pressed && { backgroundColor: C.paper }]}>
    <View style={[st.rowIcon, danger && { backgroundColor: C.dangerSoft }]}><Icon size={19} color={danger ? C.danger : C.brand} /></View>
    <Text style={[st.rowText, danger && { color: C.danger }]}>{label}</Text>
    <ChevronRight size={18} color="#CBD5E1" />
  </Pressable>;
}

export default function Account() {
  const { session, signOut } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  useFocusEffect(useCallback(() => { if (session) api<Me>('/me', { auth: true }).then(setMe).catch(() => undefined); else setMe(null); }, [session]));

  const web = (path: string) => Linking.openURL(SITE_URL + path);
  const support = () => router.push('/support');
  if (!session) return <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
    <LoginRequired text="Đăng nhập để quản lý tin đăng, tin nhắn và tài khoản của bạn." />
    <View style={[st.group, { marginBottom: 24 }]}>
      <Row icon={Bot} label="Trợ lý TTT — hỏi đáp nhanh" onPress={support} />
      <Row icon={FileText} label="Điều khoản sử dụng" onPress={() => web('/terms')} />
      <Row icon={ShieldCheck} label="Chính sách bảo mật" onPress={() => web('/privacy')} />
    </View>
  </ScrollView>;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <Pressable onPress={() => router.push('/edit-profile')} style={st.head}>
        <Avatar name={me?.full_name ?? session.user.fullName} url={media(me?.avatar_url ?? session.user.avatarUrl)} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={st.name}>{me?.full_name ?? session.user.fullName}</Text>
          <TrustBadge userId={session.user.id} />
          <Text style={st.sub}>{me?.email ?? me?.phone ?? 'Xem và sửa hồ sơ'}</Text>
          {me?.phone_verified ? <Text style={st.badge}>✓ Đã xác minh SĐT</Text> : null}
        </View>
        <ChevronRight size={20} color={C.muted} />
      </Pressable>
      {!(me?.avatar_url ?? session.user.avatarUrl) ? (
        <Pressable onPress={() => router.push('/edit-profile')} style={{ marginHorizontal: 14, marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: C.brandSoft }}>
          <Text style={{ color: C.brandDark, fontSize: 13.5, lineHeight: 19, fontWeight: '600' }}>Thêm ảnh chân dung thật để tăng điểm uy tín khi giao dịch. Chạm để cập nhật ảnh đại diện.</Text>
        </Pressable>
      ) : null}

      <Text style={st.groupTitle}>Mua bán</Text>
      <View style={st.group}>
        <Row icon={PackageOpen} label="Tin đăng của tôi" onPress={() => router.push('/my-listings')} />
        <Row icon={Sparkles} label="Số dư & gói của tôi" onPress={() => router.push('/wallet')} />
        <Row icon={Heart} label="Tin đã lưu" onPress={() => router.push('/favorites')} />
        <Row icon={Bell} label="Thông báo" onPress={() => router.push('/notifications')} />
      </View>

      <Text style={st.groupTitle}>Tài khoản</Text>
      <View style={st.group}>
        <Row icon={UserRound} label="Hồ sơ cá nhân" onPress={() => router.push('/edit-profile')} />
        <Row icon={ShieldCheck} label="Xác minh tài khoản" onPress={() => router.push('/verify')} />
        <Row icon={Bot} label="Trợ lý TTT" onPress={support} />
      </View>

      <Text style={st.groupTitle}>Khác</Text>
      <View style={st.group}>
        <Row icon={FileText} label="Điều khoản sử dụng" onPress={() => web('/terms')} />
        <Row icon={ShieldCheck} label="Chính sách bảo mật" onPress={() => web('/privacy')} />
        <Row icon={LogOut} label="Đăng xuất" onPress={() => Alert.alert('Đăng xuất', 'Bạn muốn đăng xuất khỏi Tất Tần Tật?', [{ text: 'Hủy', style: 'cancel' }, { text: 'Đăng xuất', style: 'destructive', onPress: () => void signOut() }])} />
        <Row icon={Trash2} label="Xóa tài khoản" danger onPress={() => router.push('/delete-account')} />
      </View>
      <Text style={st.version}>Tất Tần Tật · phiên bản {Constants.expoConfig?.version}</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.white, margin: 12, padding: 16, borderRadius: R.lg, ...shadow },
  name: { fontSize: 18, fontWeight: '800', color: C.ink },
  sub: { color: C.muted, marginTop: 2 },
  badge: { color: C.brand, fontWeight: '700', fontSize: 12, marginTop: 4 },
  groupTitle: { marginHorizontal: 18, marginTop: 14, marginBottom: 6, color: C.muted, fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  group: { backgroundColor: C.white, marginHorizontal: 12, borderRadius: R.lg, overflow: 'hidden', ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  rowIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, fontSize: 15, fontWeight: '600', color: C.ink },
  version: { textAlign: 'center', color: C.muted, fontSize: 12, marginTop: 18 },
});
