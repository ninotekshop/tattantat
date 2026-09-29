import { Tabs } from 'expo-router';
import { Home, Grid, PlusCircle, MessageSquare, User } from 'lucide-react-native';
import { COLORS, FONTS } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.brand,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.line,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.medium,
          fontSize: 11,
        },
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTitleStyle: {
          fontFamily: FONTS.bold,
          color: COLORS.ink,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Danh mục',
          headerTitle: 'Tất cả danh mục',
          tabBarIcon: ({ color, size }) => <Grid color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Đăng tin',
          headerTitle: 'Đăng tin rao bán',
          tabBarIcon: ({ color }) => <PlusCircle color={COLORS.brand} size={30} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Tin nhắn',
          headerTitle: 'Hộp thư thoại & Chat',
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          headerTitle: 'Trang cá nhân',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
