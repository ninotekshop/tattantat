import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';
import { C } from '@/lib/theme';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { Empty, ErrorBox, Loading } from '@/components/ui';

export default function Favorites() {
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => { api<Product[]>('/favorites', { auth: true }).then(setItems).catch(e => setError(e.message)); }, []);
  useFocusEffect(load);
  if (!items) return error ? <ErrorBox message={error} onRetry={load} /> : <Loading />;
  return <FlatList data={items} keyExtractor={i => i.id} numColumns={2} columnWrapperStyle={{ gap: 12, paddingHorizontal: 12 }}
    contentContainerStyle={{ gap: 12, paddingVertical: 12, flexGrow: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={C.brand} />}
    renderItem={({ item }) => <ProductCard p={item} width={(width - 36) / 2} />}
    ListEmptyComponent={<Empty title="Chưa lưu tin nào" text="Bấm biểu tượng ♡ ở tin đăng để lưu lại xem sau." />} />;
}
