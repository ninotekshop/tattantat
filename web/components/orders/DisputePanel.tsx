'use client';
import { useCallback, useEffect, useState } from 'react';
import { memberRequest } from '../../lib/api';

type Msg = { id: string; author_role: string; author_name: string; content: string; created_at: string };
type Dispute = { id: string; status: string; reasonLabel: string; resolution: string | null; refund_amount: string | null; admin_note: string | null; created_at: string; messages: Msg[] } | null;
const RES: Record<string, string> = { REFUND_FULL: 'Hoàn tiền toàn bộ cho người mua', REFUND_PARTIAL: 'Hoàn tiền một phần cho người mua', REJECT: 'Bác khiếu nại (giữ nguyên giao dịch)' };
const ST: Record<string, string> = { OPEN: 'Chờ tiếp nhận', REVIEWING: 'Đang xem xét', RESOLVED: 'Đã giải quyết' };
const ROLE: Record<string, string> = { BUYER: 'Người mua', SELLER: 'Người bán', ADMIN: 'Quản trị viên' };
const box: React.CSSProperties = { border: '1px solid #e0e9e4', borderRadius: 10, padding: 12, marginTop: 10, background: '#fbfdfc' };

/** Khu vực khiếu nại của một đơn: xem tiến trình, trao đổi với quản trị viên, hoặc mở khiếu nại mới. */
export function DisputePanel({ orderId, role, status, doneAt, onChanged }: { orderId: string; role: 'BUYER' | 'SELLER'; status: string; doneAt: string; onChanged: () => void }) {
  const [d, setD] = useState<Dispute | undefined>(undefined);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [reason, setReason] = useState(''); const [desc, setDesc] = useState(''); const [evidence, setEvidence] = useState(''); const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [ok, setOk] = useState('');

  const load = useCallback(async () => { try { setD(await memberRequest<Dispute>(`/orders/${orderId}/dispute`)); } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được khiếu nại.'); setD(null); } }, [orderId]);
  useEffect(() => { void load(); memberRequest<Record<string, string>>('/dispute-reasons').then(setReasons).catch(() => undefined); }, [load]);

  const buyerOnly = ['NOT_RECEIVED', 'NOT_AS_DESCRIBED', 'DAMAGED', 'WRONG_ITEM', 'SELLER_UNRESPONSIVE'];
  const allowed = Object.entries(reasons).filter(([k]) => (role === 'BUYER' ? k !== 'BUYER_REFUSED' : !buyerOnly.includes(k)));
  const active = d && d.status !== 'RESOLVED';
  const withinWindow = status !== 'COMPLETED' || Date.now() - new Date(doneAt).getTime() <= 7 * 86_400_000;
  const canOpen = !active && withinWindow && (role === 'BUYER' ? ['SHIPPING', 'DELIVERED', 'COMPLETED'] : ['SHIPPING', 'DELIVERED']).includes(status);

  async function run(fn: () => Promise<unknown>, msg: string) {
    setBusy(true); setError(''); setOk('');
    try { await fn(); setOk(msg); await load(); onChanged(); } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }
  const submit = () => run(async () => {
    const urls = evidence.split('\n').map(s => s.trim()).filter(Boolean);
    await memberRequest(`/orders/${orderId}/dispute`, 'POST', { reason, description: desc, evidence: urls });
    setReason(''); setDesc(''); setEvidence('');
  }, 'Đã gửi khiếu nại. Quản trị viên sẽ xem xét sớm.');
  const send = () => run(async () => { await memberRequest(`/orders/${orderId}/dispute/messages`, 'POST', { content: reply }); setReply(''); }, 'Đã gửi phản hồi.');

  if (d === undefined) return <div style={box}>Đang tải…</div>;
  return <div style={box}>
    {error && <p role="alert" style={{ color: '#a64329' }}>{error}</p>}{ok && <p style={{ color: '#137a4a' }}>{ok}</p>}
    {d ? <>
      <p><b>Khiếu nại:</b> {d.reasonLabel} · <b>{ST[d.status] ?? d.status}</b></p>
      {d.status === 'RESOLVED' && <p style={{ background: '#eef8f2', borderRadius: 8, padding: 8 }}>Kết quả: {RES[d.resolution ?? ''] ?? d.resolution}{d.refund_amount ? ` — ${Number(d.refund_amount).toLocaleString('vi-VN')} ₫` : ''}{d.admin_note ? <><br />Lý do: {d.admin_note}</> : null}</p>}
      <div style={{ maxHeight: 240, overflowY: 'auto', display: 'grid', gap: 6 }}>{d.messages.map(m => <div key={m.id} style={{ background: m.author_role === 'ADMIN' ? '#e8eefc' : '#f4f8f6', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}><b>{ROLE[m.author_role] ?? m.author_role}</b> <span style={{ color: '#71817b', fontSize: 11 }}>{new Date(m.created_at).toLocaleString('vi-VN')}</span><div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div></div>)}</div>
      {active && <div style={{ display: 'flex', gap: 6, marginTop: 8 }}><input value={reply} onChange={e => setReply(e.target.value)} placeholder="Nhập phản hồi…" maxLength={2000} style={{ flex: 1, padding: '8px 10px', border: '1px solid #dce6e0', borderRadius: 8 }} /><button disabled={busy || reply.trim().length < 2} onClick={() => void send()}>Gửi</button></div>}
    </> : null}
    {canOpen && <details open={!d}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>{d ? 'Mở khiếu nại mới' : 'Khiếu nại đơn hàng này'}</summary>
      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
        <select value={reason} onChange={e => setReason(e.target.value)}><option value="">— Chọn lý do —</option>{allowed.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <textarea rows={4} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Mô tả chi tiết vấn đề (tối thiểu 10 ký tự)" maxLength={2000} />
        <textarea rows={2} value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="Đường dẫn ảnh bằng chứng (https://…), mỗi dòng một đường dẫn, tối đa 5 — không bắt buộc" />
        <small style={{ color: '#71817b' }}>Đơn đang giao/đã giao sẽ được tạm giữ (không tự hoàn tất) cho tới khi quản trị viên giải quyết. Đơn đã hoàn tất chỉ khiếu nại được trong 7 ngày.</small>
        <button disabled={busy || !reason || desc.trim().length < 10} onClick={() => void submit()}>Gửi khiếu nại</button>
      </div></details>}
    {!d && !canOpen && <p style={{ color: '#71817b' }}>Đơn này hiện chưa thể khiếu nại (chỉ áp dụng cho đơn đang giao, đã giao, hoặc hoàn tất trong 7 ngày).</p>}
  </div>;
}
