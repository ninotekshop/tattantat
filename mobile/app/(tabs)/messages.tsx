import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { api, media } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { vnd } from '@/lib/format';
import { C, R, shadow } from '@/lib/theme';
import type { Chat } from '@/lib/types';
import { Empty, ErrorBox, Loading } from '@/components/ui';
import { LoginRequired } from '@/components/LoginRequired';

export default function Messages() {
  const { session } = useAuth();
  const [items, setItems] = useState<Chat[] | null>(null);
  const [error, setError] = useState(''), [refreshing, setRefreshing] = useState(false);
  const load = useCallback(() => {
    if (!session) return;
    api<Chat[]>('/chats', { auth: true }).then(setItems).catch(e => setError(e.message)).finally(() => setRefreshing(false));
  }, [session]);
  useFocusEffect(useCallback(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]));

  if (!session) return <LoginRequired text="Đăng nhập để nhắn tin với người mua và người bán." />;
  if (!items) return error ? <ErrorBox message={error} onRetry={load} /> : <Loading />;
  return (
    <FlatList data={items} keyExtractor={c => c.id} contentContainerStyle={{ padding: 12, gap: 10, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.brand} />}
      ListEmptyComponent={<Empty title="Chưa có tin nhắn" text="Bấm “Nhắn tin với người bán” ở một tin đăng để bắt đầu trò chuyện." />}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, title: item.other_name, otherId: item.other_id } })} style={({ pressed }) => [st.item, pressed && { opacity: 0.85 }]}>
          <Image source={{ uri: media(item.product_image) }} style={st.thumb} contentFit="cover" />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text numberOfLines={1} style={st.name}>{item.other_name}</Text>
              {item.unread_count ? <View style={st.dot}><Text style={st.dotText}>{item.unread_count}</Text></View> : null}
            </View>
            <Text numberOfLines={1} style={st.product}>{item.product_title} · {vnd(item.product_price, item.product_price_mode)}</Text>
            <Text numberOfLines={1} style={st.last}>{item.last_message ?? 'Bắt đầu cuộc trò chuyện'}</Text>
          </View>
        </Pressable>
      )} />
  );
}

const st = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12, backgroundColor: C.white, borderRadius: R.lg, padding: 12, ...shadow },
  thumb: { width: 60, height: 60, borderRadius: 12, backgroundColor: C.paper },
  name: { fontSize: 16, fontWeight: '700', color: C.ink, flex: 1 },
  product: { fontSize: 13, color: C.brandDark },
  last: { fontSize: 14, color: C.muted },
  dot: { backgroundColor: C.danger, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  dotText: { color: C.white, fontSize: 11, fontWeight: '800' },
});
