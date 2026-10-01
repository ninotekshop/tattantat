'use client';
import { useCallback, useEffect, useState } from 'react';
import '../../../app/goi-dich-vu/billing.css';

type Signal = { key: string; label: string; points: number };
type Row = { id: string; name: string; email: string; status: string; verified: boolean; createdAt: string; score: number; level: 'LOW' | 'MEDIUM' | 'HIGH'; signals: Signal[] };
type Settings = { chatWarnings: boolean; newAccountDays: number; newAccountBlockContactInChat: boolean; newAccountDailyListings: number; duplicateCheck: boolean };
const COLORS = { HIGH: '#b53434', MEDIUM: '#c77700', LOW: '#71817b' } as const;
const LABEL = { HIGH: 'Cao', MEDIUM: 'Trung bình', LOW: 'Thấp' } as const;

export function RiskAdmin({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [rows, setRows] = useState<Row[]>([]); const [settings, setSettings] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [ok, setOk] = useState(''); const [level, setLevel] = useState('');
  const call = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(`/api/v1${path}`, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) }, cache: 'no-store' });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.success) throw new Error(Array.isArray(j?.message) ? j.message.join('. ') : j?.message || 'Thao tác không thành công.');
    return j;
  }, [authHeaders]);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { const [u, s] = await Promise.all([call('/admin/risk/users'), call('/admin/risk/settings')]); setRows(u.data); setSettings(s.data); }
    catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }, [call]);
  useEffect(() => { void load(); }, [load]);
  async function save() {
    if (!settings) return; setBusy(true); setError(''); setOk('');
    try { const j = await call('/admin/risk/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings }) }); setSettings(j.data); setOk(j.message); }
    catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }
  async function suspend(r: Row) {
    const reason = window.prompt(`Lý do khóa tài khoản ${r.name}?`, 'Nghi ngờ lừa đảo'); if (!reason?.trim()) return;
    setBusy(true); setError(''); setOk('');
    try { await call(`/admin/users/${r.id}/suspend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: reason.trim() }) }); setOk('Đã khóa tài khoản.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }
  const shown = rows.filter(r => !level || r.level === level);
  const num = (k: 'newAccountDays' | 'newAccountDailyListings', v: string) => setSettings(s => s && { ...s, [k]: Math.max(0, Math.min(100, Number(v) || 0)) });
  return <div className="bl" style={{ padding: 0 }}>
    {error && <div className="bl-msg err">{error}</div>}{ok && <div className="bl-msg ok">{ok}</div>}
    {settings && <div className="bl-card"><h3 style={{ marginTop: 0 }}>Cài đặt chống lừa đảo</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        <label><input type="checkbox" checked={settings.chatWarnings} onChange={e => setSettings({ ...settings, chatWarnings: e.target.checked })} /> Gắn cảnh báo lên tin nhắn có dấu hiệu lừa đảo (đòi cọc, mời qua Zalo, gửi link, hỏi OTP…)</label>
        <label><input type="checkbox" checked={settings.newAccountBlockContactInChat} onChange={e => setSettings({ ...settings, newAccountBlockContactInChat: e.target.checked })} /> Chặn tài khoản mới gửi SĐT / link / mời liên hệ ngoài sàn trong chat</label>
        <label><input type="checkbox" checked={settings.duplicateCheck} onChange={e => setSettings({ ...settings, duplicateCheck: e.target.checked })} /> Tin trùng tiêu đề tự động vào hàng chờ duyệt</label>
        <label>Tài khoản chưa xác minh được coi là “mới” trong <input type="number" min={0} max={90} value={settings.newAccountDays} onChange={e => num('newAccountDays', e.target.value)} style={{ width: 70 }} /> ngày đầu</label>
        <label>Tài khoản mới đăng tối đa <input type="number" min={0} max={90} value={settings.newAccountDailyListings} onChange={e => num('newAccountDailyListings', e.target.value)} style={{ width: 70 }} /> tin / 24 giờ (0 = không giới hạn)</label>
        <div><button className="bl-btn" disabled={busy} onClick={() => void save()}>Lưu cài đặt</button></div>
      </div></div>}
    <div className="bl-card"><div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <select value={level} onChange={e => setLevel(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #dce6e0', borderRadius: 8 }}><option value="">Mọi mức rủi ro</option><option value="HIGH">Cao</option><option value="MEDIUM">Trung bình</option><option value="LOW">Thấp</option></select>
      <button className="bl-btn sm" disabled={busy} onClick={() => void load()}>Tải lại</button></div>
      <div style={{ overflowX: 'auto' }}><table className="bl-tbl"><thead><tr><th>Người dùng</th><th>Điểm</th><th>Dấu hiệu</th><th>Trạng thái</th><th></th></tr></thead><tbody>
        {shown.map(r => <tr key={r.id}><td><b>{r.name}</b><div style={{ fontSize: 12, color: '#71817b' }}>{r.email}{r.verified ? ' · đã xác minh' : ''}</div></td>
          <td><b style={{ color: COLORS[r.level] }}>{r.score}</b> <span style={{ fontSize: 12, color: COLORS[r.level] }}>{LABEL[r.level]}</span></td>
          <td style={{ maxWidth: 320, fontSize: 12 }}>{r.signals.map(s => `${s.label} (+${s.points})`).join(' · ')}</td><td>{r.status === 'SUSPENDED' ? 'Đã khóa' : 'Hoạt động'}</td>
          <td>{r.status !== 'SUSPENDED' && <button className="bl-btn sm" style={{ color: '#b53434', borderColor: '#f0cfc9' }} disabled={busy} onClick={() => void suspend(r)}>Khóa</button>}</td></tr>)}
        {!shown.length && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#71817b', padding: 24 }}>{busy ? 'Đang tải…' : 'Chưa có tài khoản đáng ngờ.'}</td></tr>}
      </tbody></table></div></div>
  </div>;
}
