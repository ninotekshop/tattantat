'use client';
import { useCallback, useEffect, useState } from 'react';
import '../../../app/goi-dich-vu/billing.css';

type Recent = { title: string; content: string; recipients: number; sentAt: string };

export function AdminBroadcast({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [audience, setAudience] = useState<'ALL' | 'SELLERS' | 'USER'>('ALL');
  const [userId, setUserId] = useState(''); const [title, setTitle] = useState(''); const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [ok, setOk] = useState('');
  const [recent, setRecent] = useState<Recent[]>([]);

  const load = useCallback(async () => {
    try { const r = await fetch('/api/v1/admin/notifications/recent', { headers: authHeaders(), cache: 'no-store' }); const j = await r.json(); if (j?.success) setRecent(j.data); } catch { /* bỏ qua */ }
  }, [authHeaders]);
  useEffect(() => { void load(); }, [load]);

  async function send() {
    const who = audience === 'ALL' ? 'TẤT CẢ người dùng' : audience === 'SELLERS' ? 'tất cả người bán' : 'người dùng đã chọn';
    if (!window.confirm(`Gửi thông báo này tới ${who}?`)) return;
    setBusy(true); setError(''); setOk('');
    try {
      const res = await fetch('/api/v1/admin/notifications/broadcast', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ audience, title, content, ...(audience === 'USER' ? { userId: userId.trim() } : {}) }) });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(Array.isArray(json?.message) ? json.message.join('. ') : json?.message || 'Không gửi được thông báo.');
      setOk(json.message); setTitle(''); setContent(''); void load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }

  return <div className="bl" style={{ padding: 0 }}>
    {error && <div className="bl-msg err" role="alert">{error}</div>}{ok && <div className="bl-msg ok" role="status">{ok}</div>}
    <div className="bl-card" style={{ maxWidth: 680 }}>
      <h2>Gửi thông báo tới người dùng</h2>
      <p style={{ color: '#71817b', marginTop: -6 }}>Thông báo hiện ở chuông đầu trang của người dùng (mục “Từ Tất Tần Tật”).</p>
      <label style={{ fontWeight: 700 }}>Người nhận</label>
      <select className="bl-in" style={{ maxWidth: '100%', margin: '6px 0 12px' }} value={audience} onChange={e => setAudience(e.target.value as 'ALL' | 'SELLERS' | 'USER')}>
        <option value="ALL">Toàn bộ người dùng đang hoạt động</option><option value="SELLERS">Chỉ người bán (đã có tin đăng)</option><option value="USER">Một người dùng cụ thể</option></select>
      {audience === 'USER' && <><label style={{ fontWeight: 700 }}>Mã người dùng (ID)</label><input className="bl-in" style={{ maxWidth: '100%', margin: '6px 0 12px' }} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={userId} onChange={e => setUserId(e.target.value)} /></>}
      <label style={{ fontWeight: 700 }}>Tiêu đề</label><input className="bl-in" style={{ maxWidth: '100%', margin: '6px 0 12px' }} maxLength={200} value={title} onChange={e => setTitle(e.target.value)} />
      <label style={{ fontWeight: 700 }}>Nội dung</label><textarea className="bl-in" rows={5} style={{ maxWidth: '100%', margin: '6px 0 12px' }} maxLength={2000} value={content} onChange={e => setContent(e.target.value)} />
      <button className="bl-btn primary" disabled={busy || title.trim().length < 3 || content.trim().length < 3 || (audience === 'USER' && !userId.trim())} onClick={() => void send()}>{busy ? 'Đang gửi…' : 'Gửi thông báo'}</button>
    </div>
    <div className="bl-card"><h2>Đã gửi 30 ngày qua</h2>
      <table className="bl-tbl"><thead><tr><th>Thời gian</th><th>Tiêu đề</th><th>Nội dung</th><th>Người nhận</th></tr></thead><tbody>
        {recent.map((r, i) => <tr key={i}><td>{new Date(r.sentAt).toLocaleString('vi-VN')}</td><td><b>{r.title}</b></td><td>{r.content.slice(0, 90)}</td><td>{r.recipients}</td></tr>)}
        {!recent.length && <tr><td colSpan={4} style={{ color: '#71817b' }}>Chưa có thông báo nào.</td></tr>}</tbody></table></div>
  </div>;
}
