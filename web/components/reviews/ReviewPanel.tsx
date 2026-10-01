'use client';
import { useCallback, useEffect, useState } from 'react';
import { memberRequest } from '../../lib/api';
import { StarInput, Stars } from './Stars';

type Rev = { id: string; rating: number; comment: string | null; reply: string | null; created_at: string; kind: 'seller' | 'buyer' };
type State = { role: 'buyer' | 'seller'; canReview: boolean; deadline: string | null; given: Rev | null; received: Rev | null };
const box: React.CSSProperties = { border: '1px solid #e0e9e4', borderRadius: 10, padding: 12, marginTop: 10, background: '#fbfdfc' };
const REASONS: Record<string, string> = { FAKE: 'Đánh giá giả / không đúng sự thật', OFFENSIVE: 'Lời lẽ xúc phạm', SPAM: 'Spam', PERSONAL_INFO: 'Lộ thông tin cá nhân', OTHER: 'Lý do khác' };

/** Đánh giá hai chiều của một đơn đã hoàn tất: mình đánh giá đối phương, xem/ trả lời/ báo cáo đánh giá nhận được. */
export function ReviewPanel({ orderId, onChanged }: { orderId: string; onChanged?: () => void }) {
  const [s, setS] = useState<State | null>(null);
  const [rating, setRating] = useState(0); const [comment, setComment] = useState(''); const [reply, setReply] = useState(''); const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [ok, setOk] = useState('');
  const load = useCallback(async () => { try { setS(await memberRequest<State>(`/orders/${orderId}/reviews`)); } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được đánh giá.'); } }, [orderId]);
  useEffect(() => { void load(); }, [load]);
  async function run(fn: () => Promise<unknown>, msg: string) {
    setBusy(true); setError(''); setOk('');
    try { await fn(); setOk(msg); await load(); onChanged?.(); } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }
  if (!s) return <div style={box}>{error || 'Đang tải…'}</div>;
  const other = s.role === 'buyer' ? 'người bán' : 'người mua';
  return <div style={box}>
    {error && <p role="alert" style={{ color: '#a64329' }}>{error}</p>}{ok && <p style={{ color: '#137a4a' }}>{ok}</p>}
    <b>Đánh giá {other}</b>
    {s.given ? <div style={{ margin: '6px 0 12px' }}><Stars value={s.given.rating} /> {s.given.comment && <span>— {s.given.comment}</span>}
      {s.given.reply && <div style={{ background: '#f4f8f6', borderRadius: 8, padding: '6px 10px', marginTop: 6, fontSize: 13 }}><b>Phản hồi:</b> {s.given.reply}</div>}</div>
      : s.canReview ? <div style={{ display: 'grid', gap: 8, margin: '8px 0 12px' }}>
        <StarInput value={rating} onChange={setRating} />
        <textarea rows={3} maxLength={1000} value={comment} onChange={e => setComment(e.target.value)} placeholder={`Nhận xét về ${other} (không bắt buộc)`} />
        <small style={{ color: '#71817b' }}>Bạn có thể đánh giá đến hết {s.deadline ? new Date(s.deadline).toLocaleDateString('vi-VN') : ''}. Mỗi đơn đánh giá một lần, không sửa được.</small>
        <button disabled={busy || !rating} onClick={() => void run(() => memberRequest(`/orders/${orderId}/${s.role === 'buyer' ? 'review' : 'buyer-review'}`, 'POST', { rating, comment }), 'Đã gửi đánh giá.')}>Gửi đánh giá</button></div>
        : <p style={{ color: '#71817b' }}>Đã hết thời hạn đánh giá đơn này.</p>}
    <b>Đánh giá bạn nhận được</b>
    {s.received ? <div style={{ margin: '6px 0' }}><Stars value={s.received.rating} /> {s.received.comment && <span>— {s.received.comment}</span>}
      {s.received.reply ? <div style={{ background: '#f4f8f6', borderRadius: 8, padding: '6px 10px', marginTop: 6, fontSize: 13 }}><b>Bạn đã phản hồi:</b> {s.received.reply}</div>
        : <div style={{ display: 'flex', gap: 6, marginTop: 6 }}><input value={reply} onChange={e => setReply(e.target.value)} maxLength={1000} placeholder="Phản hồi đánh giá (chỉ một lần)" style={{ flex: 1, padding: '8px 10px', border: '1px solid #dce6e0', borderRadius: 8 }} />
          <button disabled={busy || reply.trim().length < 2} onClick={() => void run(() => memberRequest(`/reviews/${s.received!.kind}/${s.received!.id}/reply`, 'POST', { reply }), 'Đã gửi phản hồi.')}>Gửi</button></div>}
      <details style={{ marginTop: 6 }}><summary style={{ cursor: 'pointer', color: '#71817b', fontSize: 13 }}>Báo cáo đánh giá này</summary>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}><select value={reason} onChange={e => setReason(e.target.value)}><option value="">— Chọn lý do —</option>{Object.entries(REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <button disabled={busy || !reason} onClick={() => void run(() => memberRequest(`/reviews/${s.received!.kind}/${s.received!.id}/report`, 'POST', { reason }), 'Đã gửi báo cáo.')}>Gửi báo cáo</button></div></details></div>
      : <p style={{ color: '#71817b', margin: '6px 0' }}>Chưa có đánh giá nào từ {other}.</p>}
  </div>;
}
