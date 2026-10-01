'use client';
import { useEffect, useState, type FormEvent } from 'react';
import './account.css';
import { fileToAvatarDataUrl } from '../../lib/avatar';
import { BadgeCheck, Ban, Bell, BellOff, BellRing, Bookmark, ChevronRight, Eye, EyeOff, FileText, Heart, BarChart3, Mail, MessageCircle, Pencil, Phone, PlusCircle, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Trash2, User, Wallet, ExternalLink, MapPin } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { noticeIcon } from '../../components/NoticeIcon';
import { MemberArea } from '../../components/MemberArea';
import { memberRequest, type Product } from '../../lib/api';
import { readSession, saveSession, type WebSession } from '../../lib/auth';
import { listingPrice, type ListingSummary } from '../../lib/listings';
type Profile = { id: string; full_name: string; avatar_url?: string | null; email: string | null; phone: string | null; phone_verified: boolean };
type Notice = { id: string; type?: string; title: string; content: string; is_read: boolean; created_at: string; reference_type: string; reference_id: string };
type Block = { id: string; full_name: string };
const sections = { profile: 'Hồ sơ', listings: 'Tin đã đăng', notifications: 'Thông báo', searches: 'Tìm kiếm đã lưu', prefs: 'Cài đặt thông báo', blocks: 'Đã chặn' };
const SECTION_ICON = { profile: User, listings: FileText, notifications: Bell, searches: Bookmark, prefs: SlidersHorizontal, blocks: Ban } as const;
const STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Đang hiển thị', cls: 'ok' }, PENDING_REVIEW: { label: 'Chờ duyệt', cls: 'wait' }, REJECTED: { label: 'Bị từ chối', cls: 'bad' },
  HIDDEN: { label: 'Đã ẩn', cls: 'mute' }, SOLD: { label: 'Đã bán', cls: 'info' }, RESERVED: { label: 'Đang giao dịch', cls: 'info' }, DRAFT: { label: 'Nháp', cls: 'mute' }, EXPIRED: { label: 'Hết hạn', cls: 'mute' },
};
type PrefData = { prefs: Record<'push' | 'email', Record<string, boolean>>; categories: { key: string; label: string; help: string }[]; emailAvailable: boolean };
type Saved = { id: string; name: string; notify: boolean; params: Record<string, unknown> };
type Section = keyof typeof sections;
export default function AccountPage() {
  // Liên kết cũ /account?section=favorites -> trang Yêu thích riêng
  useEffect(() => { if (new URLSearchParams(window.location.search).get('section') === 'favorites') window.location.replace('/favorites'); }, []);
  return <Suspense fallback={null}><MemberArea>{session => <Account session={session}/>}</MemberArea></Suspense>;
}
function Account({ session }: { session: WebSession }) {
  const sp = useSearchParams(); const q = sp.get('section'); const section: Section = q && q in sections ? (q as Section) : 'profile';
  const [profile, setProfile] = useState<Profile | null>(null), [name, setName] = useState('');
  const [products, setProducts] = useState<Product[]>([]), [drafts, setDrafts] = useState<ListingSummary[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]), [blocks, setBlocks] = useState<Block[]>([]), [searches, setSearches] = useState<Saved[]>([]), [prefData, setPrefData] = useState<PrefData | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0);
  const [error, setError] = useState(''), [message, setMessage] = useState('');
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setMessage(''); setProducts([]); setNotices([]); setBlocks([]);
    (async () => {
      if (section === 'profile') { const value = await memberRequest<Profile>('/me'); if (active) { setProfile(value); setName(value.full_name); } }
      if (section === 'listings') { const [items, saved] = await Promise.all([memberRequest<Product[]>('/products/mine'), memberRequest<ListingSummary[]>('/listings/mine')]); if (active) { setProducts(items); setDrafts(saved.filter(d => !d.productId)); } }
      if (section === 'notifications') { const items = await memberRequest<Notice[]>('/notifications'); if (active) setNotices(items); }
      if (section === 'searches') { const items = await memberRequest<Saved[]>('/me/saved-searches'); if (active) setSearches(items); }
      if (section === 'prefs') { const v = await memberRequest<PrefData>('/me/notification-prefs'); if (active) setPrefData(v); }
      if (section === 'blocks') { const items = await memberRequest<Block[]>('/me/blocks'); if (active) setBlocks(items); }
    })().catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [section, revision]);
  async function action(path: string, method: string, body?: unknown) {
    if (busy) return; setBusy(true); setError('');
    try { await memberRequest(path, method, body); setRevision(v => v + 1); }
    catch (e) { setError(e instanceof Error ? e.message : 'Thao tác chưa thành công.'); }
    finally { setBusy(false); }
  }
  async function uploadAvatar(file?: File) {
    if (!file) return; setBusy(true); setError(''); setMessage('');
    try {
      const avatarUrl = await fileToAvatarDataUrl(file);
      const value = await memberRequest<{ avatar_url: string | null }>('/me', 'PATCH', { avatarUrl });
      setProfile(p => p ? { ...p, avatar_url: value.avatar_url } : p);
      const current = readSession();
      if (current?.user.id === session.user.id) saveSession({ ...current, user: { ...current.user, avatarUrl: value.avatar_url } });
      window.dispatchEvent(new Event('tt-profile-updated'));
      setMessage('Đã cập nhật ảnh đại diện.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể cập nhật ảnh đại diện.'); } finally { setBusy(false); }
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const value = await memberRequest<Pick<Profile, 'id' | 'full_name'>>('/me', 'PATCH', { fullName: name.trim() });
      const current = readSession();
      if (current?.user.id === session.user.id) saveSession({ ...current, user: { ...current.user, fullName: value.full_name } });
      setMessage('Đã lưu hồ sơ.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể lưu hồ sơ.'); } finally { setBusy(false); }
  }
  const paramChips = (x: Saved) => [x.params.q && `Từ khóa: ${x.params.q}`, x.params.location && `Khu vực: ${x.params.location}`, x.params.minPrice && `Từ ${Number(x.params.minPrice).toLocaleString('vi-VN')}\u00a0đ`, x.params.maxPrice && `Đến ${Number(x.params.maxPrice).toLocaleString('vi-VN')}\u00a0đ`].filter(Boolean) as string[];

  return <div className="ac-content">
        {error && <p className="ac-msg bad" role="alert">{error} <button className="ac-link" onClick={() => setRevision(v => v + 1)}>Tải lại</button></p>}
        {message && <p className="ac-msg ok" role="status"><BadgeCheck size={16} />{message}</p>}
        {loading ? <div className="ac-skel">{[0, 1, 2].map(i => <i key={i} />)}</div> : <section role="tabpanel" aria-label={sections[section]}>

          {section === 'profile' && profile && <form className="ac-card" onSubmit={save}>
            <div className="ac-card-h"><h2><User size={19} />Hồ sơ cá nhân</h2><p>Thông tin hiển thị với người mua và người bán khi giao dịch.</p></div>
            <div className="ac-avatar-edit">
              <div className="ac-avatar lg">{profile.avatar_url ? <img src={profile.avatar_url} alt="Ảnh đại diện" /> : (name.trim()[0] || 'T').toUpperCase()}</div>
              <div><label className="ac-btn"><Pencil size={15} />Đổi ảnh đại diện<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={busy} onChange={e => { void uploadAvatar(e.target.files?.[0]); e.target.value = ''; }} /></label><p className="ac-hint">JPG, PNG hoặc WebP. Ảnh sẽ được cắt vuông tự động.</p></div>
            </div>
            <label className="ac-field"><span>Họ và tên</span><input value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={120} required /></label>
            <div className="ac-info">
              <div><span>Email</span><b>{profile.email || 'Chưa cập nhật'}</b></div>
              <div><span>Số điện thoại</span><b>{profile.phone || 'Chưa cập nhật'}{profile.phone_verified && <em className="ac-ok"><BadgeCheck size={14} />Đã xác minh</em>}</b></div>
            </div>
            <div className="ac-row">
              <button className="ac-btn primary" disabled={busy || name.trim().length < 2}>Lưu hồ sơ</button>
              <a className="ac-btn" href="/xac-minh"><ShieldCheck size={16} />Xác minh tài khoản (SĐT, CCCD)</a>
            </div>
          </form>}

          {section === 'listings' && <>
            <div className="ac-bar"><h2>Tin đã đăng <small>{products.length}</small></h2><a className="ac-btn primary" href="/sell"><PlusCircle size={16} />Đăng tin / tiếp tục bản nháp ({drafts.length})</a></div>
            {!products.length && <div className="ac-empty"><FileText size={34} /><h3>Bạn chưa có tin đăng</h3><p>Đăng tin đầu tiên để bắt đầu bán hàng trên Tất Tần Tật.</p><a className="ac-btn primary" href="/sell">Đăng tin ngay</a></div>}
            <div className="ac-grid">{products.map(p => { const st = STATUS[p.status || ''] ?? { label: p.status || '', cls: 'mute' }; return <article className="ac-item" key={p.id}>
              <div className="ac-thumb">{p.imageUrl ? <img src={p.imageUrl} alt={p.title} loading="lazy" /> : <FileText size={30} />}<span className={'ac-chip ' + st.cls}>{st.label}</span></div>
              <div className="ac-item-b"><h3>{p.title}</h3>
                <p className="ac-price">{listingPrice({ price: p.price.replace(/\.0+$/, ''), priceMode: p.priceMode || 'FIXED' })}</p>
                {p.location && <p className="ac-loc"><MapPin size={14} />{p.location}</p>}
                {p.status === 'REJECTED' && <p className="ac-hint">Hãy chỉnh sửa và gửi lại để được duyệt.</p>}
                <div className="ac-actions">
                  {p.status === 'ACTIVE' && <a className="ac-btn sm" href={'/products/' + p.id}><ExternalLink size={14} />Xem</a>}
                  {p.listingId && <a className="ac-btn sm" href={'/sell?listing=' + p.listingId}><Pencil size={14} />Sửa</a>}
                  {['ACTIVE', 'HIDDEN'].includes(p.status || '') && <button className="ac-btn sm" disabled={busy} onClick={() => action('/products/' + p.id + '/status', 'PATCH', { status: p.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE' })}>{p.status === 'ACTIVE' ? <><EyeOff size={14} />Ẩn</> : <><Eye size={14} />Hiện</>}</button>}
                </div>
              </div></article>; })}</div>
          </>}

          {section === 'notifications' && <>
            <div className="ac-bar"><h2>Thông báo <small>50 gần nhất</small></h2>
              <div className="ac-row"><button className="ac-btn" disabled={busy || !notices.some(n => !n.is_read)} onClick={() => action('/notifications/read-all', 'PATCH')}>Đánh dấu tất cả đã đọc</button><a className="ac-btn" href="/notifications">Xem tất cả<ChevronRight size={15} /></a></div></div>
            {!notices.length && <div className="ac-empty"><BellOff size={34} /><h3>Chưa có thông báo</h3><p>Thông báo về đơn hàng, tin nhắn và tin đăng sẽ hiện ở đây.</p></div>}
            {!!notices.length && <div className="ac-list">{notices.map(n => { const Icon = noticeIcon(n.type ?? ''); return <div key={n.id} className={'nb-item' + (n.is_read ? '' : ' unread')} style={{ cursor: 'default' }}>
              <span className="nb-ico" style={{ background: '#e6f6ed', color: '#0a8a55' }}><Icon size={18} />{!n.is_read && <i className="nb-dot" />}</span>
              <span style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block' }}>{n.title}</b><span style={{ color: '#4b5d55', fontSize: 13.5 }}>{n.content}</span>
                <small style={{ display: 'block', color: '#8a9a93', marginTop: 4 }}>{new Date(n.created_at).toLocaleString('vi-VN')}</small>
                <span className="ac-actions" style={{ marginTop: 8 }}>
                  {!n.is_read && <button className="ac-btn sm" disabled={busy} onClick={() => action('/notifications/' + n.id + '/read', 'PATCH')}>Đã đọc</button>}
                  {n.reference_type === 'CHAT' && <a className="ac-btn sm" href={'/messages?chat=' + encodeURIComponent(n.reference_id)}>Mở hội thoại</a>}
                  {n.reference_type === 'ORDER' && <a className="ac-btn sm" href="/orders">Xem đơn hàng</a>}
                </span></span></div>; })}</div>}
          </>}

          {section === 'searches' && <>
            <div className="ac-bar"><h2>Tìm kiếm đã lưu <small>{searches.length}</small></h2></div>
            {!searches.length && <div className="ac-empty"><Bookmark size={34} /><h3>Chưa có tìm kiếm nào được lưu</h3><p>Nhập từ khóa ở trang chủ rồi bấm “Lưu tìm kiếm” để nhận thông báo khi có tin mới phù hợp.</p><a className="ac-btn primary" href="/">Về trang chủ</a></div>}
            <div className="ac-list-cards">{searches.map(x => <article className="ac-card ac-search" key={x.id}>
              <div className="ac-search-h"><h3><Search size={17} />{x.name}</h3><span className={'ac-chip ' + (x.notify ? 'ok' : 'mute')}>{x.notify ? <><BellRing size={13} />Đang nhận thông báo</> : <><BellOff size={13} />Đã tắt thông báo</>}</span></div>
              <div className="ac-chips">{paramChips(x).map(c => <span key={c}>{c}</span>)}</div>
              <div className="ac-actions"><a className="ac-btn sm primary" href={'/?q=' + encodeURIComponent(String(x.params.q ?? ''))}>Xem kết quả</a>
                <button className="ac-btn sm" disabled={busy} onClick={() => action('/me/saved-searches/' + x.id, 'PATCH', { notify: !x.notify })}>{x.notify ? 'Tắt thông báo' : 'Bật thông báo'}</button>
                <button className="ac-btn sm danger" disabled={busy} onClick={() => action('/me/saved-searches/' + x.id, 'DELETE')}><Trash2 size={14} />Xóa</button></div>
            </article>)}</div>
          </>}

          {section === 'prefs' && prefData && <div className="ac-card">
            <div className="ac-card-h"><h2><SlidersHorizontal size={19} />Cài đặt thông báo</h2><p>Chọn loại thông báo bạn muốn nhận qua từng kênh.</p></div>
            {!prefData.emailAvailable && <p className="ac-msg wait">Kênh email chưa được bật trên hệ thống; thông báo trong ứng dụng và thông báo đẩy vẫn hoạt động.</p>}
            <div className="ac-prefs"><div className="ac-prefs-h"><span>Loại thông báo</span><span>Đẩy</span><span>Email</span></div>
              {prefData.categories.map(c => <div className="ac-pref" key={c.key}><div><b>{c.label}</b><small>{c.help}</small></div>
                {(['push', 'email'] as const).map(ch => <label className="ac-sw" key={ch}><input type="checkbox" aria-label={c.label + ' ' + ch} disabled={busy || (ch === 'email' && !prefData.emailAvailable)} checked={prefData.prefs[ch][c.key] !== false} onChange={e => setPrefData({ ...prefData, prefs: { ...prefData.prefs, [ch]: { ...prefData.prefs[ch], [c.key]: e.target.checked } } })} /><i /></label>)}</div>)}
            </div>
            <div className="ac-row"><button className="ac-btn primary" disabled={busy} onClick={async () => { setBusy(true); setError(''); setMessage(''); try { await memberRequest('/me/notification-prefs', 'PUT', { prefs: prefData.prefs }); setMessage('Đã lưu cài đặt thông báo.'); } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được.'); } finally { setBusy(false); } }}>Lưu cài đặt</button></div>
          </div>}

          {section === 'blocks' && <>
            <div className="ac-bar"><h2>Người dùng đã chặn <small>{blocks.length}</small></h2></div>
            {!blocks.length && <div className="ac-empty"><Ban size={34} /><h3>Bạn chưa chặn người dùng nào</h3><p>Người bị chặn sẽ không thể nhắn tin hay đặt mua tin của bạn.</p></div>}
            <div className="ac-list-cards">{blocks.map(b => <article className="ac-card ac-block" key={b.id}><div className="ac-avatar sm" aria-hidden="true">{b.full_name.trim()[0]?.toUpperCase()}</div><b>{b.full_name}</b>
              <button className="ac-btn sm" disabled={busy} onClick={() => { if (window.confirm('Bỏ chặn ' + b.full_name + '?')) void action('/users/' + b.id + '/block', 'DELETE'); }}>Bỏ chặn</button></article>)}</div>
          </>}
        </section>}
  </div>;
}
