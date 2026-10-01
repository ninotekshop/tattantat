import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import { removeAccents } from '@/lib/locations';
import { C, R } from '@/lib/theme';
import { Input } from './ui';

export type Option = { value: string; label: string };

/** Ô chọn mở danh sách toàn màn hình, có tìm kiếm không dấu; hỗ trợ chọn nhiều. */
export function Picker({ label, value, options, onChange, placeholder = 'Chọn…', multiple, error, required }: {
  label?: string; value: string | string[] | undefined; options: Option[]; onChange: (v: string | string[]) => void;
  placeholder?: string; multiple?: boolean; error?: string; required?: boolean;
}) {
  const [open, setOpen] = useState(false), [q, setQ] = useState('');
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const shown = useMemo(() => { const k = removeAccents(q.trim().toLowerCase()); return k ? options.filter(o => removeAccents(o.label.toLowerCase()).includes(k)) : options; }, [q, options]);
  const text = options.filter(o => selected.includes(o.value)).map(o => o.label).join(', ');
  const pick = (v: string) => {
    if (!multiple) { onChange(v); setOpen(false); setQ(''); return; }
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  };
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={st.label}>{label}{required ? ' *' : ''}</Text> : null}
      <Pressable onPress={() => setOpen(true)} style={[st.box, !!error && { borderColor: C.danger }]}>
        <Text numberOfLines={1} style={[st.value, !text && { color: '#94A3B8' }]}>{text || placeholder}</Text>
        <ChevronDown size={18} color={C.muted} />
      </Pressable>
      {error ? <Text style={{ color: C.danger, fontSize: 13 }}>{error}</Text> : null}
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
          <View style={st.head}>
            <Text style={st.title}>{label ?? 'Chọn'}</Text>
            <Pressable hitSlop={10} onPress={() => { setOpen(false); setQ(''); }}>{multiple ? <Text style={{ color: C.brand, fontWeight: '800', fontSize: 16 }}>Xong</Text> : <X size={24} color={C.ink} />}</Pressable>
          </View>
          {options.length > 8 ? <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}><Input value={q} onChangeText={setQ} placeholder="Tìm nhanh…" left={<Search size={18} color={C.muted} />} /></View> : null}
          <FlatList data={shown} keyExtractor={o => o.value} keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const on = selected.includes(item.value);
              return <Pressable onPress={() => pick(item.value)} style={[st.row, on && { backgroundColor: C.brandSoft }]}>
                <Text style={[st.rowText, on && { color: C.brandDark, fontWeight: '700' }]}>{item.label}</Text>
                {on ? <Check size={20} color={C.brand} /> : null}
              </Pressable>;
            }} />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: C.text },
  box: { minHeight: 50, borderWidth: 1.5, borderColor: C.line, borderRadius: R.md, backgroundColor: '#FBFDFC', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: { flex: 1, fontSize: 16, color: C.ink },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 18, fontWeight: '800', color: C.ink },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  rowText: { fontSize: 16, color: C.ink, flex: 1 },
});
