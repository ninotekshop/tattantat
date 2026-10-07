import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { House, ClipboardList, MessageCircle, Plus, UserRound } from 'lucide-react-native';
import { C } from '@/lib/theme';
import { tap } from '@/lib/haptic';

export default function TabsLayout() {
  return (
    <Tabs screenListeners={{ tabPress: () => tap() }} screenOptions={{
      tabBarActiveTintColor: C.brand, tabBarInactiveTintColor: '#94A3B8',
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }, headerShadowVisible: false,
      headerTitleStyle: { fontWeight: '800' }, tabBarStyle: { borderTopColor: C.line },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', headerShown: false, tabBarIcon: ({ color }) => <House color={color} size={22} /> }} />
      <Tabs.Screen name="manage" options={{ title: 'Quản lý tin', tabBarIcon: ({ color }) => <ClipboardList color={color} size={22} /> }} />
      <Tabs.Screen name="categories" options={{ href: null }} />
      <Tabs.Screen name="sell" options={{
        title: 'Đăng tin', tabBarLabel: 'Đăng tin',
        tabBarIcon: () => <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center', marginTop: -18, borderWidth: 4, borderColor: C.white }}><Plus color={C.white} size={24} /></View>,
      }} />
      <Tabs.Screen name="messages" options={{ title: 'Tin nhắn', tabBarIcon: ({ color }) => <MessageCircle color={color} size={22} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Tài khoản', tabBarIcon: ({ color }) => <UserRound color={color} size={22} /> }} />
    </Tabs>
  );
}
