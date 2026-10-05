import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { getNotifications } from '@/lib/notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/auth';
import { CountsProvider } from '@/lib/counts';
import { C } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Chạm vào thông báo đẩy → mở đúng tab cần xử lý. */
function openFromNotification(data: Record<string, unknown> | undefined) {
  const type = String(data?.type ?? data?.referenceType ?? '');
  if (type.includes('VERIF') || type.includes('IDENTITY')) router.push('/verify');
  else if (type.includes('LISTING') || type.includes('PRODUCT') || type.includes('MODERATION')) router.push('/listings');
  else router.push('/notices');
}

function Root() {
  const { ready, session } = useAuth();
  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => undefined); }, [ready]);
  useEffect(() => {
    const Notifications = getNotifications();
    if (!Notifications) return;
    const sub = Notifications.addNotificationResponseReceivedListener(r => openFromNotification(r.notification.request.content.data as Record<string, unknown>));
    return () => sub.remove();
  }, []);
  useEffect(() => { if (ready && !session) router.replace('/login'); }, [ready, session]);
  if (!ready) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
    </Stack>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <CountsProvider>
            <StatusBar style="dark" />
            <Root />
          </CountsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
