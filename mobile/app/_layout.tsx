import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/auth';
import { C } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Mở đúng màn hình khi người dùng chạm vào thông báo đẩy. */
function openFromNotification(data: Record<string, unknown> | undefined) {
  const type = String(data?.referenceType ?? ''), id = String(data?.referenceId ?? '');
  if (type === 'PRODUCT' && id) router.push({ pathname: '/products/[id]', params: { id } });
  else if (type === 'CHAT' && id) router.push({ pathname: '/chat/[id]', params: { id } });
  else router.push('/notifications');
}

/** Màn chào: logo + tên app + khẩu hiệu, hiện tối thiểu ~1,2 giây trong lúc app khởi động. */
function Splash() {
  const fade = useRef(new Animated.Value(0)).current, rise = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, delay: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 500, delay: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, rise]);
  return (
    <View style={sp.wrap} onLayout={() => SplashScreen.hideAsync().catch(() => undefined)}>
      <Image source={require('../assets/splash-icon.png')} style={sp.logo} contentFit="contain" />
      <Animated.View style={{ alignItems: 'center', opacity: fade, transform: [{ translateY: rise }] }}>
        <Text style={sp.name}>Tất Tần Tật</Text>
        <Text style={sp.tag}>Mua bán dễ dàng - Kết nối mọi người</Text>
      </Animated.View>
    </View>
  );
}
const sp = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', gap: 4 },
  logo: { width: 240, height: 240 },
  name: { fontSize: 34, fontWeight: '800', color: '#0B7A43', letterSpacing: 0.3 },
  tag: { marginTop: 6, fontSize: 14, color: '#64748B' },
});

function Root() {
  const { ready } = useAuth();
  const [minDone, setMinDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMinDone(true), 1200); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(r => openFromNotification(r.notification.request.content.data as Record<string, unknown>));
    Notifications.getLastNotificationResponseAsync().then(r => { if (r) openFromNotification(r.notification.request.content.data as Record<string, unknown>); }).catch(() => undefined);
    return () => sub.remove();
  }, []);
  if (!ready || !minDone) return <Splash />;
  return (
    <Stack screenOptions={{
      headerTintColor: C.ink, headerTitleStyle: { fontWeight: '700' }, headerShadowVisible: false,
      headerStyle: { backgroundColor: C.white }, contentStyle: { backgroundColor: C.paper }, headerBackButtonDisplayMode: 'minimal',
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Đăng nhập', presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="oauth" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="welcome" options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Tạo tài khoản' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Quên mật khẩu' }} />
      <Stack.Screen name="products/[id]" options={{ title: '', headerTransparent: true }} />
      <Stack.Screen name="search" options={{ title: 'Tìm kiếm' }} />
      <Stack.Screen name="chat/[id]" options={{ title: 'Tin nhắn' }} />
      <Stack.Screen name="notifications" options={{ title: 'Thông báo' }} />
      <Stack.Screen name="favorites" options={{ title: 'Tin đã lưu' }} />
      <Stack.Screen name="my-listings" options={{ title: 'Tin đăng của tôi' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Hồ sơ' }} />
      <Stack.Screen name="delete-account" options={{ title: 'Xóa tài khoản' }} />
      <Stack.Screen name="verify" options={{ title: 'Xác minh tài khoản' }} />
      <Stack.Screen name="wallet" options={{ title: 'Số dư & gói của tôi' }} />
      <Stack.Screen name="support" options={{ title: 'Trợ lý TTT' }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Root />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
