import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Bell, Search } from 'lucide-react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { C, R, shadow } from '@/lib/theme';
import { useProducts } from '@/lib/useProducts';
import { ProductCard } from '@/components/ProductCard';
import { Empty, ErrorBox, Loading } from '@/components/ui';
import { TAXONOMY } from '@/lib/taxonomy';

const TABS = [
  { key: 'for_you', label: 'Dành cho bạn' },
  { key: 'nearby', label: 'Gần bạn' },
  { key: 'newest', label: 'Mới nhất' },
  { key: 'video', label: 'Tin Video' },
] as const;

export default function Home() {
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['key']>('for_you');
  const [unread, setUnread] = useState(0);

  const queryParams = useMemo(() => {
    switch (activeTab) {
      case 'nearby':
        return { sort: 'nearby' };
      case 'newest':
        return { sort: 'new' };
      case 'video':
        return { hasVideo: 1 };
      case 'for_you':
      default:
        return { sort: 'recommended' };
    }
  }, [activeTab]);

  const list = useProducts(queryParams);
  const col = (width - 12 * 3) / 2;

  useEffect(() => {
    if (!session) { setUnread(0); return; }
    api<{ count?: number; unread?: number }>('/notifications/unread-count', { auth: true })
      .then(r => setUnread(Number(r.count ?? r.unread ?? 0)))
      .catch(() => undefined);
  }, [session, list.refreshing]);

  const header = (
    <View style={{ paddingBottom: 10 }}>
      <View style={st.top}>
        <Image source={require('../../assets/logo.png')} style={{ width: 132, height: 38 }} contentFit="contain" />
        <Pressable hitSlop={10} onPress={() => router.push(session ? '/notifications' : '/login')} style={st.bell}>
          <Bell size={22} color={C.ink} />
          {unread > 0 ? <View style={st.badge}><Text style={st.badgeText}>{unread > 99 ? '99+' : unread}</Text></View> : null}
        </Pressable>
      </View>

      <Pressable onPress={() => router.push('/search')} style={st.search}>
        <Search size={20} color={C.brand} />
        <Text style={st.searchText}>Bạn muốn mua gì?</Text>
      </Pressable>

      <View style={st.hero}>
        <View style={{ flex: 1 }}>
          <Text style={st.heroTitle}>Mua bán dễ dàng</Text>
          <Text style={st.heroText}>Thanh toán QR an toàn — tiền được giữ đến khi bạn nhận hàng.</Text>
        </View>
        <Image source={require('../../assets/mascot.png')} style={{ width: 84, height: 84 }} contentFit="contain" />
      </View>

      <Text style={st.section}>Danh mục</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}>
        {TAXONOMY.map(c => (
          <Pressable
            key={c.slug}
            onPress={() => router.push({ pathname: '/categories/[id]', params: { id: c.slug, title: c.label } })}
            style={st.cat}
          >
            <Image source={c.icon} style={{ width: 56, height: 56 }} contentFit="contain" />
            <Text numberOfLines={2} style={st.catText}>{c.short}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={st.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.tabBarScroll}>
          {TABS.map(t => {
            const active = activeTab === t.key;
            return (
              <Pressable key={t.key} onPress={() => setActiveTab(t.key)} style={[st.tabItem, active && st.tabItemActive]}>
                <Text style={[st.tabText, active && st.tabTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {list.error ? <ErrorBox message={list.error} onRetry={list.refresh} /> : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.paper }}>
      <FlatList
        data={list.items}
        keyExtractor={i => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 12 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        ListHeaderComponent={header}
        renderItem={({ item }) => <ProductCard p={item} width={col} />}
        onEndReached={list.more}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={C.brand} />}
        ListEmptyComponent={list.loading ? <Loading /> : <Empty title="Chưa có tin đăng" text="Hãy là người đầu tiên đăng tin trong mục này!" />}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 6 },
  bell: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', ...shadow },
  badge: { position: 'absolute', top: 2, right: 2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: C.white, fontSize: 10, fontWeight: '800' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 12, backgroundColor: C.white, borderRadius: R.pill, paddingHorizontal: 16, height: 50, borderWidth: 1.5, borderColor: C.brand },
  searchText: { color: C.muted, fontSize: 15 },
  hero: { marginHorizontal: 12, borderRadius: R.lg, backgroundColor: C.brand, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { color: C.white, fontSize: 20, fontWeight: '800' },
  heroText: { color: 'rgba(255,255,255,.92)', fontSize: 13, marginTop: 4, lineHeight: 18 },
  section: { fontSize: 17, fontWeight: '800', color: C.ink, marginHorizontal: 14, marginTop: 18, marginBottom: 10 },
  cat: { width: 76, alignItems: 'center', gap: 4 },
  catText: { fontSize: 11.5, lineHeight: 14, color: C.text, textAlign: 'center', fontWeight: '600' },
  tabBarContainer: { marginTop: 18, marginBottom: 6 },
  tabBarScroll: { paddingHorizontal: 12, gap: 8 },
  tabItem: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: R.pill, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, ...shadow },
  tabItemActive: { backgroundColor: C.brand, borderColor: C.brand },
  tabText: { fontSize: 14, fontWeight: '700', color: C.text },
  tabTextActive: { color: C.white },
});
