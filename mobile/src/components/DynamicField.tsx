import { Pressable, Switch, Text, View } from 'react-native';
import type { Field } from '@/lib/listing-domain';
import { C } from '@/lib/theme';
import { Picker } from './Picker';
import { Chip, Input } from './ui';

/** Trường nhập theo mẫu của từng chuyên mục (giống web, dùng chung quy tắc kiểm tra với máy chủ). */
export function DynamicField({ field, value, onChange, error }: { field: Field; value: unknown; onChange: (v: unknown) => void; error?: string }) {
  const label = field.label + (field.config.unit ? ` (${field.config.unit})` : '');
  const help = field.config.help ? <Text style={{ color: C.muted, fontSize: 12 }}>{field.config.help}</Text> : null;
  const opts = field.options.map(o => ({ value: o.value, label: o.label }));
  switch (field.type) {
    case 'select':
      return <View style={{ gap: 4 }}><Picker label={label} required={field.required} value={value as string} options={opts} onChange={v => onChange(v)} error={error} />{help}</View>;
    case 'multi-select':
      return <View style={{ gap: 4 }}><Picker multiple label={label} required={field.required} value={(value as string[]) ?? []} options={opts} onChange={v => onChange((v as string[]).length ? v : undefined)} error={error} />{help}</View>;
    case 'radio':
      return <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }}>{label}{field.required ? ' *' : ''}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{opts.map(o => <Chip key={o.value} label={o.label} active={value === o.value} onPress={() => onChange(o.value)} />)}</View>
        {error ? <Text style={{ color: C.danger, fontSize: 13 }}>{error}</Text> : null}{help}
      </View>;
    case 'boolean': case 'checkbox':
      return <Pressable onPress={() => onChange(!value)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
        <Text style={{ fontSize: 15, color: C.ink, flex: 1 }}>{label}</Text>
        <Switch value={!!value} onValueChange={v => onChange(v)} trackColor={{ true: C.brand, false: '#CBD5E1' }} />
      </Pressable>;
    case 'number': case 'year': case 'range':
      return <View style={{ gap: 4 }}><Input label={label + (field.required ? ' *' : '')} keyboardType={field.config.integer || field.type === 'year' ? 'number-pad' : 'decimal-pad'} placeholder={field.config.placeholder}
        value={value === undefined || value === null ? '' : String(value)} error={error}
        onChangeText={t => { const n = t.replace(',', '.').replace(/[^\d.-]/g, ''); onChange(n === '' ? undefined : Number(n)); }} />{help}</View>;
    case 'currency':
      return <View style={{ gap: 4 }}><Input label={label + (field.required ? ' *' : '')} keyboardType="number-pad" placeholder={field.config.placeholder}
        value={value ? Number(value).toLocaleString('vi-VN') : ''} error={error} onChangeText={t => { const d = t.replace(/\D/g, ''); onChange(d || undefined); }} right={<Text style={{ color: C.muted }}>đ</Text>} />{help}</View>;
    case 'date':
      return <View style={{ gap: 4 }}><Input label={label + (field.required ? ' *' : '') + ' (YYYY-MM-DD)'} placeholder="2026-12-31" value={(value as string) ?? ''} error={error} onChangeText={t => onChange(t || undefined)} />{help}</View>;
    case 'image': case 'video': case 'location':
      return null; // ảnh/video/vị trí được nhập ở bước riêng
    case 'textarea':
      return <View style={{ gap: 4 }}><Input label={label + (field.required ? ' *' : '')} multiline style={{ minHeight: 90, textAlignVertical: 'top' }} placeholder={field.config.placeholder} value={(value as string) ?? ''} error={error} maxLength={field.config.maxLength} onChangeText={t => onChange(t || undefined)} />{help}</View>;
    default:
      return <View style={{ gap: 4 }}><Input label={label + (field.required ? ' *' : '')} placeholder={field.config.placeholder} value={(value as string) ?? ''} error={error} maxLength={field.config.maxLength} onChangeText={t => onChange(t || undefined)} />{help}</View>;
  }
}
