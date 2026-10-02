import { useEffect } from 'react';
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

function Root() {
  const { ready } = useAuth();
  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => undefined); }, [ready]);
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(r => openFromNotification(r.notification.request.content.data as Record<string, unknown>));
    Notifications.getLastNotificationResponseAsync().then(r => { if (r) openFromNotification(r.notification.request.content.data as Record<string, unknown>); }).catch(() => undefined);
    return () => sub.remove();
  }, []);
  if (!ready) return null;
  return (
    <Stack screenOptions={{
      headerTintColor: C.ink, headerTitleStyle: { fontWeight: '700' }, headerShadowVisible: false,
      headerStyle: { backgroundColor: C.white }, contentStyle: { backgroundColor: C.paper }, headerBackButtonDisplayMode: 'minimal',
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Đăng nhập', presentation: 'modal' }} />
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
