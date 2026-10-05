import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '@/lib/theme';

/** Thanh đầu trang: logo thật + nhãn Quản trị, dùng chung cho các tab. */
export function AdminHeader({ title, right }: { title?: string; right?: React.ReactNode }) {
  return (
    <SafeAreaView edges={['top']} style={st.wrap}>
      <View style={st.row}>
        <Image source={require('../../assets/logo.png')} style={{ width: 120, height: 34 }} contentFit="contain" />
        <View style={st.chip}><Text style={st.chipText}>Quản trị</Text></View>
        <View style={{ flex: 1 }} />
        {right}
      </View>
      {title ? <Text style={st.title}>{title}</Text> : null}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  wrap: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.line, paddingHorizontal: 16, paddingBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 6 },
  chip: { backgroundColor: C.brandDark, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { color: C.white, fontSize: 11.5, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '800', color: C.ink, marginTop: 10 },
});
