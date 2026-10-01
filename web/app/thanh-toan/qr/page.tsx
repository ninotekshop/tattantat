'use client';
import '../../checkout/[id]/checkout.css';
import './qr.css';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, Copy, Landmark, ShieldCheck } from 'lucide-react';
import { memberRequest } from '../../../lib/api';
import { moneyLabel } from '../../../lib/order-ui';

type Qr = { orderCode: string; amount: string; status: string; paymentStatus: string; expiresAt: string | null; qrCode: string | null; bin: string | null; accountNumber: string | null; accountName: string | null; description: string | null; checkoutUrl: string | null };
type Sync = { paymentStatus: string };
const num = (v?: string | null) => String(v ?? '0').replace(/\.\d+$/, '');

function QrPage() {
  const order = useSearchParams().get('order') ?? '';
  const [qr, setQr] = useState<Qr | null>(null), [error, setError] = useState(''), [left, setLeft] = useState<number | null>(null), [copied, setCopied] = useState('');

  useEffect(() => { if (order) memberRequest<Qr>(`/payments/order/${order}/qr`).then(setQr).catch(e => setError(e.message)); }, [order]);
  useEffect(() => {
    if (!qr) return;
    const t = setInterval(() => setLeft(qr.expiresAt ? Math.max(0, Math.floor((new Date(qr.expiresAt).getTime() - Date.now()) / 1000)) : null), 1000);
    return () => clearInterval(t);
  }, [qr]);
  useEffect(() => {
    if (!qr || qr.paymentStatus === 'PAID') { if (qr?.paymentStatus === 'PAID') window.location.replace(`/thanh-toan/ket-qua?order=${order}`); return; }
    let stop = false;
    const tick = async () => {
      try { const r = await memberRequest<Sync>(`/payments/order/${order}/sync`, 'POST', {}); if (!stop && r.paymentStatus === 'PAID') { window.location.replace(`/thanh-toan/ket-qua?order=${order}`); return; } } catch { /* thử lại */ }
      if (!stop) setTimeout(() => void tick(), 3000);
    };
    const first = setTimeout(() => void tick(), 3000);
    return () => { stop = true; clearTimeout(first); };
  }, [qr, order]);

  const copy = (k: string, v: string) => { void navigator.clipboard?.writeText(v).then(() => { setCopied(k); setTimeout(() => setCopied(''), 1500); }); };
  const mm = left === null ? '' : `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
  const expired = left === 0;

  return <main className="member-page"><div className="co-wrap qr-wrap">
    <div className="co-head"><h1>Quét mã QR để thanh toán</h1><p>Dùng ứng dụng ngân hàng hoặc ví hỗ trợ VietQR. Hệ thống tự xác nhận ngay khi nhận được tiền.</p></div>
    {error && <p className="co-alert" role="alert"><span>{error}</span></p>}
    {!qr && !error && <p>Đang tải mã thanh toán...</p>}
    {qr && <section className="co-card qr-card">
      <div className="qr-box">
        {qr.qrCode && !expired ? <QRCodeSVG value={qr.qrCode} size={240} level="M" marginSize={2}/> : <div className="qr-expired">{expired ? 'Mã đã hết hạn. Vào mục Đơn hàng để tạo lại.' : 'Chưa có mã QR.'}</div>}
        {mm && !expired && <div className="qr-timer"><Clock size={15}/>Mã hết hạn sau <b>{mm}</b></div>}
      </div>
      <dl className="qr-info">
        <div><dt>Số tiền</dt><dd className="qr-amount">{moneyLabel(num(qr.amount))}</dd></div>
        {qr.accountName && <div><dt>Chủ tài khoản</dt><dd>{qr.accountName}</dd></div>}
        {qr.accountNumber && <div><dt>Số tài khoản</dt><dd>{qr.accountNumber}<button type="button" onClick={() => copy('acc', qr.accountNumber!)}><Copy size={14}/>{copied === 'acc' ? 'Đã chép' : 'Chép'}</button></dd></div>}
        {qr.description && <div><dt>Nội dung</dt><dd>{qr.description}<button type="button" onClick={() => copy('desc', qr.description!)}><Copy size={14}/>{copied === 'desc' ? 'Đã chép' : 'Chép'}</button></dd></div>}
        <div><dt>Đơn hàng</dt><dd>{qr.orderCode}</dd></div>
      </dl>
      <p className="co-safe"><ShieldCheck size={18}/>Tiền được Tất Tần Tật giữ an toàn và chỉ chuyển cho người bán khi bạn nhận hàng.</p>
      <div className="qr-acts">
        {qr.checkoutUrl && <a href={qr.checkoutUrl}><Landmark size={15}/>Trang thanh toán PayOS</a>}
        <a href="/orders">Thanh toán sau, về đơn hàng</a>
      </div>
    </section>}
  </div></main>;
}
export default function Page() { return <Suspense fallback={null}><QrPage/></Suspense>; }
