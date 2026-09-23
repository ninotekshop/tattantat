'use client';

import Link from 'next/link';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import { saveSession } from '../../lib/auth';
import { safeReturnPath } from '../../lib/session-fetch';

function GoogleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.2 1.03-.78 1.93-1.63 2.52v2.12h2.63c1.54-1.42 2.43-3.51 2.43-6.08z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-2.63-2.12c-1.07.72-2.45 1.16-4.3 1.16-3.3 0-6.1-2.23-7.1-5.23H3.16v2.19C5.14 21.01 8.35 24 12 24z"/><path fill="#FBBC05" d="M4.9 14.9c-.25-.72-.39-1.49-.39-2.9s.14-2.18.39-2.9V6.91H3.16C2.42 8.44 2 10.16 2 12s.42 3.56 1.16 5.09l2.74-2.19z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 8.35 0 5.14 2.99 3.16 6.91l2.74 2.19c1-3 3.8-5.35 7.1-5.35z"/></svg>;
}

function FacebookIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');

  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google & Facebook SDKs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!document.getElementById('google-gsi-client-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail || !password) {
      setError('Vui lòng nhập số điện thoại/email và mật khẩu.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail, password }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        saveSession(data.data);
        router.replace(safeReturnPath(nextParam));
      } else {
        setError(data.message || 'Mật khẩu hoặc tài khoản chưa chính xác.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '927392714442-7s4c7vca99p1rtr9jvd3ken6ctinut9v.apps.googleusercontent.com';
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          if (response?.credential) {
            setLoading(true);
            try {
              const res = await fetch('/api/v1/auth/social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  provider: 'google',
                  providerAccountId: 'google_oauth_2026',
                  idToken: response.credential,
                }),
              });
              const data = await res.json();
              if (data.success && data.data) {
                saveSession(data.data);
                router.replace(safeReturnPath(nextParam));
              } else {
                setError(data.message || 'Chưa thể đăng nhập Google.');
              }
            } catch (err) {
              setError('Lỗi kết nối Google.');
            } finally {
              setLoading(false);
            }
          }
        },
      });
      (window as any).google.accounts.id.prompt();
    } else {
      handleSocialLogin('google');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          providerAccountId: `${provider}_demo_${Date.now()}`,
          name: `Thành viên ${provider}`,
          email: `user_${provider}@tattantat.vn`,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        saveSession(data.data);
        router.replace(safeReturnPath(nextParam));
      }
    } catch (err) {
      setError('Chưa kết nối được tài khoản MXH.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="shell" style={{ marginTop: 32, marginBottom: 56, display: 'flex', justifyContent: 'center' }}>
      <div className="white-card-box" style={{ width: '100%', maxWidth: 460, padding: '32px 28px', borderRadius: 24, boxShadow: '0 12px 36px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link href="/">
            <img src="/assets/logo.png" alt="Tất Tần Tật" style={{ height: 44, objectFit: 'contain', marginBottom: 10 }} />
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>Chào mừng trở lại!</h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>Đăng nhập để quản lý tin đăng, mua bán & trao đổi trực tiếp</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 500, marginBottom: 18 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Số điện thoại hoặc Email *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#94a3b8" style={{ position: 'absolute', top: 12, left: 12 }} />
              <input
                type="text"
                value={phoneOrEmail}
                onChange={e => setPhoneOrEmail(e.target.value)}
                placeholder="0901234567 hoặc email@domain.com"
                required
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Mật khẩu *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', top: 12, left: 12 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '11px 40px 11px 40px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', top: 10, right: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#475569' }}>
              <input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập
            </label>
            <Link href="/login" style={{ color: '#00a65a', textDecoration: 'none', fontWeight: 600 }}>Quên mật khẩu?</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #00A65A 0%, #008247 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              padding: 13,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 6,
              boxShadow: '0 4px 14px rgba(0, 166, 90, 0.3)'
            }}
          >
            {loading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0 18px', color: '#94a3b8', fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ padding: '0 12px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Hoặc tiếp tục với</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={handleGoogleAuth}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 12, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: '#334155' }}
          >
            <GoogleIcon /> Google
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin('facebook')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 12, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: '#334155' }}
          >
            <FacebookIcon /> Facebook
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9', fontSize: 13.5, color: '#64748b' }}>
          Chưa có tài khoản? <Link href="/register" style={{ color: '#00a65a', textDecoration: 'none', fontWeight: 700 }}>Đăng ký ngay</Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="shell" style={{ padding: 60, textAlign: 'center' }}>Đang tải trang đăng nhập...</div>}>
      <LoginContent />
    </Suspense>
  );
}
