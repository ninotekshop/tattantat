'use client';
import { Ic } from '../../Ic';
import { BadgeCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import '../../../app/goi-dich-vu/billing.css';

type Row = { id: string; user_id: string; full_name: string; id_last4: string; status: string; reject_reason: string | null; created_at: string; email: string | null; phone: string | null; phone_verified: boolean };
type Detail = { id: string; fullName: string; idLast4: string; status: string; images: { front: string | null; back: string | null; selfie: string | null } };
const inp: React.CSSProperties = { padding: '8px 10px', border: '1px solid #dce6e0', borderRadius: 8, fontSize: 13 };
const STATUS: Record<string, string> = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' };

type PhoneRow = { id: string; phone: string; status: string; reject_reason: string | null; created_at: string; full_name: string | null; email: string | null };

function PhoneRequests({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [rows, setRows] = useState<PhoneRow[]>([]); const [status, setStatus] = useState('PENDING'); const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [ok, setOk] = useState('');
  const call = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(`/api/v1${path}`, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) }, cache: 'no-store' });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.success) throw new Error(Array.isArray(j?.message) ? j.message.join('. ') : j?.message || 'Thao tác không thành công.');
    return j;
  }, [authHeaders]);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { setRows((await call(`/admin/verifications/phone?status=${status}`)).data.items); } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }, [call, status]);
  useEffect(() => { void load(); }, [load]);
  async function review(id: string, action: 'APPROVE' | 'REJECT') {
    setBusy(true); setError(''); setOk('');
    try { setOk((await call(`/admin/verifications/phone/${id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, reason: reasons[id] ?? '' }) })).message); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }
  return <div className="bl-card" style={{ marginBottom: 16 }}>
    <h3 style={{ marginTop: 0 }}>Yêu cầu xác minh số điện thoại</h3>
    {error && <div className="bl-msg err">{error}</div>}{ok && <div className="bl-msg ok">{ok}</div>}
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <select value={status} onChange={e => setStatus(e.target.value)} style={inp}><option value="PENDING">Chờ duyệt</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Từ chối</option></select>
      <button className="bl-btn sm" disabled={busy} onClick={() => void load()}>Tải lại</button>
    </div>
    <div style={{ overflowX: 'auto' }}><table className="bl-tbl"><thead><tr><th>Tài khoản</th><th>Số điện thoại</th><th>Gửi lúc</th><th>Trạng thái</th><th>Xử lý</th></tr></thead><tbody>
      {rows.map(r => <tr key={r.id}><td><b>{r.full_name ?? '—'}</b><div style={{ fontSize: 12, color: '#71817b' }}>{r.email}</div></td><td><b>{r.phone}</b></td><td>{new Date(r.created_at).toLocaleString('vi-VN')}</td><td>{STATUS[r.status] ?? r.status}{r.reject_reason ? <div style={{ fontSize: 12, color: '#b53434' }}>{r.reject_reason}</div> : null}</td>
        <td>{r.status === 'PENDING' ? <div style={{ display: 'grid', gap: 6, minWidth: 220 }}>
          <input style={inp} placeholder="Lý do (bắt buộc khi từ chối)" value={reasons[r.id] ?? ''} onChange={e => setReasons(x => ({ ...x, [r.id]: e.target.value }))} />
          <div style={{ display: 'flex', gap: 6 }}><button className="bl-btn sm" disabled={busy} onClick={() => void review(r.id, 'APPROVE')}>Duyệt</button><button className="bl-btn sm" style={{ color: '#b53434', borderColor: '#f0cfc9' }} disabled={busy || (reasons[r.id] ?? '').trim().length < 3} onClick={() => void review(r.id, 'REJECT')}>Từ chối</button></div></div> : '—'}</td></tr>)}
      {!rows.length && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#71817b', padding: 24 }}>{busy ? 'Đang tải…' : 'Không có yêu cầu nào.'}</td></tr>}
    </tbody></table></div>
  </div>;
}

export function VerificationsAdmin({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [rows, setRows] = useState<Row[]>([]); const [status, setStatus] = useState('PENDING'); const [detail, setDetail] = useState<Detail | null>(null); const [sel, setSel] = useState<Row | null>(null); const [broken, setBroken] = useState<Record<string, boolean>>({}); const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [ok, setOk] = useState('');
  const call = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(`/api/v1${path}`, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) }, cache: 'no-store' });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.success) throw new Error(Array.isArray(j?.message) ? j.message.join('. ') : j?.message || 'Thao tác không thành công.');
    return j;
  }, [authHeaders]);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { setRows((await call(`/admin/verifications?status=${status}`)).data.items); } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }, [call, status]);
  useEffect(() => { void load(); }, [load]);
  async function open(id: string) { setBusy(true); setError(''); setReason(''); setBroken({}); setSel(rows.find(r => r.id === id) ?? null); try { setDetail((await call(`/admin/verifications/${id}`)).data); } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); } }
  async function review(action: 'APPROVE' | 'REJECT') {
    if (!detail) return; setBusy(true); setError(''); setOk('');
    try { setOk((await call(`/admin/verifications/${detail.id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, reason }) })).message); setDetail(null); setSel(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }
  return <div className="bl" style={{ padding: 0 }}>
    <PhoneRequests authHeaders={authHeaders} />
    {error && <div className="bl-msg err">{error}</div>}{ok && <div className="bl-msg ok">{ok}</div>}
    <div className="bl-card">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={status} onChange={e => setStatus(e.target.value)} style={inp}><option value="PENDING">Chờ duyệt</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Từ chối</option></select>
        <button className="bl-btn sm" disabled={busy} onClick={() => void load()}>Tải lại</button>
      </div>
      <div style={{ overflowX: 'auto' }}><table className="bl-tbl"><thead><tr><th>Họ tên</th><th>Tài khoản</th><th>Giấy tờ</th><th>Gửi lúc</th><th>Trạng thái</th><th></th></tr></thead><tbody>
        {rows.map(r => <tr key={r.id}><td><b>{r.full_name}</b></td><td>{r.email}<div style={{ fontSize: 12, color: '#71817b' }}>{r.phone ?? '—'}{r.phone_verified && <Ic i={BadgeCheck} after/>}</div></td><td>••••{r.id_last4}</td><td>{new Date(r.created_at).toLocaleString('vi-VN')}</td><td>{STATUS[r.status] ?? r.status}</td>
          <td><button className="bl-btn sm" disabled={busy} onClick={() => void open(r.id)}>{r.status === 'PENDING' ? 'Xem & duyệt' : 'Xem'}</button></td></tr>)}
        {!rows.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#71817b', padding: 24 }}>{busy ? 'Đang tải…' : 'Không có hồ sơ nào.'}</td></tr>}
      </tbody></table></div>
    </div>
    {detail && <div onClick={() => { setDetail(null); setSel(null); }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
      <div className="bl-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 1000, margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 4 }}>Hồ sơ giấy tờ tùy thân: {detail.fullName}</h3>
            <div style={{ fontSize: 13, color: '#475569', display: 'grid', gap: 2 }}>
              <span>Số giấy tờ: ••••{detail.idLast4} · Trạng thái: <b>{STATUS[detail.status] ?? detail.status}</b></span>
              {sel && <span>Tài khoản: {sel.email ?? '—'} · SĐT: {sel.phone ?? '—'}{sel.phone_verified ? ' (đã xác minh)' : ''} · Gửi lúc {new Date(sel.created_at).toLocaleString('vi-VN')}</span>}
            </div>
          </div>
          <button className="bl-btn sm" onClick={() => { setDetail(null); setSel(null); }}>Đóng</button>
        </div>
        <p style={{ fontSize: 12, color: '#71817b' }}>Liên kết ảnh chỉ có hiệu lực 5 phút. Bấm vào ảnh để xem cỡ lớn. Đối chiếu họ tên, số giấy tờ và khuôn mặt trước khi duyệt.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {([['front', 'Mặt trước giấy tờ'], ['back', 'Mặt sau giấy tờ'], ['selfie', 'Ảnh chân dung (selfie)']] as const).map(([k, label]) => <div key={k}>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{label}</div>
            {detail.images[k] && !broken[k]
              ? <a href={detail.images[k]!} target="_blank" rel="noreferrer"><img src={detail.images[k]!} alt={label} onError={() => setBroken(b => ({ ...b, [k]: true }))} style={{ width: '100%', maxHeight: 340, objectFit: 'contain', background: '#f1f5f9', borderRadius: 8, border: '1px solid #dce6e0' }} /></a>
              : <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 12, fontSize: 12.5, color: '#b53434', background: '#fef2f2', border: '1px dashed #f0cfc9', borderRadius: 8 }}>Không hiển thị được ảnh này (chưa tải lên hoặc không có trong kho lưu trữ). Hãy yêu cầu người dùng gửi lại hồ sơ.</div>}
          </div>)}
        </div>
        {detail.status === 'PENDING' && <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
          <input style={inp} placeholder="Lý do (bắt buộc khi từ chối)" value={reason} onChange={e => setReason(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}><button className="bl-btn" disabled={busy} onClick={() => void review('APPROVE')}>Duyệt</button><button className="bl-btn" style={{ color: '#b53434', borderColor: '#f0cfc9' }} disabled={busy || reason.trim().length < 3} onClick={() => void review('REJECT')}>Từ chối</button></div></div>}
      </div>
    </div>}
  </div>;
}
