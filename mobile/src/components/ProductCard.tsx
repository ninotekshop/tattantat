import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BadgeCheck, MapPin, PlayCircle } from 'lucide-react-native';
import { media } from '@/lib/api';
import { vnd, timeAgo } from '@/lib/format';
import { C, R, shadow } from '@/lib/theme';
import type { Product } from '@/lib/types';

export const ProductCard = memo(function ProductCard({ p, width }: { p: Product; width: number }) {
  return (
    <Pressable onPress={() => router.push({ pathname: '/products/[id]', params: { id: p.id } })} style={({ pressed }) => [st.card, { width }, pressed && { opacity: 0.9 }]}>
      <View>
        <Image source={{ uri: media(p.imageUrl || p.images?.[0]) }} style={{ width, height: width, backgroundColor: C.paper }} contentFit="cover" transition={150} placeholder={require('../../assets/splash-icon.png')} placeholderContentFit="contain" />
        {p.hasVideo ? <View style={st.video}><PlayCircle size={18} color={C.white} /></View> : null}
      </View>
      <View style={{ padding: 10, gap: 4 }}>
        <Text numberOfLines={2} style={st.title}>{p.title}</Text>
        <Text style={st.price}>{vnd(p.price, p.priceMode)}</Text>
        <View style={st.row}><MapPin size={12} color={C.muted} /><Text numberOfLines={1} style={st.meta}>{p.location}</Text></View>
        <View style={st.row}>
          {p.sellerVerified ? <BadgeCheck size={12} color={C.brand} /> : null}
          <Text numberOfLines={1} style={st.meta}>{timeAgo(p.postedAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
});

const st = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: R.md, overflow: 'hidden', ...shadow },
  title: { fontSize: 14, fontWeight: '600', color: C.ink, minHeight: 36 },
  price: { fontSize: 15, fontWeight: '800', color: C.danger },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12, color: C.muted, flex: 1 },
  video: { position: 'absolute', right: 6, top: 6, backgroundColor: 'rgba(0,0,0,.45)', borderRadius: 99, padding: 3 },
});
