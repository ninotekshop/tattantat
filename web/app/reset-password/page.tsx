'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck, TriangleAlert } from 'lucide-react';
import './reset-password.css';

type Phase = 'checking' | 'form' | 'invalid' | 'done';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/v1${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => null);
  if (!res.ok || !j?.success) {
    const m = Array.isArray(j?.message) ? j.message.join('. ') : j?.message;
    throw new Error(res.status === 429 ? 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.' : m || 'Không kết nối được máy chủ. Vui lòng thử lại.');
  }
  return j.data as T;
}

/** Chấm điểm độ mạnh mật khẩu 0–4. */
function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 4);
}
const LEVELS = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];

function ResetContent() {
  const token = useSearchParams().get('token') ?? '';
  const [phase, setPhase] = useState<Phase>('checking');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState(''), [pw2, setPw2] = useState(''), [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [resendEmail, setResendEmail] = useState(''), [resent, setResent] = useState('');

  useEffect(() => {
    if (!token) { setPhase('invalid'); return; }
    post<{ email: string }>('/auth/reset-password/check', { token })
      .then(d => { setEmail(d.email); setPhase('form'); })
      .catch(() => setPhase('invalid'));
  }, [token]);

  const score = useMemo(() => strength(pw), [pw]);
  const rules = [
    { ok: pw.length >= 8, text: 'Ít nhất 8 ký tự' },
    { ok: /[A-Za-z]/.test(pw) && /\d/.test(pw), text: 'Có cả chữ và số' },
    { ok: pw.length > 0 && pw === pw2, text: 'Hai lần nhập trùng khớp' },
  ];
  const canSubmit = rules.every(r => r.ok) && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!canSubmit) return;
    setBusy(true); setError('');
    try { await post('/auth/reset-password', { token, newPassword: pw }); setPhase('done'); }
    catch (err) {
      const m = err instanceof Error ? err.message : 'Có lỗi xảy ra.';
      if (/hết hạn|không hợp lệ/i.test(m)) setPhase('invalid'); else setError(m);
    } finally { setBusy(false); }
  }

  async function resend(e: React.FormEvent) {
    e.preventDefault(); if (!resendEmail.trim()) return;
    setBusy(true); setError(''); setResent('');
    try { await post('/auth/forgot-password', { email: resendEmail.trim() }); setResent('Nếu email này đã đăng ký, bạn sẽ nhận được liên kết mới trong ít phút. Hãy kiểm tra cả mục Spam/Quảng cáo.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Có lỗi xảy ra.'); }
    finally { setBusy(false); }
  }

  return <main className="rp-page">
    <section className="rp-card">
      <img className="rp-mascot" src="/chatbot-shipper.png" alt="" width={96} height={96} />

      {phase === 'checking' && <div className="rp-center"><div className="rp-spinner" aria-hidden /> <p className="rp-muted">Đang kiểm tra liên kết…</p></div>}

      {phase === 'form' && <>
        <h1>Tạo mật khẩu mới</h1>
        <p className="rp-sub">Cho tài khoản <b>{email}</b></p>
        <form onSubmit={submit} className="rp-form">
          <label className="rp-field">
            <span>Mật khẩu mới</span>
            <div className="rp-input"><Lock size={18} aria-hidden />
              <input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" placeholder="Nhập mật khẩu mới" autoFocus maxLength={128} />
              <button type="button" className="rp-eye" onClick={() => setShow(s => !s)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </label>
          {pw && <div className="rp-meter" data-score={score}><div className="rp-bars">{[0, 1, 2, 3].map(i => <i key={i} className={i < score ? 'on' : ''} />)}</div><small>Độ mạnh: <b>{LEVELS[score]}</b></small></div>}
          <label className="rp-field">
            <span>Nhập lại mật khẩu</span>
            <div className="rp-input"><Lock size={18} aria-hidden />
              <input type={show ? 'text' : 'password'} value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" maxLength={128} />
            </div>
          </label>
          <ul className="rp-rules">{rules.map(r => <li key={r.text} className={r.ok ? 'ok' : ''}><CheckCircle2 size={16} aria-hidden />{r.text}</li>)}</ul>
          {error && <div className="rp-alert err"><TriangleAlert size={18} aria-hidden />{error}</div>}
          <button className="rp-btn" disabled={!canSubmit}>{busy ? 'Đang lưu…' : 'Lưu mật khẩu mới'}</button>
        </form>
        <p className="rp-note"><ShieldCheck size={16} aria-hidden /> Sau khi đổi, hãy dùng mật khẩu mới cho mọi lần đăng nhập.</p>
      </>}

      {phase === 'done' && <div className="rp-center">
        <div className="rp-badge ok"><CheckCircle2 size={40} /></div>
        <h1>Đổi mật khẩu thành công!</h1>
        <p className="rp-sub">Bạn có thể đăng nhập ngay bằng mật khẩu mới. Chúng tôi cũng đã gửi email xác nhận cho bạn.</p>
        <Link href="/login" className="rp-btn">Đăng nhập ngay</Link>
        <Link href="/" className="rp-link">Về trang chủ</Link>
      </div>}

      {phase === 'invalid' && <div className="rp-center">
        <div className="rp-badge warn"><TriangleAlert size={36} /></div>
        <h1>Liên kết đã hết hạn</h1>
        <p className="rp-sub">Liên kết đặt lại mật khẩu chỉ dùng được một lần và trong 15 phút. Nhập email để nhận liên kết mới.</p>
        <form onSubmit={resend} className="rp-form">
          <div className="rp-input"><Mail size={18} aria-hidden /><input type="email" value={resendEmail} onChange={e => setResendEmail(e.target.value)} placeholder="Email đăng ký tài khoản" autoComplete="email" required /></div>
          {error && <div className="rp-alert err"><TriangleAlert size={18} aria-hidden />{error}</div>}
          {resent && <div className="rp-alert ok"><CheckCircle2 size={18} aria-hidden />{resent}</div>}
          <button className="rp-btn" disabled={busy || !resendEmail.trim()}>{busy ? 'Đang gửi…' : 'Gửi lại liên kết'}</button>
        </form>
        <Link href="/login" className="rp-link">Quay lại đăng nhập</Link>
      </div>}
    </section>
  </main>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="rp-page"><section className="rp-card"><div className="rp-center"><div className="rp-spinner" aria-hidden /></div></section></main>}><ResetContent /></Suspense>;
}
