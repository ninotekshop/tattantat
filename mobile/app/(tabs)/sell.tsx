import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Camera, ChevronLeft, ChevronRight, ImagePlus, LocateFixed, Sparkles, X } from 'lucide-react-native';
import { api, ApiError, media, upload } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { uid } from '@/lib/format';
import { CONDITIONS, PRICE_MODES, type Listing } from '@/lib/listing';
import { validateListing, visible, type ListingData } from '@/lib/listing-domain';
import { ALL_PROVINCES } from '@/lib/locations';
import { provinceLabel, wardLabel, wardsOfDistrict } from '@/lib/vn-merge';
import { C, R, shadow } from '@/lib/theme';
import type { ListingCategory, ListingMedia, Me } from '@/lib/types';
import { DynamicField } from '@/components/DynamicField';
import { LoginRequired } from '@/components/LoginRequired';
import { Picker } from '@/components/Picker';
import { Button, Chip, Empty, Input, Loading } from '@/components/ui';

const MAX_IMAGES = 20;
const norm = (s?: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/^(tinh|thanh pho|tp\.?|quan|huyen|thi xa|phuong|xa)\s+/, '').trim();

export default function Sell() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const nav = useNavigation();
  const [cats, setCats] = useState<ListingCategory[] | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [data, setData] = useState<ListingData>({});
  const [mediaMap, setMediaMap] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [published, setPublished] = useState<{ productId: string; pending: boolean } | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const revision = useRef(0);
  const scroll = useRef<ScrollView>(null);

  const reset = useCallback(() => { setListing(null); setData({}); setMediaMap({}); setErrors({}); setPublished(null); setGroup(null); setStep(0); revision.current = 0; }, []);
  const accept = useCallback((l: Listing) => {
    setListing(l); setData(l.data ?? {}); revision.current = l.revision;
    setMediaMap(Object.fromEntries((l.media ?? []).map((m: ListingMedia) => [m.id, media(m.url)])));
  }, []);

  useEffect(() => { if (session) api<ListingCategory[]>('/listing-categories').then(setCats).catch(() => setCats([])); }, [session]);
  useEffect(() => {
    if (!session || !params.id) return;
    setBusy('load');
    api<Listing>(`/listings/${params.id}`, { auth: true }).then(accept).catch(e => Alert.alert('Không mở được tin', e.message)).finally(() => setBusy(null));
  }, [session, params.id, accept]);
  useEffect(() => { nav.setOptions({ title: listing ? (params.id ? 'Sửa tin đăng' : 'Đăng tin mới') : 'Đăng tin' }); }, [nav, listing, params.id]);

  const patch = (p: Partial<ListingData>) => setData(d => ({ ...d, ...p }));
  const setValue = (key: string, v: unknown) => setData(d => { const values = { ...(d.values ?? {}) }; if (v === undefined) delete values[key]; else values[key] = v; return { ...d, values }; });

  const start = async (categoryId: string) => {
    setBusy('draft');
    try {
      const l = await api<Listing>('/listings/draft', { method: 'POST', auth: true, body: { categoryId, clientKey: uid() } });
      const me = await api<Me>('/me', { auth: true }).catch(() => null);
      accept({ ...l, data: { priceMode: l.template.config.priceModes[0], ...l.data, contact: l.data.contact ?? { name: me?.full_name ?? '', phone: me?.phone ?? '', ...(me?.email ? { email: me.email } : {}) } } });
    } catch (e) { Alert.alert('Chưa tạo được tin', (e as Error).message); } finally { setBusy(null); }
  };

  const save = async (d: ListingData) => {
    const r = await api<{ revision: number }>(`/listings/${listing!.id}`, { method: 'PUT', auth: true, body: { revision: revision.current, data: d } });
    revision.current = r.revision;
  };

  const addImages = async (camera: boolean) => {
    const current = data.images ?? [];
    if (current.length >= MAX_IMAGES) return Alert.alert('Đã đủ ảnh', `Tối đa ${MAX_IMAGES} ảnh cho mỗi tin.`);
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Cần quyền truy cập', camera ? 'Vui lòng cho phép dùng camera trong Cài đặt.' : 'Vui lòng cho phép truy cập ảnh trong Cài đặt.');
    const r = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.75 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75, allowsMultipleSelection: true, selectionLimit: MAX_IMAGES - current.length, orderedSelection: true });
    if (r.canceled) return;
    let ids = [...current];
    for (const a of r.assets.slice(0, MAX_IMAGES - current.length)) {
      setUploading(0);
      try {
        const m = await upload<ListingMedia>(`/listings/${listing!.id}/images`, { uri: a.uri, name: a.fileName ?? `anh-${Date.now()}.jpg`, type: a.mimeType ?? 'image/jpeg' }, p => setUploading(p));
        ids = [...ids, m.id]; setMediaMap(mm => ({ ...mm, [m.id]: media(m.url) })); patch({ images: ids });
      } catch (e) { Alert.alert('Tải ảnh chưa thành công', (e as Error).message); break; }
    }
    setUploading(null);
  };
  const removeImage = (id: string) => patch({ images: (data.images ?? []).filter(x => x !== id) });
  const makeCover = (id: string) => patch({ images: [id, ...(data.images ?? []).filter(x => x !== id)] });

  const locate = async () => {
    setBusy('loc');
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (!p.granted) throw new Error('Vui lòng cho phép truy cập vị trí trong Cài đặt.');
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const r = await api<{ ward: string; district: string; province: string; road: string; houseNumber: string }>(`/geo/reverse?lat=${coords.latitude}&lng=${coords.longitude}`, { auth: true });
      const prov = ALL_PROVINCES.find(x => norm(x.name) === norm(r.province));
      const dist = prov?.children?.find(x => norm(x.name) === norm(r.district));
      patch({ location: { ...data.location, ...(prov ? { province: prov.name, district: dist?.name ?? '' } : {}), ...(r.ward ? { ward: r.ward } : {}), ...(r.road ? { address: [r.houseNumber, r.road].filter(Boolean).join(' ') } : {}), latitude: coords.latitude, longitude: coords.longitude } });
      if (!prov) Alert.alert('Chưa khớp tỉnh/thành', 'Vui lòng chọn tỉnh/thành phố bằng tay.');
    } catch (e) { Alert.alert('Không lấy được vị trí', (e as Error).message); } finally { setBusy(null); }
  };

  const aiWrite = async () => {
    setBusy('ai');
    try {
      const cat = cats?.find(c => c.id === listing?.categoryId)?.name;
      const r = await api<{ title: string; description: string }>('/ai/listing-draft', { method: 'POST', auth: true, body: { title: data.title || undefined, condition: data.condition || undefined, category: cat, price: data.price || undefined, notes: data.description || undefined } });
      Alert.alert('Gợi ý từ Trợ lý TTT', r.description.slice(0, 400) + (r.description.length > 400 ? '…' : ''), [
        { text: 'Bỏ qua', style: 'cancel' },
        { text: 'Dùng gợi ý', onPress: () => patch({ title: r.title || data.title, description: r.description }) },
      ]);
    } catch (e) { Alert.alert('Chưa gợi ý được', (e as Error).message); } finally { setBusy(null); }
  };

  const publish = async () => {
    if (!listing) return;
    const errs = validateListing(data, listing.template, true);
    setErrors(errs);
    if (Object.keys(errs).length) { Alert.alert('Còn thiếu thông tin', Object.values(errs).slice(0, 4).join('\n')); return; }
    setBusy('publish');
    try {
      await save(data);
      const r = await api<{ productId: string; moderation?: string }>(`/listings/${listing.id}/publish`, { method: 'POST', auth: true, body: { revision: revision.current }, idempotencyKey: uid() });
      setPublished({ productId: r.productId, pending: r.moderation === 'PENDING_REVIEW' || r.moderation === 'REVIEW' });
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fields).length) setErrors(e.fields);
      Alert.alert('Chưa đăng được tin', (e as Error).message);
    } finally { setBusy(null); }
  };
  const saveDraft = async () => {
    setBusy('save');
    try { await save(data); Alert.alert('Đã lưu nháp', 'Bạn có thể tiếp tục chỉnh sửa trong mục Tin đăng của tôi.'); }
    catch (e) { if (e instanceof ApiError && Object.keys(e.fields).length) setErrors(e.fields); Alert.alert('Chưa lưu được', (e as Error).message); }
    finally { setBusy(null); }
  };

  const groups = useMemo(() => (cats ?? []).filter(c => !c.parentId), [cats]);
  if (!session) return <LoginRequired text="Đăng nhập để đăng tin bán hàng miễn phí trên Tất Tần Tật." />;
  if (busy === 'load' || busy === 'draft') return <Loading label="Đang chuẩn bị tin đăng…" />;

  if (published) return (
    <Empty title={published.pending ? 'Tin đã gửi, đang chờ duyệt' : 'Đăng tin thành công! 🎉'}
      text={published.pending ? 'Tin sẽ hiển thị ngay sau khi được kiểm duyệt. Chúng tôi sẽ báo cho bạn qua thông báo.' : 'Tin của bạn đã hiển thị trên Tất Tần Tật.'}
      action={<View style={{ gap: 10, marginTop: 14, width: 260 }}>
        <Button title="Xem tin đăng" onPress={() => router.push({ pathname: '/products/[id]', params: { id: published.productId } })} />
        <Button variant="outline" title="Đăng tin khác" onPress={() => { reset(); router.setParams({ id: undefined }); }} />
      </View>} />
  );

  // Bước 1: chọn danh mục
  if (!listing) {
    if (!cats) return <Loading />;
    const list = group ? cats.filter(c => c.parentId === group) : groups;
    return (
      <ScrollView contentContainerStyle={{ padding: 12, gap: 10 }}>
        {group ? <Pressable onPress={() => setGroup(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}><ChevronLeft size={20} color={C.brand} /><Text style={{ color: C.brand, fontWeight: '700' }}>Tất cả danh mục</Text></Pressable>
          : <Text style={st.h}>Bạn muốn đăng bán gì?</Text>}
        {list.map(c => (
          <Pressable key={c.id} onPress={() => (c.isGroup || cats.some(k => k.parentId === c.id) ? setGroup(c.id) : start(c.id))} style={st.cat}>
            <Text style={st.catText}>{c.name}</Text><ChevronRight size={20} color={C.muted} />
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  // Các bước nhập thông tin
  const t = listing.template;
  const images = data.images ?? [];
  const province = ALL_PROVINCES.find(p => p.name === data.location?.province);
  const districtCode = province?.children?.find(d => d.name === data.location?.district)?.code;
  const wardNames = wardsOfDistrict(districtCode);
  const priceless = data.priceMode === 'CONTACT' || data.priceMode === 'FREE';
  const err = (k: string) => errors[k];
  const specFields = t.fields.filter(f => f.enabled && visible(f, data.values ?? {}, t.fields) && !['image', 'video', 'location'].includes(f.type));
  const steps: { key: string; title: string; hint: string }[] = [
    { key: 'images', title: 'Hình ảnh', hint: 'Ảnh thật, rõ nét giúp bán nhanh hơn' },
    { key: 'info', title: 'Thông tin chính', hint: 'Tiêu đề và mô tả ngắn gọn, dễ hiểu' },
    { key: 'price', title: 'Giá bán', hint: 'Chọn cách bán và nhập giá' },
    ...(specFields.length ? [{ key: 'specs', title: 'Thông số', hint: t.name ? `Thông tin riêng của ${t.name}` : 'Thông tin chi tiết sản phẩm' }] : []),
    { key: 'place', title: 'Khu vực & liên hệ', hint: 'Người mua sẽ liên hệ bạn ở đâu' },
    { key: 'review', title: 'Xem lại & đăng', hint: 'Kiểm tra lần cuối trước khi đăng' },
  ];
  const cur = Math.min(step, steps.length - 1);
  const key = steps[cur].key;
  const stepOf = (k: string) => (k === 'images' ? 'images' : ['title', 'description', 'condition'].includes(k) ? 'info' : ['price', 'priceMode'].includes(k) ? 'price' : k.startsWith('values.') ? 'specs' : 'place');
  const goTo = (k: string) => { const i = steps.findIndex(s => s.key === k); if (i >= 0) setStep(i); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const move = (i: number) => { setStep(i); scroll.current?.scrollTo({ y: 0, animated: false }); };

  const next = async () => {
    const all = validateListing(data, t, true);
    const mine = Object.fromEntries(Object.entries(all).filter(([k]) => stepOf(k) === key));
    setErrors(e => ({ ...Object.fromEntries(Object.entries(e).filter(([k]) => stepOf(k) !== key)), ...mine }));
    if (Object.keys(mine).length) { Alert.alert('Còn thiếu thông tin', Object.values(mine).slice(0, 4).join('\n')); return; }
    save(data).catch(() => {}); // tự lưu nháp ngầm
    move(cur + 1);
  };
  const publishWizard = async () => {
    const errs = validateListing(data, t, true);
    if (Object.keys(errs).length) {
      setErrors(errs);
      const first = Object.keys(errs)[0];
      goTo(stepOf(first));
      Alert.alert('Còn thiếu thông tin', Object.values(errs).slice(0, 4).join('\n'));
      return;
    }
    await publish();
  };

  const row = (label: string, value?: string, k?: string) => (
    <Pressable onPress={() => k && goTo(k)} style={st.sumRow}>
      <Text style={st.sumLabel}>{label}</Text>
      <Text style={[st.sumValue, !value && { color: C.danger }]} numberOfLines={2}>{value || 'Chưa nhập'}</Text>
      <Text style={st.sumEdit}>Sửa</Text>
    </Pressable>
  );
  const loc = [data.location?.address, data.location?.ward, data.location?.district, data.location?.province].filter(Boolean).join(', ');
  const priceText = priceless ? (PRICE_MODES[data.priceMode ?? ''] ?? '') : data.price ? `${Number(data.price).toLocaleString('vi-VN')} đ${data.negotiable ? ' (thương lượng)' : ''}` : '';
  const isLast = cur === steps.length - 1;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={st.progress}>
        <View style={st.bars}>{steps.map((s, i) => <Pressable key={s.key} onPress={() => i <= cur && move(i)} style={[st.bar, i <= cur && st.barOn]} />)}</View>
        <Text style={st.stepNo}>Bước {cur + 1}/{steps.length}</Text>
        <Text style={st.stepTitle}>{steps[cur].title}</Text>
        <Text style={st.help}>{steps[cur].hint}</Text>
      </View>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        {key === 'images' ? <View style={st.card}>
          <Text style={st.cardTitle}>Hình ảnh ({images.length}/{MAX_IMAGES})</Text>
          <Text style={st.help}>Ảnh đầu tiên là ảnh bìa. Chạm giữ một ảnh để đặt làm ảnh bìa.</Text>
          <View style={st.grid}>
            {images.map((id, i) => (
              <Pressable key={id} onLongPress={() => makeCover(id)} style={st.thumbBox}>
                <Image source={{ uri: mediaMap[id] }} style={st.thumb} contentFit="cover" />
                {i === 0 ? <View style={st.cover}><Text style={st.coverText}>Ảnh bìa</Text></View> : null}
                <Pressable hitSlop={6} onPress={() => removeImage(id)} style={st.remove}><X size={14} color={C.white} /></Pressable>
              </Pressable>
            ))}
            {uploading !== null ? <View style={[st.thumbBox, st.add]}><ActivityIndicator color={C.brand} /><Text style={st.addText}>{uploading}%</Text></View> : null}
            {images.length < MAX_IMAGES && uploading === null ? <>
              <Pressable onPress={() => addImages(false)} style={[st.thumbBox, st.add]}><ImagePlus size={26} color={C.brand} /><Text style={st.addText}>Thư viện</Text></Pressable>
              <Pressable onPress={() => addImages(true)} style={[st.thumbBox, st.add]}><Camera size={26} color={C.brand} /><Text style={st.addText}>Chụp ảnh</Text></Pressable>
            </> : null}
          </View>
          {err('images') ? <Text style={st.err}>{err('images')}</Text> : null}
        </View> : null}

        {key === 'info' ? <View style={st.card}>
          <Input label="Tiêu đề *" value={data.title ?? ''} onChangeText={v => patch({ title: v })} maxLength={200} placeholder="VD: iPhone 15 Pro Max 256GB, còn bảo hành" error={err('title')} />
          <Input label="Mô tả chi tiết *" value={data.description ?? ''} onChangeText={v => patch({ description: v })} multiline style={{ minHeight: 120, textAlignVertical: 'top' }} maxLength={10000} placeholder="Tình trạng, xuất xứ, phụ kiện kèm theo, lý do bán…" error={err('description')} />
          <Button variant="ghost" title={busy === 'ai' ? 'Đang viết…' : 'Trợ lý TTT viết giúp'} loading={busy === 'ai'} icon={<Sparkles size={18} color={C.brandDark} />} onPress={aiWrite} />
          {t.config.condition !== 'none' ? <View style={{ gap: 8 }}>
            <Text style={st.label}>Tình trạng *</Text>
            <View style={st.wrap}>{CONDITIONS.map(([k, l]) => <Chip key={k} label={l} active={data.condition === k} onPress={() => patch({ condition: k })} />)}</View>
            {err('condition') ? <Text style={st.err}>{err('condition')}</Text> : null}
          </View> : null}
        </View> : null}

        {key === 'price' ? <View style={st.card}>
          <View style={st.wrap}>{t.config.priceModes.map(m => <Chip key={m} label={PRICE_MODES[m] ?? m} active={data.priceMode === m} onPress={() => patch({ priceMode: m, ...(m === 'CONTACT' || m === 'FREE' ? { price: undefined } : {}) })} />)}</View>
          {!priceless ? <Input label="Giá bán *" keyboardType="number-pad" value={data.price ? Number(data.price).toLocaleString('vi-VN') : ''} onChangeText={v => patch({ price: v.replace(/\D/g, '') || undefined })} right={<Text style={{ color: C.muted }}>đ</Text>} error={err('price')} /> : null}
          {!priceless ? <View style={st.switchRow}><Text style={{ color: C.ink, fontSize: 15 }}>Có thể thương lượng</Text><Switch value={!!data.negotiable} onValueChange={v => patch({ negotiable: v })} trackColor={{ true: C.brand, false: '#CBD5E1' }} /></View> : null}
        </View> : null}

        {key === 'specs' ? <View style={st.card}>
          {specFields.map(f => <DynamicField key={f.key} field={f} value={data.values?.[f.key]} onChange={v => setValue(f.key, v)} error={err('values.' + f.key)} />)}
        </View> : null}

        {key === 'place' ? <>
          <View style={st.card}>
            <Text style={st.cardTitle}>Khu vực giao dịch</Text>
            <Button variant="outline" title={busy === 'loc' ? 'Đang lấy vị trí…' : 'Dùng vị trí hiện tại'} loading={busy === 'loc'} icon={<LocateFixed size={18} color={C.brand} />} onPress={locate} />
            <Picker label="Tỉnh / Thành phố" required value={data.location?.province} options={ALL_PROVINCES.map(p => ({ value: p.name, label: provinceLabel(p.name, p.code) }))} onChange={v => patch({ location: { ...data.location, province: v as string, district: '', ward: '' } })} error={err('location.province') || err('location')} />
            {province?.children?.length ? <Picker label="Quận / Huyện" value={data.location?.district} options={province.children.map(d => ({ value: d.name, label: d.name }))} onChange={v => patch({ location: { ...data.location, district: v as string, ward: '' } })} /> : null}
            {wardNames.length ? <Picker label="Phường / Xã" required value={data.location?.ward} options={wardNames.map(w => ({ value: w, label: wardLabel(w, districtCode) }))} onChange={v => patch({ location: { ...data.location, ward: v as string } })} error={err('location.ward')} />
              : <Input label="Phường / Xã *" value={data.location?.ward ?? ''} onChangeText={v => patch({ location: { ...data.location, ward: v } })} error={err('location.ward')} />}
            <Input label="Địa chỉ cụ thể (không bắt buộc)" value={data.location?.address ?? ''} onChangeText={v => patch({ location: { ...data.location, address: v } })} error={err('location.address')} />
            <View style={st.switchRow}><Text style={{ color: C.ink, fontSize: 15, flex: 1 }}>Ẩn địa chỉ cụ thể, chỉ hiện phường/xã</Text><Switch value={!!data.location?.hideExact} onValueChange={v => patch({ location: { ...data.location, hideExact: v } })} trackColor={{ true: C.brand, false: '#CBD5E1' }} /></View>
          </View>
          <View style={st.card}>
            <Text style={st.cardTitle}>Liên hệ</Text>
            <Input label="Tên người bán *" value={data.contact?.name ?? ''} onChangeText={v => patch({ contact: { ...data.contact, name: v } })} error={err('contact.name') || err('contact')} />
            <Input label="Số điện thoại *" keyboardType="phone-pad" value={data.contact?.phone ?? ''} onChangeText={v => patch({ contact: { ...data.contact, phone: v.replace(/[^\d+]/g, '') } })} error={err('contact.phone')} />
            <Input label="Email" keyboardType="email-address" autoCapitalize="none" value={data.contact?.email ?? ''} onChangeText={v => patch({ contact: { ...data.contact, email: v || undefined } })} error={err('contact.email')} />
          </View>
        </> : null}

        {key === 'review' ? <View style={st.card}>
          {images[0] ? <Image source={{ uri: mediaMap[images[0]] }} style={st.reviewImg} contentFit="cover" /> : null}
          {row('Ảnh', images.length ? `${images.length} ảnh` : '', 'images')}
          {row('Tiêu đề', data.title, 'info')}
          {row('Mô tả', data.description, 'info')}
          {t.config.condition !== 'none' ? row('Tình trạng', CONDITIONS.find(([k]) => k === data.condition)?.[1], 'info') : null}
          {row('Giá', priceText, 'price')}
          {specFields.length ? row('Thông số', `${specFields.filter(f => data.values?.[f.key] !== undefined && data.values?.[f.key] !== '').length}/${specFields.length} mục đã nhập`, 'specs') : null}
          {row('Khu vực', loc, 'place')}
          {row('Liên hệ', [data.contact?.name, data.contact?.phone].filter(Boolean).join(' · '), 'place')}
        </View> : null}
      </ScrollView>
      <View style={st.footer}>
        {cur > 0 ? <Button style={{ flex: 1 }} variant="outline" title="Quay lại" onPress={() => move(cur - 1)} /> : <Button style={{ flex: 1 }} variant="outline" title="Lưu nháp" loading={busy === 'save'} onPress={saveDraft} />}
        {isLast
          ? <Button style={{ flex: 1.4 }} title={listing.productId ? 'Cập nhật tin' : 'Đăng tin'} loading={busy === 'publish'} disabled={uploading !== null} onPress={publishWizard} />
          : <Button style={{ flex: 1.4 }} title="Tiếp tục" disabled={uploading !== null} onPress={next} />}
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  h: { fontSize: 20, fontWeight: '800', color: C.ink, margin: 4 },
  cat: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: R.lg, padding: 16, ...shadow },
  catText: { flex: 1, fontSize: 16, fontWeight: '700', color: C.ink },
  card: { backgroundColor: C.white, borderRadius: R.lg, padding: 14, gap: 12, ...shadow },
  cardTitle: { fontSize: 17, fontWeight: '800', color: C.ink },
  help: { fontSize: 13, color: C.muted, marginTop: -6 },
  label: { fontSize: 14, fontWeight: '600', color: C.text },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbBox: { width: 96, height: 96, borderRadius: 12, overflow: 'hidden' },
  thumb: { width: 96, height: 96, backgroundColor: C.paper },
  add: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.brand, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center', gap: 4 },
  addText: { color: C.brandDark, fontSize: 12, fontWeight: '700' },
  cover: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,166,90,.88)', paddingVertical: 2 },
  coverText: { color: C.white, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  remove: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,.6)', borderRadius: 10, padding: 3 },
  err: { color: C.danger, fontSize: 13 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  progress: { backgroundColor: C.white, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, gap: 2, borderBottomWidth: 1, borderBottomColor: C.line },
  bars: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  bar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#E2E8F0' },
  barOn: { backgroundColor: C.brand },
  stepNo: { fontSize: 12, color: C.brand, fontWeight: '700' },
  stepTitle: { fontSize: 19, fontWeight: '800', color: C.ink },
  reviewImg: { width: '100%', height: 180, borderRadius: 12, backgroundColor: C.paper },
  sumRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.line },
  sumLabel: { width: 78, fontSize: 13, color: C.muted, fontWeight: '600' },
  sumValue: { flex: 1, fontSize: 14, color: C.ink },
  sumEdit: { color: C.brand, fontWeight: '700', fontSize: 13 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, padding: 12, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line },
});
