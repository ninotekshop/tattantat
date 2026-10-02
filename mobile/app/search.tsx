import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { C, R } from '@/lib/theme';
import { useProducts } from '@/lib/useProducts';
import { ProductCard } from '@/components/ProductCard';
import { Button, Chip, Empty, ErrorBox, Input, Loading } from '@/components/ui';

const SORTS = [{ key: 'new', label: 'Mới nhất' }, { key: 'price_asc', label: 'Giá thấp → cao' }, { key: 'price_desc', label: 'Giá cao → thấp' }];
const CONDS = [{ key: '', label: 'Tất cả' }, { key: 'NEW', label: 'Mới' }, { key: 'LIKE_NEW', label: 'Như mới' }, { key: 'USED_GOOD', label: 'Đã dùng, tốt' }];

export default function SearchScreen() {
  const p = useLocalSearchParams<{ q?: string; categoryId?: string; title?: string }>();
  const { width } = useWindowDimensions();
  const [text, setText] = useState(p.q ?? '');
  const [q, setQ] = useState(p.q ?? '');
  const [sort, setSort] = useState('new');
  const [filter, setFilter] = useState({ minPrice: '', maxPrice: '', condition: '', verified: false });
  const [draft, setDraft] = useState(filter);
  const [show, setShow] = useState(false);
  const params = useMemo(() => ({ q: q || undefined, categoryId: p.categoryId, sort, minPrice: filter.minPrice || undefined, maxPrice: filter.maxPrice || undefined, condition: filter.condition || undefined, verified: filter.verified ? 'true' : undefined }), [q, p.categoryId, sort, filter]);
  const [hot, setHot] = useState<string[]>([]);
  useEffect(() => { api<string[]>('/search/hot-keywords').then(setHot).catch(() => undefined); }, []);
  const list = useProducts(params);
  const col = (width - 36) / 2;
  const active = [filter.minPrice, filter.maxPrice, filter.condition, filter.verified ? '1' : ''].filter(Boolean).length;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: p.title || 'Tìm kiếm' }} />
      <View style={st.bar}>
        <View style={{ flex: 1 }}>
          <Input value={text} onChangeText={setText} placeholder="Tìm điện thoại, xe máy, nhà đất…" returnKeyType="search" autoFocus={!p.categoryId}
            onSubmitEditing={() => setQ(text.trim())} left={<Search size={18} color={C.brand} />}
            right={text ? <Pressable hitSlop={8} onPress={() => { setText(''); setQ(''); }}><X size={18} color={C.muted} /></Pressable> : null} />
        </View>
        <Pressable onPress={() => { setDraft(filter); setShow(true); }} style={[st.filterBtn, active > 0 && { backgroundColor: C.brand }]}>
          <SlidersHorizontal size={20} color={active ? C.white : C.brand} />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingBottom: 8 }}>
        {SORTS.map(s => <Chip key={s.key} label={s.label} active={sort === s.key} onPress={() => setSort(s.key)} />)}
      </ScrollView>
      {!q && !p.categoryId && hot.length ? <View style={{ paddingHorizontal: 12, paddingBottom: 8, gap: 6 }}><Text style={{ color: C.muted, fontWeight: '700', fontSize: 13 }}>Từ khóa HOT</Text><View style={st.wrap}>{hot.map(k => <Chip key={k} label={k} active={false} onPress={() => { setText(k); setQ(k); }} />)}</View></View> : null}
      {!list.loading ? <Text style={st.count}>{list.total.toLocaleString('vi-VN')} tin phù hợp</Text> : null}
      {list.error ? <ErrorBox message={list.error} onRetry={list.refresh} /> : null}
      <FlatList data={list.items} keyExtractor={i => i.id} numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 12 }} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item }) => <ProductCard p={item} width={col} />}
        onEndReached={list.more} onEndReachedThreshold={0.6} refreshing={list.refreshing} onRefresh={list.refresh}
        ListEmptyComponent={list.loading ? <Loading /> : <Empty title="Không tìm thấy tin phù hợp" text="Thử từ khóa khác hoặc bỏ bớt bộ lọc nhé." />} />

      <Modal visible={show} animationType="slide" transparent onRequestClose={() => setShow(false)}>
        <Pressable style={st.backdrop} onPress={() => setShow(false)} />
        <View style={st.sheet}>
          <Text style={st.sheetTitle}>Bộ lọc</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Input label="Giá từ (đ)" keyboardType="number-pad" value={draft.minPrice} onChangeText={v => setDraft({ ...draft, minPrice: v.replace(/\D/g, '') })} /></View>
            <View style={{ flex: 1 }}><Input label="Đến (đ)" keyboardType="number-pad" value={draft.maxPrice} onChangeText={v => setDraft({ ...draft, maxPrice: v.replace(/\D/g, '') })} /></View>
          </View>
          <Text style={st.label}>Tình trạng</Text>
          <View style={st.wrap}>{CONDS.map(c => <Chip key={c.key} label={c.label} active={draft.condition === c.key} onPress={() => setDraft({ ...draft, condition: c.key })} />)}</View>
          <View style={st.wrap}><Chip label="✓ Người bán đã xác thực" active={draft.verified} onPress={() => setDraft({ ...draft, verified: !draft.verified })} /></View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <Button style={{ flex: 1 }} variant="outline" title="Xóa lọc" onPress={() => { const e = { minPrice: '', maxPrice: '', condition: '', verified: false }; setDraft(e); setFilter(e); setShow(false); }} />
            <Button style={{ flex: 1 }} title="Áp dụng" onPress={() => { setFilter(draft); setShow(false); }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12 },
  filterBtn: { width: 50, height: 50, borderRadius: R.md, borderWidth: 1.5, borderColor: C.brand, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
  count: { marginHorizontal: 14, marginBottom: 8, color: C.muted, fontSize: 13 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.35)' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  label: { fontSize: 14, fontWeight: '600', color: C.text },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
