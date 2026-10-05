import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { api, media } from '@/lib/api';
import { C, R, shadow } from '@/lib/theme';
import type { Category } from '@/lib/types';
import { ErrorBox, Loading } from '@/components/ui';
import { renderCategoryIcon } from '@/lib/categoryIcons';

const parentOf = (c: Category) => c.parent_id ?? c.parentId ?? null;

export default function Categories() {
  const [all, setAll] = useState<Category[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const load = useCallback(() => {
    setError('');
    api<Category[]>('/categories').then(setAll).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  const roots = all.filter(c => !parentOf(c));
  const go = (c: Category) => router.push({ pathname: '/search', params: { categoryId: String(c.id), title: c.name } });

  if (loading) return <Loading />;
  return (
    <FlatList
      data={roots}
      keyExtractor={c => String(c.id)}
      contentContainerStyle={{ padding: 12, gap: 10 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={C.brand} />}
      ListHeaderComponent={error ? <ErrorBox message={error} onRetry={load} /> : null}
      renderItem={({ item }) => {
        const kids = all.filter(c => parentOf(c) === item.id);
        const expanded = open === item.id;
        return (
          <View style={st.card}>
            <Pressable style={st.row} onPress={() => (kids.length ? setOpen(expanded ? null : item.id) : go(item))}>
              <View style={st.icon}>
                {item.icon_url ? (
                  <Image source={{ uri: media(item.icon_url) }} style={{ width: 36, height: 36 }} contentFit="contain" />
                ) : (
                  renderCategoryIcon(item.slug, item.name, 24, C.brand)
                )}
              </View>
              <Text style={st.name}>{item.name}</Text>
              <ChevronRight size={20} color={C.muted} style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }} />
            </Pressable>
            {expanded ? <View style={st.kids}>
              <Pressable onPress={() => go(item)} style={st.kidRow}>
                <View style={[st.kidIcon, { backgroundColor: C.brandSoft }]}><Text style={{ fontSize: 16 }}>🔥</Text></View>
                <Text style={[st.kidText, { color: C.brand, fontWeight: '700' }]}>Xem tất cả {item.name}</Text>
                <ChevronRight size={16} color={C.brand} />
              </Pressable>
              {kids.map(k => (
                <Pressable key={k.id} onPress={() => go(k)} style={st.kidRow}>
                  <View style={st.kidIcon}>
                    {k.icon_url ? (
                      <Image source={{ uri: media(k.icon_url) }} style={{ width: 24, height: 24 }} contentFit="contain" />
                    ) : (
                      renderCategoryIcon(k.slug, k.name, 18, C.brand)
                    )}
                  </View>
                  <Text style={st.kidText}>{k.name}</Text>
                  <ChevronRight size={16} color={C.muted} />
                </Pressable>
              ))}
            </View> : null}
          </View>
        );
      }}
    />
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: R.lg, overflow: 'hidden', ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  icon: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: C.ink },
  kids: { borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 4 },
  kidRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 16 },
  kidIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  kidText: { flex: 1, fontSize: 15, color: C.text, fontWeight: '600' },
});
