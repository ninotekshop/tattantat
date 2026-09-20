'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '../../lib/api';
import { saveSession, WebSession } from '../../lib/auth';

type Registration = { verificationId: string };

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function register(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const registration = await apiPost<Registration>('/auth/register', { fullName, phone, password });
      setVerificationId(registration.verificationId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể đăng ký');
    } finally {
      setLoading(false);
    }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!verificationId) return;
    setLoading(true);
    setError(null);
    try {
      const session = await apiPost<WebSession>('/auth/verify-otp', { verificationId, otp });
      saveSession(session);
      router.replace('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể xác thực mã OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <a className="brand" href="/">Tất Tần Tật</a>
      <section className="auth-card">
        <p className="eyebrow">TẠO TÀI KHOẢN</p>
        <h1>{verificationId ? 'Xác thực số điện thoại' : 'Tham gia Tất Tần Tật'}</h1>
        {verificationId ? <p>Nhập mã OTP đã gửi đến số điện thoại của bạn để kích hoạt tài khoản.</p> : <p>Đăng tin, mua hàng và trò chuyện chỉ trong vài phút.</p>}
        {!verificationId ? <form onSubmit={register}>
          <label>Họ và tên<input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} required /></label>
          <label>Số điện thoại Việt Nam<input autoComplete="tel" inputMode="tel" placeholder="09xxxxxxxx" value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
          <label>Mật khẩu<input autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="form-submit" disabled={loading} type="submit">{loading ? 'Đang tạo tài khoản...' : 'Tiếp tục'}</button>
        </form> : <form onSubmit={verify}>
          <label>Mã OTP<input autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} required /></label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="form-submit" disabled={loading || otp.length !== 6} type="submit">{loading ? 'Đang xác thực...' : 'Xác thực tài khoản'}</button>
          <button className="plain-button" disabled={loading} onClick={() => { setVerificationId(null); setOtp(''); setError(null); }} type="button">Quay lại chỉnh sửa số điện thoại</button>
        </form>}
        <p className="auth-footnote">Đã có tài khoản? <a href="/login">Đăng nhập</a></p>
      </section>
    </main>
  );
}
