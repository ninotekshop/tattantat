import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '../../constants/theme';
import { User, Package, Heart, Settings, LogOut, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* USER HEADER */}
      <View style={styles.userHeader}>
        <View style={styles.avatarBg}>
          <User size={32} color={COLORS.brand} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Thành viên Tất Tần Tật</Text>
          <Text style={styles.userSub}>Chưa đăng nhập</Text>
        </View>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
          <Text style={styles.loginBtnText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>

      {/* MENU LIST */}
      <View style={styles.menuGroup}>
        <TouchableOpacity style={styles.menuItem}>
          <Package size={20} color={COLORS.ink} style={{ marginRight: 12 }} />
          <Text style={styles.menuText}>Tin đăng của tôi</Text>
          <ChevronRight size={18} color={COLORS.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Heart size={20} color={COLORS.ink} style={{ marginRight: 12 }} />
          <Text style={styles.menuText}>Tin đã lưu / Yêu thích</Text>
          <ChevronRight size={18} color={COLORS.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Settings size={20} color={COLORS.ink} style={{ marginRight: 12 }} />
          <Text style={styles.menuText}>Cài đặt tài khoản</Text>
          <ChevronRight size={18} color={COLORS.muted} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    marginBottom: 12,
  },
  avatarBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.ink,
  },
  userSub: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  loginBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    color: COLORS.white,
  },
  menuGroup: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  menuText: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.ink,
  },
});
