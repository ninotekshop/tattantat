import { StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Sparkles, Plus, Search } from 'lucide-react-native';
import { C, R, shadow } from '@/lib/theme';
import { Button } from '@/components/ui';

/** Màn chúc mừng sau khi đăng ký thành công. */
export default function Welcome() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  return (
    <View style={st.wrap}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <View style={st.card}>
        <View style={st.hero}>
          <View style={st.icon}><Sparkles size={40} color={C.brand} /></View>
          <Text style={st.h1}>Chúc mừng{name ? ` ${name}` : ''}!</Text>
          <Text style={st.sub}>Bạn đã trở thành thành viên của Tất Tần Tật</Text>
        </View>
        <View style={st.body}>
          <Text style={st.text}>Chúc bạn <Text style={{ color: C.brand, fontWeight: '800' }}>mua và bán được thật nhiều sản phẩm</Text> trên Tất Tần Tật. Hãy mua bán thật uy tín nhé!</Text>
          <Text style={st.ask}>Bạn muốn làm gì tiếp theo ?</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button style={{ flex: 1 }} title="Đăng tin bán" icon={<Plus size={18} color={C.white} />} onPress={() => { router.dismissAll(); router.replace('/'); router.push('/sell'); }} />
            <Button style={{ flex: 1 }} variant="outline" title="Tìm sản phẩm" icon={<Search size={18} color={C.brand} />} onPress={() => { router.dismissAll(); router.replace('/'); }} />
          </View>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(15,23,42,.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, backgroundColor: C.white, borderRadius: R.xl, overflow: 'hidden', ...shadow },
  hero: { backgroundColor: C.brand, alignItems: 'center', padding: 24, paddingBottom: 28, gap: 6 },
  icon: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  h1: { color: C.white, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  sub: { color: '#E8FFF3', fontWeight: '700', textAlign: 'center' },
  body: { padding: 20, gap: 12 },
  text: { color: C.text, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  ask: { color: C.ink, fontSize: 16, fontWeight: '800', textAlign: 'center' },
});
