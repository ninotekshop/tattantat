'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Cloud, MapPin, ShieldCheck, FileText, AlertTriangle, Trash2, X } from 'lucide-react';
import { readSession } from '../../lib/auth';
import { Listing, ListingCategory, ListingData, ListingError, ListingMedia, ListingSummary, Template, conditionLabels, listingPrice, listingRequest, priceLabels, publicData, validateListing, visible } from '../../lib/listings';
import { CATEGORY_ENGINE_TAXONOMY, LISTING_INTENTS, ParentCategorySpec, SubCategorySpec, getCategoryPlaceholders } from '../../lib/marketplace';
import { ALL_PROVINCES } from '../../lib/locations';
import { DynamicField } from './DynamicField';
import { MediaPicker } from './MediaPicker';
import { LocationMap } from './LocationMap';

const steps = ['Mục đích & Danh mục', 'Thông tin chi tiết', 'Ảnh & video', 'Giá & Vị trí', 'Liên hệ', 'Xem trước', 'Hoàn tất'];

function checkForContactInfo(text: string): string | null {
  if (!text) return null;
  // Regex for Vietnamese Phone numbers
  if (/(0|\+84)[3|5|7|8|9][0-9]{8}/.test(text)) {
    return 'Phát hiện số điện thoại trong nội dung! Để bảo vệ quyền riêng tư, vui lòng chỉ nhập SĐT ở bước Liên hệ.';
  }
  // Regex for Emails
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    return 'Phát hiện địa chỉ email trong nội dung! Vui lòng xóa email khỏi tiêu đề/mô tả.';
  }
  // Keywords
  if (/zalo|facebook|fb\.com|telegram|liên hệ qua số|inbox zalo/i.test(text)) {
    return 'Không trao đổi thông tin liên hệ ngoài hệ thống trong Tiêu đề hoặc Mô tả!';
  }
  return null;
}

