import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { C, R, shadow } from '@/lib/theme';
import { ALL_PROVINCES } from '@/lib/locations';
import { provinceLabel, wardLabel, wardsOfDistrict } from '@/lib/vn-merge';
import { Picker } from '@/components/Picker';
import { Button, Input, Loading } from '@/components/ui';

type Addr = { id: string; label: string; province: string; district: string; ward: string; address: string; hideExact: boolean; isDefault: boolean };
type Form = Omit<Addr, 'id'> & { id?: string };
const EMPTY: Form = { label: '', province: '', district: '', ward: '', address: '', hideExact: true, isDefault: false };

/** Sổ địa chỉ: nhiều địa chỉ giao dịch, chọn nhanh khi đăng tin. */
export default function AddressesScreen() {
  const [items, setItems] = useState<Addr[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { api<Addr[]>('/me/addresses', { auth: true }).then(setItems).catch(e => Alert.alert('Lỗi', e.message)); }, []);
  useEffect(load, [load]);

  const run = async (fn: () => Promise<Addr[]>, after?: () => void) => {
    if (busy) return; setBusy(true);
    try { setItems(await fn()); after?.(); } catch (e) { Alert.alert('Chưa thực hiện được', (e as Error).message); } finally { setBusy(false); }
  };
  const save = () => {
    if (!form) return;
    if (!form.province) { Alert.alert('Thiếu thông tin', 'Hãy chọn Tỉnh / Thành phố.'); return; }
    const { id, ...body } = form;
    void run(() => api<Addr[]>(id ? `/me/addresses/${id}` : '/me/addresses', { method: id ? 'PUT' : 'POST', auth: true, body }), () => setForm(null));
  };
  const remove = (a: Addr) => Alert.alert('Xóa địa chỉ?', `“${a.label}” sẽ bị xóa.`, [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Xóa', style: 'destructive', onPress: () => void run(() => api<Addr[]>(`/me/addresses/${a.id}`, { method: 'DELETE', auth: true })) },
  ]);

  if (!items) return <Loading />;
  const set = (p: Partial<Form>) => setForm(f => (f ? { ...f, ...p } : f));

  if (form) {
    const province = ALL_PROVINCES.find(p => p.name === form.province);
    const district = province?.children?.find(d => d.name === form.district);
    const wardNames = wardsOfDistrict(district?.code);
    return (
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: C.white, borderRadius: R.lg, padding: 14, gap: 12, ...shadow }}>
          <Input label="Tên gợi nhớ (VD: Nhà, Cửa hàng, Kho)" value={form.label} onChangeText={v => set({ label: v })} />
          <Picker label="Tỉnh / Thành phố" required value={form.province} options={ALL_PROVINCES.map(p => ({ value: p.name, label: provinceLabel(p.name, p.code) }))} onChange={v => set({ province: v as string, district: '', ward: '' })} />
          {province?.children?.length ? <Picker label="Quận / Huyện" value={form.district} options={province.children.map(d => ({ value: d.name, label: d.name }))} onChange={v => set({ district: v as string, ward: '' })} /> : null}
          {wardNames.length ? <Picker label="Phường / Xã" value={form.ward} options={wardNames.map(w => ({ value: w, label: wardLabel(w, district?.code) }))} onChange={v => set({ ward: v as string })} />
            : <Input label="Phường / Xã" value={form.ward} onChangeText={v => set({ ward: v })} />}
          <Input label="Số nhà, tên đường (không bắt buộc)" value={form.address} onChangeText={v => set({ address: v })} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ color: C.ink, fontSize: 15, flex: 1 }}>Ẩn địa chỉ cụ thể, chỉ hiện phường/xã</Text>
            <Switch value={form.hideExact} onValueChange={v => set({ hideExact: v })} trackColor={{ true: C.brand, false: '#CBD5E1' }} /></View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ color: C.ink, fontSize: 15, flex: 1 }}>Đặt làm địa chỉ mặc định</Text>
            <Switch value={form.isDefault} onValueChange={v => set({ isDefault: v })} trackColor={{ true: C.brand, false: '#CBD5E1' }} /></View>
          <Button title={form.id ? 'Lưu thay đổi' : 'Thêm địa chỉ'} loading={busy} onPress={save} />
          <Button variant="outline" title="Hủy" onPress={() => setForm(null)} />
        </View>
      </ScrollView>
    );
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
      <Text style={{ color: C.muted, fontSize: 13 }}>Lưu nhiều địa chỉ giao dịch rồi chọn nhanh khi đăng tin.</Text>
      {items.map(a => (
        <View key={a.id} style={{ backgroundColor: C.white, borderRadius: R.lg, padding: 14, gap: 6, ...shadow }}>
          <Text style={{ color: C.ink, fontSize: 16, fontWeight: '700' }}>{a.label}{a.isDefault ? '  · Mặc định' : ''}</Text>
          <Text style={{ color: C.muted, fontSize: 14 }}>{[a.address, a.ward, a.district, a.province].filter(Boolean).join(', ')}</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
            <Text style={{ color: C.brand, fontWeight: '600' }} onPress={() => setForm({ id: a.id, label: a.label, province: a.province, district: a.district, ward: a.ward, address: a.address, hideExact: a.hideExact, isDefault: a.isDefault })}>Sửa</Text>
            {!a.isDefault ? <Text style={{ color: C.brand, fontWeight: '600' }} onPress={() => void run(() => api<Addr[]>(`/me/addresses/${a.id}/default`, { method: 'PATCH', auth: true }))}>Đặt mặc định</Text> : null}
            <Text style={{ color: C.danger, fontWeight: '600' }} onPress={() => remove(a)}>Xóa</Text>
          </View>
        </View>
      ))}
      {!items.length ? <Text style={{ color: C.muted, textAlign: 'center', marginVertical: 24 }}>Bạn chưa có địa chỉ nào.</Text> : null}
      <Button title="Thêm địa chỉ" onPress={() => setForm({ ...EMPTY })} />
    </ScrollView>
  );
}
