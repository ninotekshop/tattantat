import { Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Bell, ClipboardList, LayoutDashboard, Settings, ShieldCheck } from 'lucide-react-native';
import { useCounts } from '@/lib/counts';
import { C } from '@/lib/theme';

function Badge({ n }: { n: number }) {
  if (!n) return null;
  return <View style={{ position: 'absolute', top: -4, right: -10, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}><Text style={{ color: C.white, fontSize: 10.5, fontWeight: '800' }}>{n > 99 ? '99+' : n}</Text></View>;
}
const Ico = ({ n, children }: { n?: number; children: React.ReactNode }) => <View>{children}<Badge n={n ?? 0} /></View>;

export default function TabsLayout() {
  const { counts } = useCounts();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: C.brandDark, tabBarInactiveTintColor: '#94A3B8', tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }, tabBarStyle: { borderTopColor: C.line } }}>
      <Tabs.Screen name="index" options={{ title: 'Tổng quan', tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={22} /> }} />
      <Tabs.Screen name="verify" options={{ title: 'Xác minh', tabBarIcon: ({ color }) => <Ico n={counts['xac-minh']}><ShieldCheck color={color} size={22} /></Ico> }} />
      <Tabs.Screen name="listings" options={{ title: 'Tin đăng', tabBarIcon: ({ color }) => <Ico n={counts['tin-dang']}><ClipboardList color={color} size={22} /></Ico> }} />
      <Tabs.Screen name="notices" options={{ title: 'Thông báo', tabBarIcon: ({ color }) => <Bell color={color} size={22} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Cài đặt', tabBarIcon: ({ color }) => <Settings color={color} size={22} /> }} />
    </Tabs>
  );
}
