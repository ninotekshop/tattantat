'use client';
import { useEffect, useState } from 'react';
import { saveSession } from '../../../lib/auth';
import { safeReturnPath } from '../../../lib/session-fetch';

export default function OAuthCallbackPage() {
  const [error, setError] = useState('');
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const err = q.get('error');
    const code = q.get('code');
    if (err || !code) { setError(err || 'Không nhận được mã đăng nhập.'); return; }
    void (async () => {
      try {
        const res = await fetch('/api/v1/auth/oauth/exchange', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
        const data = await res.json();
        if (!data.success || !data.data) { setError(data.message || 'Đăng nhập chưa thành công.'); return; }
        saveSession(data.data);
        let next = '/';
        try { next = sessionStorage.getItem('oauth_next') || '/'; sessionStorage.removeItem('oauth_next'); } catch { /* bỏ qua */ }
        window.location.replace(safeReturnPath(next));
      } catch { setError('Lỗi kết nối. Vui lòng thử lại.'); }
    })();
  }, []);
  return (
    <div className="shell" style={{ padding: 40, textAlign: 'center' }}>
      <h1 style={{ fontSize: 18 }}>Đăng nhập Facebook</h1>
      {error ? <p style={{ color: '#dc2626' }}>{error} <a href="/login">Quay lại đăng nhập</a></p> : <p>Đang đăng nhập...</p>}
    </div>
  );
}
