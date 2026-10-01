'use client';
import '../../goi-dich-vu/billing.css';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { memberRequest } from '../../../lib/api';

function Mock() {
  const q = useSearchParams(); const code = q.get('code') ?? ''; const amount = Number(q.get('amount') ?? 0);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [done, setDone] = useState(false);
  async function pay() { setBusy(true); setError(''); try { await memberRequest(`/payments/mock/${encodeURIComponent(code)}/pay`, 'POST', {}); setDone(true); } catch (e) { setError(e instanceof Error ? e.message : 'Không thanh toán được.'); } finally { setBusy(false); } }
  return <main className="bl" style={{ maxWidth: 480, margin: '40px auto', padding: 16 }}><div className="bl-card">
    <h2 style={{ marginTop: 0 }}>Cổng thanh toán thử nghiệm</h2>
    <p style={{ color: '#71817b' }}>Đây là môi trường giả lập, không trừ tiền thật. Khi có tài khoản PayOS, hệ thống sẽ chuyển sang cổng thật.</p>
    <p>Số tiền: <b>{amount.toLocaleString('vi-VN')}{'\u00a0'}đ</b></p>
    {error && <div className="bl-msg err">{error}</div>}
    {done ? <><div className="bl-msg ok">Thanh toán thử nghiệm thành công.</div><a className="bl-btn" href="/orders">Về đơn hàng</a></> : <button className="bl-btn" disabled={busy || !code} onClick={() => void pay()}>{busy ? 'Đang xử lý…' : 'Thanh toán thử'}</button>}
  </div></main>;
}
export default function MockPage() { return <Suspense fallback={null}><Mock /></Suspense>; }
