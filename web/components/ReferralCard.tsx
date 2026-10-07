'use client';

import { useEffect, useState } from 'react';
import { memberRequest } from '../lib/api';

type Summary = { code: string; pending: number; qualified: number };

/** Mã giới thiệu của tôi + ô nhập mã của người đã giới thiệu mình (+1 điểm uy tín cho người giới thiệu khi bạn xác thực SĐT). */
export default function ReferralCard() {
  const [s, setS] = useState<Summary | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    memberRequest<Summary>('/me/referral').then(v => { if (live) setS(v); }).catch(() => undefined);
    try { const q = new URLSearchParams(window.location.search).get('ref'); if (q) setCode(q.toUpperCase().slice(0, 8)); } catch { /* bỏ qua */ }
    return () => { live = false; };
  }, []);

  const copy = async () => {
    if (!s) return;
    try { await navigator.clipboard.writeText(`Tham gia Tất Tần Tật cùng mình, nhập mã giới thiệu ${s.code} tại https://tattantat.vn`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* bỏ qua */ }
  };

  const submit = async () => {
    setBusy(true); setMsg(null);
    try {
      await memberRequest('/me/referral', 'POST', { code: code.trim() });
      setMsg({ ok: true, text: 'Đã ghi nhận mã giới thiệu. Người giới thiệu sẽ được cộng điểm uy tín khi tài khoản của bạn đã xác thực số điện thoại.' });
      setCode('');
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Không áp dụng được mã giới thiệu.' }); }
    finally { setBusy(false); }
  };

  return (
    <section className="ac-card" style={{ marginTop: 16 }}>
      <div className="ac-card-h"><h2>Giới thiệu bạn bè</h2><p>Mỗi người bạn đăng ký và xác thực số điện thoại giúp tăng điểm uy tín của bạn.</p></div>
      {s && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, margin: '8px 0 14px' }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3, background: '#e6f6ed', color: '#007c4b', padding: '6px 14px', borderRadius: 10 }}>{s.code}</span>
          <button type="button" className="ac-btn sm" onClick={copy}>{copied ? 'Đã sao chép' : 'Sao chép lời mời'}</button>
          <span style={{ fontSize: 13, color: '#64748b' }}>{s.qualified} người đã xác thực · {s.pending} đang chờ</span>
        </div>
      )}
      <label style={{ fontSize: 13, fontWeight: 600 }}>Bạn được ai giới thiệu? Nhập mã của họ</label>
      <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 8))} placeholder="Ví dụ: A1B2C3D4" maxLength={8}
          style={{ flex: '1 1 160px', padding: '10px 12px', border: '1px solid #dce6e0', borderRadius: 10, letterSpacing: 2, fontWeight: 700 }} />
        <button type="button" className="ac-btn" disabled={busy || code.length !== 8} onClick={submit}>{busy ? 'Đang gửi…' : 'Áp dụng'}</button>
      </div>
      {msg && <p style={{ margin: '8px 0 0', fontSize: 13, color: msg.ok ? '#007c4b' : '#e11d48' }}>{msg.text}</p>}
    </section>
  );
}