export function ListingWizard() {
  const [categories, setCategories] = useState<ListingCategory[]>([]);
  const [drafts, setDrafts] = useState<ListingSummary[]>([]);

  // Category Engine State
  const [selectedIntent, setSelectedIntent] = useState<string>('sell');
  const [selectedParentKey, setSelectedParentKey] = useState<string>('property');
  const [selectedSubSlug, setSelectedSubSlug] = useState<string>('ban-nha');
  const [categoryId, setCategoryId] = useState<string>('47');
  const [template, setTemplate] = useState<Template | null>(null);

  const [listing, setListing] = useState<Listing | null>(null);
  const [data, setData] = useState<ListingData>({});
  const [media, setMedia] = useState<ListingMedia[]>([]);
  const [step, setStep] = useState(0);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [error, setError] = useState('');
  const [contactWarning, setContactWarning] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState('');
  const [conflict, setConflict] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const current = useRef<ListingData>({});
  const listingRef = useRef<Listing | null>(null);
  const saved = useRef('');
  const revision = useRef(0);
  const saving = useRef<Promise<void> | null>(null);
  const stopped = useRef(false);
  const owner = useRef('');

  const publishKey = useRef<{ revision: number; key: string } | null>(null);
  const createKey = useRef<{ categoryId: string; key: string } | null>(null);

  const dirty = JSON.stringify(data) !== saved.current;

  // Active Parent Category
  const activeParent = CATEGORY_ENGINE_TAXONOMY.find(c => c.key === selectedParentKey) || CATEGORY_ENGINE_TAXONOMY[0];

  // Dynamically sync categoryId with selectedSubSlug / selectedParentKey
  useEffect(() => {
    if (!categories.length || listing) return;

    let matched = categories.find(c => c.slug === selectedSubSlug);

    if (!matched) {
      const activeParentSpec = CATEGORY_ENGINE_TAXONOMY.find(c => c.key === selectedParentKey);
      const parentSlug = activeParentSpec?.slug;
      matched = categories.find(c => c.slug === parentSlug || c.slug === selectedParentKey);
    }

    if (matched && matched.id !== categoryId) {
      setCategoryId(matched.id);
      change({ ...current.current, values: {} });
    }
  }, [selectedSubSlug, selectedParentKey, categories, listing, categoryId]);

  useEffect(() => {
    const session = readSession();
    setSignedIn(!!session);
    owner.current = session?.user.id ?? '';
    const selected = new URLSearchParams(window.location.search).get('listing');

    Promise.all([
      listingRequest<ListingCategory[]>('/listing-categories').then(setCategories),
      session ? listingRequest<ListingSummary[]>('/listings/mine').then(setDrafts) : Promise.resolve(),
      session && selected && /^[0-9a-f-]{36}$/i.test(selected) ? listingRequest<Listing>(`/listings/${selected}`).then(accept) : Promise.resolve()
    ])
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const fail = useCallback((err: unknown) => {
    setError(err instanceof Error ? err.message : 'Không thể kết nối máy chủ.');
    if (err instanceof ListingError) {
      setErrors(err.fields);
      if (err.status === 409) {
        stopped.current = true;
        setConflict(true);
      }
    }
  }, []);

  const flush = useCallback(async function save(): Promise<void> {
    if (saving.current) {
      await saving.current;
      return save();
    }
    const item = listingRef.current;
    if (!item || JSON.stringify(current.current) === saved.current) return;
    if (stopped.current) throw new Error('Cần tải lại bản nháp trước khi tiếp tục.');

    const snapshot = JSON.stringify(current.current);
    setSaveState('Đang lưu…');
    const work = listingRequest<{ revision: number }>(`/listings/${item.id}`, 'PUT', {
      revision: revision.current,
      data: JSON.parse(snapshot)
    })
      .then(result => {
        revision.current = result.revision;
        saved.current = snapshot;
        setSaveState('Đã lưu bản nháp');
      })
      .catch(err => {
        setSaveState('Chưa lưu được');
        fail(err);
        throw err;
      });

    saving.current = work;
    try {
      await work;
    } finally {
      saving.current = null;
    }
  }, [fail]);

  useEffect(() => {
    if (!listing || !dirty || conflict || step === 6) return;
    const timer = setTimeout(() => {
      void flush().catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, [data, listing, dirty, conflict, step, flush]);

  // Load Category Schema dynamically
  useEffect(() => {
    if (!categoryId || listing) return;
    let active = true;
    setTemplate(null);
    listingRequest<Template>(`/listing-templates/${categoryId}`)
      .then(val => {
        if (active) setTemplate(val);
      })
      .catch(err => {
        if (active) fail(err);
      });
    return () => {
      active = false;
    };
  }, [categoryId, listing, fail]);

  function change(next: ListingData) {
    current.current = next;
    setData(next);
    setSaveState('Có thay đổi chưa lưu');
    setErrors({});

    // Contact info check
    const titleWarn = checkForContactInfo(next.title || '');
    const descWarn = checkForContactInfo(next.description || '');
    setContactWarning(titleWarn || descWarn);
  }

  function patch(next: Partial<ListingData>) {
    change({ ...current.current, ...next });
  }

  function accept(item: Listing) {
    if (!item.owner) throw new Error('Bạn không có quyền sửa tin này.');
    listingRef.current = item;
    current.current = item.data;
    revision.current = item.revision;
    saved.current = JSON.stringify(item.data);
    stopped.current = false;

    setListing(item);
    setData(item.data);
    setMedia(item.media);
    setTemplate(item.template);
    setCategoryId(item.categoryId);
    setConflict(false);
    setErrors({});
    setError('');
    setSaveState('Đã tải bản nháp');
    setStep(1);
  }

  async function resume(id: string) {
    setBusy(true);
    try {
      if (listingRef.current && !stopped.current) await flush();
      accept(await listingRequest<Listing>(`/listings/${id}`));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function deleteDraft(id: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa bản nháp này khỏi danh sách?')) return;
    setBusy(true);
    try {
      await listingRequest(`/listings/${id}`, 'DELETE');
      setDrafts(prev => prev.filter(d => d.id !== id));
      if (listingRef.current?.id === id) {
        listingRef.current = null;
        setListing(null);
        setStep(0);
      }
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function begin() {
    if (!categoryId) return;
    if (!readSession()) {
      setError('Vui lòng đăng nhập trước khi lưu và đăng tin.');
      return;
    }
    setBusy(true);
    setError('');
    if (createKey.current?.categoryId !== categoryId) createKey.current = { categoryId, key: crypto.randomUUID() };
    try {
      accept(await listingRequest<Listing>('/listings/draft', 'POST', { categoryId, clientKey: createKey.current.key }));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function nextStep() {
    if (step === 0) {
      if (selectedIntent === 'giveaway') {
        patch({ priceMode: 'FREE', price: '0' });
      }
      if (listing) setStep(1);
      else await begin();
      return;
    }
    if (!template) return;

    if (contactWarning) {
      setError(contactWarning);
      return;
    }

    // Street address check in Description
    if (step === 1) {
      const desc = current.current.description || '';
      const addressRegex = /(số\s+\d+|đường\s+|phường\s+|quận\s+|huyện\s+|ngõ\s+|ngách\s+|hẻm\s+|xã\s+|thôn\s+)/i;
      if (addressRegex.test(desc)) {
        setError('Vui lòng không nhập địa chỉ giao dịch chi tiết vào phần Mô tả chi tiết. Hãy chọn tỉnh/thành, quận/huyện ở bước Giá & Vị trí để bảo mật thông tin cá nhân và định vị tin đăng chính xác nhất.');
        return;
      }
    }

    const all = validateListing(current.current, template, true);
    const keys = step === 1 ? ['title', 'condition', 'description', 'values.'] : step === 2 ? ['images', 'videos'] : step === 3 ? ['price', 'priceMode', 'location'] : step === 4 ? ['contact'] : [];
    const relevant = Object.fromEntries(
      Object.entries(all).filter(([k]) => keys.some(prefix => k === prefix || k.startsWith(prefix)) && !template.fields.some(f => k === 'values.' + f.key && ['image', 'video'].includes(f.type)))
    );

    if (Object.keys(relevant).length) {
      setErrors(relevant);
      setError(Object.values(relevant)[0]);
      return;
    }

    setBusy(true);
    setError('');
    try {
      await flush();
      setStep(val => Math.min(5, val + 1));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!listing || !template) return;
    if (contactWarning) {
      setError(contactWarning);
      return;
    }

    const validation = validateListing(current.current, template, true);
    setErrors(validation);
    if (Object.keys(validation).length) {
      setError(Object.values(validation)[0]);
      return;
    }

    setBusy(true);
    setError('');
    try {
      await flush();
      if (publishKey.current?.revision !== revision.current) publishKey.current = { revision: revision.current, key: crypto.randomUUID() };
      const result = await listingRequest<{ productId: string }>(`/listings/${listing.id}/publish`, 'POST', { revision: revision.current }, publishKey.current.key);
      setListing({ ...listing, productId: result.productId, status: 'PUBLISHED' });
      setStep(6);
      setSaveState('Tin đã được đăng công khai!');
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: ListingMedia) {
    const values = { ...current.current.values };
    for (const field of template?.fields ?? []) if (['image', 'video'].includes(field.type) && values[field.key] === item.id) delete values[field.key];
    patch({ [item.kind]: (current.current[item.kind] ?? []).filter(id => id !== item.id), values });
    await flush();
    try {
      await listingRequest(`/listings/${listing!.id}/media/${item.id}`, 'DELETE');
      setMedia(items => items.filter(val => val.id !== item.id));
    } catch (err) {
      if (err instanceof ListingError && err.status === 409) {
        setError('Đã bỏ tệp khỏi bản nháp.');
      } else throw err;
    }
  }

  function locate() {
    setError('');
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị. Bạn có thể nhập địa chỉ.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => patch({ location: { ...current.current.location, latitude: pos.coords.latitude, longitude: pos.coords.longitude } }),
      () => setError('Chưa lấy được vị trí. Hãy chọn tỉnh/thành, quận/huyện bên dưới.'),
      { timeout: 10000 }
    );
  }

  const previewData = template ? publicData(data, template) : data;
  const disabled = busy || conflict;

  function fieldError(key: string) {
    return errors[key] ? <small className="lf-error">{errors[key]}</small> : null;
  }

  function dynamicFields(mediaFields: boolean) {
    return template?.fields
      .filter(field => visible(field, data.values ?? {}, template.fields) && ['image', 'video'].includes(field.type) === mediaFields)
      .map(field => (
        <DynamicField
          key={field.key}
          field={field}
          value={data.values?.[field.key]}
          allValues={data.values ?? {}}
          error={errors['values.' + field.key]}
          media={media.filter(item => (data[item.kind] ?? []).includes(item.id))}
          onChange={val => patch({ values: { ...current.current.values, [field.key]: val } })}
        />
      ));
  }

  return (
    <main id="main-content" className="lf-page">
      {/* CENTERED POPUP MODAL FOR ERROR NOTIFICATIONS */}
      {error && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 20, width: '100%', maxWidth: 460, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={28} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Thông báo hệ thống</h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>{error}</p>
            <button
              type="button"
              onClick={() => setError('')}
              style={{ background: '#00a65a', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%' }}
            >
              Đã hiểu & Xác nhận
            </button>
          </div>
        </div>
      )}

      <div className="lf-heading">
        <div>
          <Link href="/" className="lf-back"><ArrowLeft size={16} /> Trang chủ</Link>
          <p className="lf-eyebrow">TẤT TẦN TẬT · ĐĂNG TIN MIỄN PHÍ</p>
          <h1>Món đồ của bạn, cơ hội mới.</h1>
          <p>Đăng tin rõ ràng, kết nối người mua ở gần bạn.</p>
        </div>
        <span className="lf-security"><ShieldCheck size={18} /> Thông tin được bảo vệ</span>
      </div>

      {/* STEPPER */}
      <nav className="lf-steps" aria-label="Các bước đăng tin">
        {steps.map((name, idx) => (
          <button
            key={name}
            disabled={busy || mediaBusy || idx > step || step === 6}
            aria-current={step === idx ? 'step' : undefined}
            onClick={() => setStep(idx)}
          >
            <span>{idx < step ? <Check size={15} /> : idx + 1}</span>
            {name}
          </button>
        ))}
      </nav>

      <div className="lf-layout">
        <section className="lf-panel">
          <div className="lf-panel-heading">
            <div>
              <p className="lf-eyebrow">BƯỚC {step + 1} / 7</p>
              <h2>{steps[step]}</h2>
            </div>
            {listing && <span className="lf-save" role="status"><Cloud size={17} /> {saveState}</span>}
          </div>

          {contactWarning && (
            <div className="lf-alert warning" style={{ background: '#fffbe3', border: '1px solid #fef08a', color: '#854d0e', marginBottom: 16 }}>
              <AlertTriangle size={18} /> {contactWarning}
            </div>
          )}

          {loading ? (
            <p role="status">Đang tải cấu hình Đăng tin Dynamic...</p>
          ) : (
            <fieldset disabled={disabled || step === 6} className="lf-fieldset">
              {/* BƯỚC 1: MỤC ĐÍCH & DANH MỤC */}
              {step === 0 && (
                <>
                  {!signedIn && (
                    <div className="lf-callout">
                      <FileText size={24} />
                      <div>
                        <strong>Vui lòng đăng nhập để lưu bản nháp & đăng tin</strong>
                        <p><Link href="/login">Đăng nhập</Link> hoặc <Link href="/register">tạo tài khoản</Link> để tiếp tục.</p>
                      </div>
                    </div>
                  )}

                  {/* CHỌN MỤC ĐÍCH ĐĂNG TIN (LISTING INTENTS) */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>1. Chọn mục đích đăng tin</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                      {LISTING_INTENTS.map(intent => (
                        <button
                          key={intent.code}
                          type="button"
                          onClick={() => {
                            setSelectedIntent(intent.code);
                            if (intent.code === 'giveaway') patch({ priceMode: 'FREE', price: '0' });
                          }}
                          style={{
                            background: selectedIntent === intent.code ? '#e0f6e9' : '#f8fafc',
                            border: selectedIntent === intent.code ? '2px solid #00a65a' : '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '12px 14px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <strong style={{ display: 'block', fontSize: 13.5, color: selectedIntent === intent.code ? '#008247' : '#0f172a' }}>
                            {intent.name}
                          </strong>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{intent.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CHỌN DANH MỤC LỚN (ICON 3D) */}
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>2. Chọn danh mục chính</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                      {CATEGORY_ENGINE_TAXONOMY.map(cat => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => {
                            setSelectedParentKey(cat.key);
                            setSelectedSubSlug(cat.subCategories[0]?.slug || '');
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: selectedParentKey === cat.key ? '#e0f6e9' : '#f8fafc',
                            border: selectedParentKey === cat.key ? '2px solid #00a65a' : '1px solid #e2e8f0',
                            borderRadius: 14,
                            padding: '12px 8px',
                            cursor: 'pointer'
                          }}
                        >
                          <img src={cat.icon} alt={cat.label} style={{ width: 42, height: 42, objectFit: 'contain', marginBottom: 6 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: selectedParentKey === cat.key ? '#008247' : '#334155', textAlign: 'center' }}>
                            {cat.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CHỌN CHUYÊN MỤC CON (ICON 3D) */}
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>3. Chọn chuyên mục con</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                      {activeParent.subCategories.map(sub => (
                        <button
                          key={sub.slug}
                          type="button"
                          onClick={() => setSelectedSubSlug(sub.slug)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            background: selectedSubSlug === sub.slug ? '#e0f6e9' : '#f8fafc',
                            border: selectedSubSlug === sub.slug ? '2px solid #00a65a' : '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '10px 14px',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <img src={sub.icon} alt={sub.name} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: selectedSubSlug === sub.slug ? '#008247' : '#1e293b' }}>
                            {sub.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DANH SÁCH BẢN NHÁP CÓ THỂ XÓA */}
                  {!listing && drafts.length > 0 && (
                    <div className="lf-drafts" style={{ marginTop: 24 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Tiếp tục tin đã lưu ({drafts.length})</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {drafts.map(draft => (
                          <div key={draft.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                            <button
                              type="button"
                              onClick={() => resume(draft.id)}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                            >
                              <FileText size={20} color="#00a65a" />
                              <div>
                                <strong style={{ display: 'block', fontSize: 13.5, color: '#0f172a' }}>{draft.title || 'Tin chưa có tiêu đề'}</strong>
                                <small style={{ fontSize: 11.5, color: '#64748b' }}>{draft.status === 'PUBLISHED' ? 'Đã đăng · Chỉnh sửa' : 'Bản nháp'} · Cập nhật {new Date(draft.updatedAt).toLocaleDateString('vi-VN')}</small>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteDraft(draft.id)}
                              title="Xóa bản nháp"
                              style={{ background: '#fee2e2', color: '#dc2626', border: 'none', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* BƯỚC 2: THÔNG TIN CHI TIẾT DYNAMIC */}
              {step === 1 && template && (
                <>
                  {(() => {
                    const placeholders = getCategoryPlaceholders(selectedParentKey, template.name || activeParent?.label, selectedIntent);
                    return (
                      <>
                        <div className="lf-field">
                          <label htmlFor="listing-title">Tiêu đề tin đăng *</label>
                          <input
                            id="listing-title"
                            value={data.title ?? ''}
                            maxLength={200}
                            placeholder={placeholders.title}
                            onChange={e => patch({ title: e.target.value })}
                            aria-invalid={!!errors.title}
                          />
                          <small>{data.title?.length ?? 0}/200 ký tự</small>
                          {fieldError('title')}
                        </div>

                        <div className="lf-field">
                          <label htmlFor="listing-condition">Tình trạng *</label>
                          <select id="listing-condition" value={data.condition ?? ''} onChange={e => patch({ condition: e.target.value })}>
                            <option value="">Chọn tình trạng</option>
                            {Object.entries(conditionLabels).map(([k, label]) => (
                              <option key={k} value={k}>{label}</option>
                            ))}
                          </select>
                          {fieldError('condition')}
                        </div>

                        <h3>Thông tin thuộc tính động theo danh mục</h3>
                        <div className="lf-fields-grid">{dynamicFields(false)}</div>

                        <div className="lf-field">
                          <label htmlFor="listing-description">Mô tả chi tiết *</label>
                          <textarea
                            id="listing-description"
                            rows={6}
                            value={data.description ?? ''}
                            maxLength={10000}
                            placeholder={placeholders.description}
                            onChange={e => patch({ description: e.target.value })}
                          />
                          <small style={{ color: '#00a65a', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                            🔒 Lưu ý: Không ghi địa chỉ giao dịch cụ thể vào Mô tả chi tiết. Vui lòng chọn khu vực ở bước Giá & Vị trí.
                          </small>
                          {fieldError('description')}
                        </div>
                      </>
                    );
                  })()}
                </>
              )}

              {/* BƯỚC 3: ẢNH & VIDEO */}
              {step === 2 && listing && (
                <>
                  <MediaPicker
                    listingId={listing.id}
                    images={data.images ?? []}
                    videos={data.videos ?? []}
                    media={media}
                    disabled={disabled}
                    onBusy={setMediaBusy}
                    onAdd={item => {
                      setMedia(items => [...items, item]);
                      patch({ [item.kind]: [...(current.current[item.kind] ?? []), item.id] });
                    }}
                    onOrder={(kind, ids) => patch({ [kind]: ids })}
                    onRemove={remove}
                  />
                  {fieldError('images')}
                </>
              )}

              {/* BƯỚC 4: GIÁ & VỊ TRÍ */}
              {step === 3 && template && (
                <>
                  <div className="lf-fields-grid">
                    <div className="lf-field">
                      <label htmlFor="listing-price-mode">Cách tính giá *</label>
                      <select id="listing-price-mode" value={data.priceMode} onChange={e => patch({ priceMode: e.target.value })}>
                        {template.config.priceModes.map(mode => (
                          <option key={mode} value={mode}>{priceLabels[mode]}</option>
                        ))}
                      </select>
                    </div>

                    {!['FREE', 'CONTACT'].includes(data.priceMode ?? '') && (
                      <div className="lf-field">
                        <label htmlFor="listing-price">Giá bán (VND) *</label>
                        <input
                          id="listing-price"
                          inputMode="numeric"
                          maxLength={13}
                          placeholder="Nhập số tiền (VND)"
                          value={data.price ?? ''}
                          onChange={e => patch({ price: e.target.value.replace(/[^0-9]/g, '') })}
                        />
                        {fieldError('price')}
                        <small>{listingPrice(data)}</small>
                      </div>
                    )}
                  </div>

                  <label className="lf-check">
                    <input type="checkbox" checked={data.negotiable ?? false} onChange={e => patch({ negotiable: e.target.checked })} />
                    Có thể thương lượng
                  </label>

                  <h3>Vị trí sản phẩm / dịch vụ</h3>
                  <div className="lf-fields-grid">
                    <div className="lf-field">
                      <label htmlFor="province-select">Tỉnh / Thành phố *</label>
                      <select
                        id="province-select"
                        value={data.location?.province || ''}
                        onChange={e => patch({ location: { ...current.current.location, province: e.target.value, district: '' } })}
                      >
                        <option value="">-- Chọn Tỉnh / Thành phố --</option>
                        {ALL_PROVINCES.map((p: any) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                      {fieldError('location.province')}
                    </div>

                    <div className="lf-field">
                      <label htmlFor="district-select">Quận / Huyện *</label>
                      <select
                        id="district-select"
                        value={data.location?.district || ''}
                        onChange={e => patch({ location: { ...current.current.location, district: e.target.value } })}
                      >
                        <option value="">-- Chọn Quận / Huyện --</option>
                        {((ALL_PROVINCES.find((p: any) => p.name === data.location?.province)?.children) || []).map((d: any) => (
                          <option key={d.id || d.name} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                      {fieldError('location.district')}
                    </div>

                    <div className="lf-field">
                      <label htmlFor="ward-input">Phường / Xã *</label>
                      <input
                        id="ward-input"
                        value={data.location?.ward || ''}
                        placeholder="Ví dụ: Phường Lý Thường Kiệt"
                        onChange={e => patch({ location: { ...current.current.location, ward: e.target.value } })}
                      />
                      {fieldError('location.ward')}
                    </div>

                    <div className="lf-field">
                      <label htmlFor="address-input">Địa chỉ cụ thể (Không bắt buộc)</label>
                      <input
                        id="address-input"
                        value={data.location?.address || ''}
                        placeholder="Ví dụ: 123 Đường Lê Hồng Phong"
                        onChange={e => patch({ location: { ...current.current.location, address: e.target.value } })}
                      />
                    </div>
                  </div>

                  <label className="lf-check">
                    <input
                      type="checkbox"
                      checked={data.location?.hideExact !== false}
                      onChange={e => patch({ location: { ...current.current.location, hideExact: e.target.checked } })}
                    />
                    Ẩn địa chỉ cụ thể và tọa độ với người xem tin
                  </label>

                  <button type="button" className="lf-secondary" onClick={locate}>
                    <MapPin size={17} /> Lấy vị trí hiện tại
                  </button>

                  <LocationMap
                    latitude={data.location?.latitude}
                    longitude={data.location?.longitude}
                    disabled={disabled}
                    onChange={point => {
                      const location = { ...current.current.location };
                      if (point) {
                        location.latitude = point.latitude;
                        location.longitude = point.longitude;
                      } else {
                        delete location.latitude;
                        delete location.longitude;
                      }
                      patch({ location });
                    }}
                  />
                </>
              )}

              {/* BƯỚC 5: LIÊN HỆ BẢO VỆ NGƯỜI BÁN */}
              {step === 4 && (
                <>
                  <div className="lf-callout">
                    <ShieldCheck size={24} />
                    <div>
                      <strong>Thông tin người bán (Bảo mật Tất Tần Tật)</strong>
                      <p>Họ tên và số điện thoại chỉ dùng cho giao dịch bảo mật. Email không bao giờ được công khai.</p>
                    </div>
                  </div>
                  {([['name', 'Tên liên hệ *', 'text'], ['phone', 'Số điện thoại *', 'tel'], ['email', 'Email', 'email']] as const).map(([k, label, type]) => (
                    <div className="lf-field" key={k}>
                      <label htmlFor={`listing-contact-${k}`}>{label}</label>
                      <input
                        id={`listing-contact-${k}`}
                        type={type}
                        value={data.contact?.[k] ?? ''}
                        maxLength={k === 'email' ? 254 : 120}
                        onChange={e => patch({ contact: { ...current.current.contact, [k]: e.target.value } })}
                      />
                      {fieldError('contact.' + k)}
                    </div>
                  ))}
                </>
              )}

              {/* BƯỚC 6: XEM TRƯỚC */}
              {step === 5 && template && (
                <>
                  <div className="lf-callout">
                    <CheckCircle2 size={24} />
                    <div>
                      <strong>XEM TRƯỚC TIN ĐĂNG</strong>
                      <p>Kiểm tra kỹ giao diện tin đăng trước khi xuất bản công khai.</p>
                    </div>
                  </div>

                  <article className="lf-preview">
                    <div className="lf-preview-images">
                      {(data.images ?? []).map(id => (
                        <img key={id} src={media.find(item => item.id === id)?.url} alt="Ảnh sản phẩm xem trước" />
                      ))}
                    </div>
                    <p className="lf-eyebrow">{activeParent.label} · {conditionLabels[data.condition ?? '']}</p>
                    <h2>{data.title}</h2>
                    <strong className="lf-price">{listingPrice(data)}</strong>
                    <p>
                      <MapPin size={15} />
                      {[previewData.location?.address, previewData.location?.ward, previewData.location?.district, previewData.location?.province].filter(Boolean).join(', ')}
                    </p>
                    <p className="lf-description">{data.description}</p>
                    <p>Người bán: {data.contact?.name}</p>
                  </article>
                </>
              )}

              {/* BƯỚC 7: HOÀN TẤT */}
              {step === 6 && (
                <div className="lf-callout">
                  <CheckCircle2 size={32} color="#00a65a" />
                  <div>
                    <strong>ĐĂNG TIN THÀNH CÔNG!</strong>
                    <p>Tin đăng của bạn đã sẵn sàng tiếp cận hàng ngàn người mua trên Tất Tần Tật.</p>
                    {listing?.productId && (
                      <p style={{ marginTop: 12 }}>
                        <Link href={`/products/${listing.productId}`} className="lf-button" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                          Xem tin vừa đăng →
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* NAVIGATION BUTTONS */}
              {step < 6 && (
                <div className="lf-actions">
                  {step > 0 && (
                    <button type="button" className="lf-secondary" disabled={disabled} onClick={() => setStep(s => Math.max(0, s - 1))}>
                      Quay lại
                    </button>
                  )}
                  {step < 5 && (
                    <button type="button" className="lf-primary" disabled={disabled} onClick={nextStep}>
                      {busy ? 'Đang xử lý…' : 'Tiếp tục'}
                    </button>
                  )}
                  {step === 5 && (
                    <button type="button" className="lf-primary" disabled={disabled} onClick={publish}>
                      {busy ? 'Đang xuất bản…' : 'ĐĂNG TIN NGAY'}
                    </button>
                  )}
                </div>
              )}
            </fieldset>
          )}
        </section>
      </div>
    </main>
  );
}
