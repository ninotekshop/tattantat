'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { MemberArea } from '../../components/MemberArea';
import { memberRequest, type Product } from '../../lib/api';
import { readSession, saveSession, type WebSession } from '../../lib/auth';
import { listingPrice, type ListingSummary } from '../../lib/listings';
type Profile = { id: string; full_name: string; email: string | null; phone: string | null; phone_verified: boolean };
type Notice = { id: string; title: string; content: string; is_read: boolean; created_at: string; reference_type: string; reference_id: string };
type Block = { id: string; full_name: string };
const sections = { profile: 'Hồ sơ', listings: 'Tin đã đăng', favorites: 'Yêu thích', notifications: 'Thông báo', blocks: 'Đã chặn' };
type Section = keyof typeof sections;
export default function AccountPage() { return <MemberArea>{session => <Account session={session}/>}</MemberArea>; }
function Account({ session }: { session: WebSession }) {
  const [section, setSection] = useState<Section>('profile');
  const [profile, setProfile] = useState<Profile | null>(null), [name, setName] = useState('');
  const [products, setProducts] = useState<Product[]>([]), [drafts, setDrafts] = useState<ListingSummary[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]), [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0);
  const [error, setError] = useState(''), [message, setMessage] = useState('');
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setMessage(''); setProducts([]); setNotices([]); setBlocks([]);
    (async () => {
      if (section === 'profile') { const value = await memberRequest<Profile>('/me'); if (active) { setProfile(value); setName(value.full_name); } }
      if (section === 'listings') { const [items, saved] = await Promise.all([memberRequest<Product[]>('/products/mine'), memberRequest<ListingSummary[]>('/listings/mine')]); if (active) { setProducts(items); setDrafts(saved.filter(d => !d.productId)); } }
      if (section === 'favorites') { const items = await memberRequest<Product[]>('/favorites'); if (active) setProducts(items); }
      if (section === 'notifications') { const items = await memberRequest<Notice[]>('/notifications'); if (active) setNotices(items); }
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
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const value = await memberRequest<Pick<Profile, 'id' | 'full_name'>>('/me', 'PATCH', { fullName: name.trim() });
      const current = readSession();
      if (current?.user.id === session.user.id) saveSession({ ...current, user: { ...current.user, fullName: value.full_name } });
      setMessage('Đã lưu hồ sơ.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể lưu hồ sơ.'); } finally { setBusy(false); }
  }
  return <><h1>Tài khoản của bạn</h1><div className="member-tabs" role="tablist" aria-label="Thông tin tài khoản">{Object.entries(sections).map(([key, label]) => <button key={key} role="tab" aria-selected={section === key} disabled={busy} onClick={() => setSection(key as Section)}>{label}</button>)}</div>
    {error && <p role="alert">{error} <button onClick={() => setRevision(v => v + 1)}>Tải lại</button></p>}{message && <p role="status">{message}</p>}
    {loading ? <p>Đang tải dữ liệu...</p> : <section role="tabpanel" aria-label={sections[section]}>
      {section === 'profile' && profile && <form className="member-card" onSubmit={save}><h2>Hồ sơ cá nhân</h2><label>Họ và tên<input value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={120} required/></label><p>Email: {profile.email || 'Chưa cập nhật'}</p><p>Điện thoại: {profile.phone || 'Chưa cập nhật'} {profile.phone_verified && '· Đã xác minh'}</p><button className="member-primary" disabled={busy || name.trim().length < 2}>Lưu hồ sơ</button></form>}
      {(section === 'listings' || section === 'favorites') && <>
        {section === 'listings' && <p><a className="member-button" href="/sell">Đăng tin / tiếp tục bản nháp ({drafts.length})</a></p>}
        {!products.length && <p className="member-card">{section === 'favorites' ? 'Bạn chưa lưu sản phẩm nào đang được bán.' : 'Bạn chưa có tin đăng.'}</p>}
        <div className="member-grid">{products.map(p => <article className="member-card member-item" key={p.id}>{p.imageUrl && <img src={p.imageUrl} alt={p.title} loading="lazy"/>}<h2>{p.title}</h2><p className="member-price">{listingPrice({ price: p.price.replace(/\.0+$/, ''), priceMode: p.priceMode || 'FIXED' })}</p><p>{p.location}</p><p className="member-muted">{p.status}</p><div className="member-actions">{p.status === 'ACTIVE' && <a className="member-button" href={'/products/' + p.id}>Xem tin</a>}{section === 'favorites' ? <button disabled={busy} onClick={() => action('/favorites/' + p.id, 'DELETE')}>Bỏ yêu thích</button> : <>{p.listingId && <a className="member-button" href={'/sell?listing=' + p.listingId}>Chỉnh sửa</a>}{['ACTIVE', 'HIDDEN'].includes(p.status || '') && <button disabled={busy} onClick={() => action('/products/' + p.id + '/status', 'PATCH', { status: p.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE' })}>{p.status === 'ACTIVE' ? 'Ẩn tin' : 'Hiện tin'}</button>}</>}</div></article>)}</div>
      </>}
      {section === 'notifications' && <><p className="member-muted">50 thông báo gần nhất.</p><button disabled={busy || !notices.some(n => !n.is_read)} onClick={() => action('/notifications/read-all', 'PATCH')}>Đánh dấu tất cả đã đọc</button>{!notices.length && <p>Chưa có thông báo.</p>}{notices.map(n => <article key={n.id} className={'member-card ' + (!n.is_read ? 'unread' : '')}><h2>{n.title}</h2><p>{n.content}</p><p className="member-muted">{new Date(n.created_at).toLocaleString('vi-VN')}</p><div className="member-actions">{!n.is_read && <button disabled={busy} onClick={() => action('/notifications/' + n.id + '/read', 'PATCH')}>Đã đọc</button>}{n.reference_type === 'CHAT' && <a className="member-button" href={'/messages?chat=' + encodeURIComponent(n.reference_id)}>Mở hội thoại</a>}{n.reference_type === 'ORDER' && <a className="member-button" href="/orders">Xem đơn hàng</a>}</div></article>)}</>}
      {section === 'blocks' && <>{!blocks.length && <p className="member-card">Bạn chưa chặn người dùng nào.</p>}{blocks.map(b => <article className="member-card" key={b.id}><h2>{b.full_name}</h2><button disabled={busy} onClick={() => { if (window.confirm('Bỏ chặn ' + b.full_name + '?')) void action('/users/' + b.id + '/block', 'DELETE'); }}>Bỏ chặn</button></article>)}</>}
    </section>}</>;
}
