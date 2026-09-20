'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { memberRequest, type Product } from '../lib/api';
import { readSession } from '../lib/auth';
export function ProductActions({ product }: { product: Product }) {
  const router = useRouter();
  const [owner, setOwner] = useState(false), [saved, setSaved] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [report, setReport] = useState(false), [reason, setReason] = useState('SPAM'), [details, setDetails] = useState('');
  useEffect(() => { let active = true; const session = readSession(); setOwner(session?.user.id === product.sellerId); if (session) memberRequest<Product[]>('/favorites').then(items => { if (active) setSaved(items.some(p => p.id === product.id)); }).catch(() => {}); return () => { active = false; }; }, [product.id, product.sellerId]);
  function requireLogin() { if (readSession()) return true; router.push('/login?next=' + encodeURIComponent('/products/' + product.id)); return false; }
  async function perform(action: () => Promise<void>) { if (busy || !requireLogin()) return; setBusy(true); setError(''); setMessage(''); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Thao tác chưa thành công.'); } finally { setBusy(false); } }
  return <section className="member-page" style={{ margin: '20px 0', padding: 0, minHeight: 0 }} aria-label="Thao tác tin đăng">
    {owner ? <a className="member-button" href={product.listingId ? '/sell?listing=' + product.listingId : '/account'}>Quản lý tin đăng</a> : <div className="member-actions">
      <a className="member-button member-primary" href={'/messages?product=' + encodeURIComponent(product.id)}>Nhắn người bán</a>
      {(!product.priceMode || product.priceMode === 'FIXED') && <a className="member-button" href={'/checkout/' + product.id}>Mua ngay</a>}
      <button disabled={busy} aria-pressed={saved} onClick={() => perform(async () => { await memberRequest('/favorites/' + product.id, saved ? 'DELETE' : 'POST'); setSaved(!saved); })}>{saved ? 'Bỏ yêu thích' : 'Lưu yêu thích'}</button>
      <button disabled={busy} onClick={() => { if (requireLogin()) setReport(v => !v); }}>Báo cáo tin</button>
      <button disabled={busy} onClick={() => { if (window.confirm('Chặn người bán này? Hai bên sẽ không thể liên hệ qua chat.')) void perform(async () => { await memberRequest('/users/' + product.sellerId + '/block', 'POST'); router.push('/account'); }); }}>Chặn người bán</button>
    </div>}
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {report && <form onSubmit={e => { e.preventDefault(); void perform(async () => { await memberRequest('/reports', 'POST', { productId: product.id, reason, details }); setReport(false); setMessage('Đã gửi báo cáo để quản trị viên xem xét.'); }); }}>
      <label>Lý do báo cáo<select value={reason} onChange={e => setReason(e.target.value)}>{Object.entries({ SPAM: 'Tin rác', FRAUD: 'Nghi lừa đảo', PROHIBITED: 'Hàng cấm', ABUSE: 'Nội dung xúc phạm', OTHER: 'Khác' }).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>Mô tả<textarea value={details} onChange={e => setDetails(e.target.value)} maxLength={1000}/></label><button disabled={busy}>Gửi báo cáo</button>
    </form>}
  </section>;
}
