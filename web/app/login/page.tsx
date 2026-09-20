'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '../../lib/api';
import { saveSession, WebSession } from '../../lib/auth';
import { safeReturnPath } from '../../lib/session-fetch';

export default function LoginPage() {
  const router = useRouter();
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const session = await apiPost<WebSession>('/auth/login', { phoneOrEmail, password });
      saveSession(session);
      router.replace(safeReturnPath(new URLSearchParams(window.location.search).get('next')));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể đăng nhập');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <a className="brand" href="/">Tất Tần Tật</a>
      <section className="auth-card">
        <p className="eyebrow">CHÀO MỪNG TRỞ LẠI</p>
        <h1>Đăng nhập</h1>
        <p>Dùng tài khoản Tất Tần Tật của bạn để mua, bán và trò chuyện an toàn.</p>
        <form onSubmit={submit}>
          <label>Số điện thoại hoặc email<input autoComplete="username" value={phoneOrEmail} onChange={(event) => setPhoneOrEmail(event.target.value)} required /></label>
          <label>Mật khẩu<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="form-submit" disabled={loading} type="submit">{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
        </form>
        <p className="auth-footnote">Chưa có tài khoản? <a href="/register">Đăng ký</a></p>
      </section>
    </main>
  );
}
