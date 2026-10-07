'use client';
import { useEffect, useRef, useState } from 'react';
import { memberRequest } from '../lib/api';
import { coin, vndNeededForCoin } from '../lib/coin';
import { newKey, vnd } from '../lib/billing';

export type PayItem = { kind: 'PLAN' | 'PROMO'; title: string; subtitle?: string; price: string; planId?: string; packageId?: string; productId?: string };
type QrTopup = { id: string; code: string; amount: string; expiresAt: string; qrUrl: string | null; checkoutUrl?: string | null; bank?: { bankName: string; accountNumber: string; accountName: string } | null };

/** Chọn cách thanh toán khi mua gói: dùng số dư ví TTTCoin hoặc thanh toán trực tiếp bằng mã QR (tự kích hoạt khi nhận tiền). */
export function PayModal({ item, balance, onClose, onSuccess, onRefresh }: { item: PayItem; balance: number; onClose: () => void; onSuccess: (kind: 'PLAN' | 'PROMO') => void; onRefresh?: () => void }) {
  const price = Math.ceil(Number(item.price));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [qr, setQr] = useState<QrTopup | null>(null);
  const [state, setState] = useState<'idle' | 'waiting' | 'buying'>('idle');
  const key = useRef(newKey());
  const enough = price <= balance;

  const purchase = (k: string) => item.kind === 'PLAN'
    ? memberRequest('/billing/subscriptions/purchase', 'POST', { planId: item.planId }, k)
    : memberRequest('/billing/promotions/purchase', 'POST', { productId: item.productId, packageId: item.packageId }, k);

  async function payByWallet() {
    setBusy(true); setError('');
    try { await purchase(key.current); onSuccess(item.kind); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể mua gói.'); onRefresh?.(); }
    finally { setBusy(false); }
  }
  async function payByQr() {
    setBusy(true); setError('');
    try {
      const t = await memberRequest<QrTopup>('/billing/topups', 'POST', { amount: vndNeededForCoin(price) });
      key.current = newKey(); setQr(t); setState('waiting');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tạo được mã QR.'); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    if (!qr || state !== 'waiting') return;
    let stop = false;
    const tick = async () => {
      try {
        await memberRequest(`/billing/topups/${qr.id}/sync`, 'POST', {}).catch(() => undefined);
        const list = await memberRequest<Array<{ id: string; status: string }>>('/billing/topups');
        const me = list.find(x => x.id === qr.id);
        if (stop || !me) return;
        if (me.status === 'CONFIRMED') {
          setState('buying');
          try { await purchase(key.current); onSuccess(item.kind); }
          catch (e) { setState('idle'); setQr(null); setError((e instanceof Error ? e.message : 'Không thể mua gói.') + ' Tiền đã được cộng vào ví, bạn chọn "Dùng số dư ví" để hoàn tất.'); onRefresh?.(); }
        } else if (me.status !== 'PENDING') { setState('idle'); setQr(null); setError('Mã QR đã hết hạn hoặc bị hủy. Vui lòng tạo mã mới.'); }
      } catch { /* thử lại ở lần sau */ }
    };
    const timer = setInterval(() => void tick(), 4000);
    return () => { stop = true; clearInterval(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qr, state]);

  const locked = busy || state === 'buying';
  const opt = (on: boolean): React.CSSProperties => ({ textAlign: 'left', border: '1.5px solid ' + (on ? '#0a9a61' : '#dfe9e3'), background: on ? '#f1faf5' : '#f7f9f8', borderRadius: 14, padding: '12px 14px', cursor: on ? 'pointer' : 'not-allowed', opacity: on ? 1 : .65, display: 'block', width: '100%' });
  return <div className="bl-modal" onClick={() => !locked && onClose()}><div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" style={{ position: 'relative', ...(qr ? { maxWidth: 560 } : {}) }}>
    <button type="button" aria-label="Đóng" disabled={locked} onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '50%', background: '#f1f5f9', color: '#475569', fontSize: 20, lineHeight: 1, cursor: 'pointer' }}>✕</button>
    <h2 style={{ marginTop: 0, paddingRight: 36 }}>Xác nhận mua gói</h2>
    <p style={{ margin: '0 0 4px' }}><b>{item.title}</b> — {coin(item.price)}{item.subtitle ? ` · ${item.subtitle}` : ''}</p>
    {qr ? <>
      <div className="bl-qr">
        {qr.qrUrl ? <img src={qr.qrUrl} alt="Mã QR thanh toán" /> : null}
        <div>
          <div className="bl-msg info">{state === 'buying' ? 'Đã nhận tiền, đang kích hoạt gói…' : <>Quét mã QR bằng ứng dụng ngân hàng và thanh toán <b>đúng số tiền {vnd(qr.amount)}</b>. Gói sẽ được <b>kích hoạt tự động</b> ngay khi nhận được tiền.</>}</div>
          {qr.bank && <div className="bl-kv"><b>Ngân hàng</b><span className="v">{qr.bank.bankName}</span><span /><b>Số tài khoản</b><span className="v">{qr.bank.accountNumber}</span><span /><b>Nội dung</b><span className="v">{qr.code}</span><span /></div>}
          {qr.checkoutUrl && !qr.bank && <a href={qr.checkoutUrl} target="_blank" rel="noreferrer" className="bl-btn sm primary">Mở trang thanh toán PayOS</a>}
          <p style={{ color: '#71817b', fontSize: 12 }}>Đang chờ thanh toán… Vui lòng không đóng trang này.</p>
        </div>
      </div>
      {error && <div className="bl-msg err">{error}</div>}
    </> : <>
      <p style={{ margin: '8px 0 12px', color: '#4b5d56' }}>Chọn cách thanh toán:</p>
      <div style={{ display: 'grid', gap: 10 }}>
        <button type="button" disabled={busy || !enough} onClick={payByWallet} style={opt(enough)}>
          <b>{busy ? 'Đang xử lý…' : 'Dùng số dư ví TTTCoin'}</b>
          <div style={{ fontSize: 13, color: '#4b5d56', marginTop: 2 }}>Số dư hiện có: <b>{coin(balance)}</b>{enough ? ` · còn lại ${coin(balance - price)} sau khi mua` : ` · thiếu ${coin(price - balance)}`}</div>
        </button>
        <button type="button" disabled={busy} onClick={payByQr} style={opt(true)}>
          <b>{busy ? 'Đang tạo mã…' : 'Thanh toán trực tiếp bằng mã QR'}</b>
          <div style={{ fontSize: 13, color: '#4b5d56', marginTop: 2 }}>Quét QR ngân hàng, thanh toán {vnd(vndNeededForCoin(price))} (đã gồm VAT 8%). Gói tự kích hoạt khi nhận được tiền.</div>
        </button>
      </div>
      {!enough && <p style={{ fontSize: 13, color: '#71817b', margin: '10px 0 0' }}>Muốn dùng ví? <a href={`/vi-tien?topup=${vndNeededForCoin(price - balance)}#nap-tien`} style={{ fontWeight: 700, color: '#007c4b' }}>Nạp thêm TTTCoin</a>.</p>}
      {error && <div className="bl-msg err" style={{ marginTop: 10 }}>{error}</div>}
    </>}
  </div></div>;
}
