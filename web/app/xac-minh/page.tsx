'use client';
import { Ic } from '../../components/Ic';
import { BadgeCheck, ArrowLeft } from 'lucide-react';
import '../goi-dich-vu/billing.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConfirmationResult } from 'firebase/auth';
import { firebaseErrorMessage, firebasePhoneEnabled, sendFirebaseOtp, signOutFirebase } from '../../lib/firebase-phone';
import { MemberArea } from '../../components/MemberArea';
import { memberRequest, sessionFetch } from '../../lib/api';
import { readSession } from '../../lib/auth';

type Status = { phone: string | null; phoneVerified: boolean; identityVerified: boolean; identity: { status: 'PENDING' | 'APPROVED' | 'REJECTED'; rejectReason: string | null; createdAt: string } | null };
const inp: React.CSSProperties = { padding: '10px 12px', border: '1px solid #dce6e0', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' };

export default function VerifyPage() { return <MemberArea>{() => <Verify />}</MemberArea>; }

function Verify() {
  const router = useRouter();
  const [st, setSt] = useState<Status | null>(null);
  const [phone, setPhone] = useState(''); const [code, setCode] = useState(''); const [sent, setSent] = useState(false);
  const [name, setName] = useState(''); const [idNo, setIdNo] = useState(''); const [files, setFiles] = useState<{ front?: File; back?: File; selfie?: File }>({});
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [ok, setOk] = useState('');
  const confirmation = useRef<ConfirmationResult | null>(null);

  const load = useCallback(() => memberRequest<Status>('/me/verification').then(s => { setSt(s); if (s.phone && !phone) setPhone(s.phone); }).catch(e => setError(e instanceof Error ? e.message : 'Không tải được trạng thái.')), [phone]);
  useEffect(() => { if (!readSession()) { router.replace('/login'); return; } void load(); }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(fn: () => Promise<string | void>) {
    setBusy(true); setError(''); setOk('');
    try { const m = await fn(); if (m) setOk(m); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }
  const sendOtp = () => run(async () => {
    if (firebasePhoneEnabled) {
      // Gửi SMS thật qua Firebase Phone Auth.
      try { confirmation.current = await sendFirebaseOtp(phone, 'recaptcha-verify'); }
      catch (e) { throw new Error(firebaseErrorMessage(e)); }
      setSent(true); return `Đã gửi mã xác minh qua SMS tới ${phone}.`;
    }
    const r = await memberRequest<{ devCode?: string }>('/me/verification/phone/send', 'POST', { phone }); setSent(true);
    return r.devCode ? `Chế độ thử nghiệm (chưa cấu hình SMS): mã của bạn là ${r.devCode}` : 'Đã gửi mã xác minh qua SMS.';
  });
  const confirm = () => run(async () => {
    if (firebasePhoneEnabled) {
      if (!confirmation.current) throw new Error('Hãy bấm gửi mã xác minh trước.');
      let idToken: string;
      try { const cred = await confirmation.current.confirm(code.trim()); idToken = await cred.user.getIdToken(); await signOutFirebase(); }
      catch (e) { throw new Error(firebaseErrorMessage(e)); }
      await memberRequest('/me/verification/phone/firebase-confirm', 'POST', { idToken });
    } else await memberRequest('/me/verification/phone/confirm', 'POST', { code });
    confirmation.current = null; setSent(false); setCode(''); return 'Đã xác minh số điện thoại.';
  });
  const submitId = () => run(async () => {
    if (!files.front || !files.back || !files.selfie) throw new Error('Vui lòng chọn đủ 3 ảnh.');
    const fd = new FormData(); fd.set('fullName', name); fd.set('idNumber', idNo); fd.set('front', files.front); fd.set('back', files.back); fd.set('selfie', files.selfie);
    const res = await sessionFetch('/me/verification/identity', { method: 'POST', body: fd }, readSession()?.accessToken);
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.success) throw new Error(Array.isArray(j?.message) ? j.message.join('. ') : j?.message || 'Không gửi được hồ sơ.');
    return j.message;
  });
  const pick = (k: 'front' | 'back' | 'selfie', label: string) => <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>{label}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFiles(f => ({ ...f, [k]: e.target.files?.[0] }))} /></label>;

  return <div className="bl" style={{ maxWidth: 720, margin: '0 auto', padding: 0 }}>
    <h1>Xác minh tài khoản</h1>
    <p style={{ color: '#71817b' }}>Tài khoản đã xác minh được tin tưởng hơn, không bị giới hạn tin đăng/tin nhắn như tài khoản mới và hiển thị huy hiệu “Đã xác thực”.</p>
    {error && <div className="bl-msg err">{error}</div>}{ok && <div className="bl-msg ok">{ok}</div>}
    {!st ? <p>Đang tải…</p> : <>
      <div className="bl-card"><h3 style={{ marginTop: 0 }}>1. Số điện thoại {st.phoneVerified && <span style={{ color: '#1c7c4a', fontSize: 14 }}><Ic i={BadgeCheck}/>Đã xác minh</span>}</h3>
        {st.phoneVerified ? <p>Số <b>{st.phone}</b> đã được xác minh.</p> : <div style={{ display: 'grid', gap: 10 }}>
          <input style={inp} inputMode="tel" placeholder="Số điện thoại, ví dụ 0912345678" value={phone} onChange={e => setPhone(e.target.value)} />
          <div><button className="bl-btn" disabled={busy || !phone.trim()} onClick={() => void sendOtp()}>{sent ? 'Gửi lại mã' : 'Gửi mã xác minh'}</button></div>
          {sent && <><input style={inp} inputMode="numeric" maxLength={6} placeholder="Nhập mã 6 số" value={code} onChange={e => setCode(e.target.value)} /><div><button className="bl-btn" disabled={busy || code.length < 6} onClick={() => void confirm()}>Xác nhận</button></div></>}
          <div id="recaptcha-verify"/>
        </div>}
      </div>
      <div className="bl-card"><h3 style={{ marginTop: 0 }}>2. Danh tính (CMND/CCCD) {st.identityVerified && <span style={{ color: '#1c7c4a', fontSize: 14 }}><Ic i={BadgeCheck}/>Đã xác thực</span>}</h3>
        {st.identityVerified ? <p>Danh tính của bạn đã được xác thực.</p>
          : st.identity?.status === 'PENDING' ? <p>Hồ sơ đang chờ duyệt (thường trong 24 giờ).</p>
          : <div style={{ display: 'grid', gap: 10 }}>
            {st.identity?.status === 'REJECTED' && <div className="bl-msg err">Hồ sơ trước bị từ chối: {st.identity.rejectReason}. Bạn có thể gửi lại.</div>}
            <input style={inp} placeholder="Họ và tên đúng như trên giấy tờ" value={name} onChange={e => setName(e.target.value)} />
            <input style={inp} inputMode="numeric" placeholder="Số CMND (9 số) hoặc CCCD (12 số)" value={idNo} onChange={e => setIdNo(e.target.value)} />
            {pick('front', 'Ảnh mặt trước giấy tờ')}{pick('back', 'Ảnh mặt sau giấy tờ')}{pick('selfie', 'Ảnh chân dung cầm giấy tờ')}
            <small style={{ color: '#71817b' }}>Ảnh được lưu riêng tư, chỉ quản trị viên xác minh xem được và không hiển thị công khai.</small>
            <div><button className="bl-btn" disabled={busy} onClick={() => void submitId()}>Gửi hồ sơ</button></div>
          </div>}
      </div></>}
    <p><Link href="/"><Ic i={ArrowLeft}/>Về trang chủ</Link></p>
  </div>;
}
