import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập Email và Mật khẩu.');
      return;
    }
    Alert.alert('Thành công', 'Đăng nhập thành công!');
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng trở lại!</Text>
      <Text style={styles.subtitle}>Đăng nhập tài khoản Tất Tần Tật của bạn</Text>

      <Text style={styles.label}>Email / Số điện thoại</Text>
      <TextInput
        style={styles.input}
        placeholder="nhapemail@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Mật khẩu</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleLogin}>
        <Text style={styles.submitBtnText}>Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.white,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 22,
    color: COLORS.ink,
    marginTop: 20,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: COLORS.muted,
    marginBottom: 24,
    marginTop: 4,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.ink,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.regular,
    fontSize: 14,
    backgroundColor: COLORS.paper,
  },
  submitBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.white,
  },
});
