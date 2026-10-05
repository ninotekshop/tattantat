import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { C, R, shadow } from '@/lib/theme';
import { findTaxonomy } from '@/lib/taxonomy';

export default function CategoryChildren() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const cat = findTaxonomy(String(id));
  const name = cat?.label || title || 'Danh mục';
  const go = (slug: string, label: string) => router.push({ pathname: '/search', params: { categorySlug: slug, title: label } });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ padding: 14, gap: 14 }}>
      <Stack.Screen options={{ title: name }} />
      <Pressable style={st.all} onPress={() => go(String(id), name)}>
        {cat ? <Image source={cat.icon} style={{ width: 64, height: 64 }} contentFit="contain" /> : null}
        <View style={{ flex: 1 }}>
          <Text style={st.allTitle}>Tất cả {name}</Text>
          <Text style={st.allSub}>Xem toàn bộ tin trong danh mục</Text>
        </View>
        <ChevronRight size={20} color={C.muted} />
      </Pressable>
      <Text style={st.head}>Danh mục con</Text>
      <View style={st.grid}>
        {(cat?.subs ?? []).map(s => (
          <Pressable key={s.slug} style={st.sub} onPress={() => go(s.slug, s.name)}>
            <View style={st.dot} />
            <Text style={st.subText}>{s.name}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  all: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.white, borderRadius: R.lg, padding: 12, borderWidth: 1, borderColor: C.line, ...shadow },
  allTitle: { fontSize: 16, fontWeight: '800', color: C.ink },
  allSub: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  head: { fontSize: 14, fontWeight: '800', color: C.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sub: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, borderRadius: R.md, borderWidth: 1, borderColor: C.line, padding: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.brand },
  subText: { flex: 1, fontSize: 14, fontWeight: '600', color: C.ink, lineHeight: 18 },
});
