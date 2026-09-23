'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Eye, EyeOff, Lock, Mail, Phone, User, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { saveSession } from '../lib/auth';

type ModalMode = 'LOGIN' | 'REGISTER' | 'PHONE' | 'OTP' | 'FORGOT_PASSWORD' | 'RESET_SENT';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: ModalMode;
  onSuccess?: () => void;
}

function GoogleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.2 1.03-.78 1.93-1.63 2.52v2.12h2.63c1.54-1.42 2.43-3.51 2.43-6.08z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-2.63-2.12c-1.07.72-2.45 1.16-4.3 1.16-3.3 0-6.1-2.23-7.1-5.23H3.16v2.19C5.14 21.01 8.35 24 12 24z"/><path fill="#FBBC05" d="M4.9 14.9c-.25-.72-.39-1.49-.39-2.9s.14-2.18.39-2.9V6.91H3.16C2.42 8.44 2 10.16 2 12s.42 3.56 1.16 5.09l2.74-2.19z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 8.35 0 5.14 2.99 3.16 6.91l2.74 2.19c1-3 3.8-5.35 7.1-5.35z"/></svg>;
}

function FacebookIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
}

function AppleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 2.1-3.09 1.82-2.58 6.13.56 7.42-.64 1.28-1.51 2.54-2.41 3.64zM15.97 6.13c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.8 1.44-.61.71-1.14 1.87-1 2.99 1.07.08 2.16-.51 2.81-1.33z"/></svg>;
}

export function AuthModal({ isOpen, onClose, initialMode = 'LOGIN', onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<ModalMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(true);

  // OTP state
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    let timer: any;
    if (mode === 'OTP' && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [mode, countdown]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const scriptId = 'google-gsi-client-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  // Load Facebook SDK Script dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!fbAppId) return;

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/vi_VN/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if ((window as any).FB) {
          (window as any).FB.init({
            appId: fbAppId,
            cookie: true,
            xfbml: true,
            version: 'v19.0',
          });
        }
      };
      document.body.appendChild(script);
    }
  }, []);

  // Load Apple JS SDK dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!document.getElementById('apple-auth-script')) {
      const script = document.createElement('script');
      script.id = 'apple-auth-script';
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail || !password) {
      setError('Vui lòng nhập email/số điện thoại và mật khẩu');
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
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(data.message || 'Email hoặc mật khẩu chưa chính xác.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu tối thiểu 8 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp');
      return;
    }
    if (!termsAgreed) {
      setError('Bạn cần đồng ý với Điều khoản sử dụng & Chính sách bảo mật');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone: phone || undefined, password, termsAgreed }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        saveSession(data.data);
        setSuccessMsg('Đăng ký thành công! Email chào mừng đã được gửi.');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setError(data.message || 'Đăng ký không thành công.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setMode('OTP');
        setCountdown(60);
      } else {
        setError(data.message || 'Chưa gửi được mã OTP.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Vui lòng nhập mã OTP 6 chữ số');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        saveSession(data.data);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(data.message || 'Mã OTP không chính xác.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập địa chỉ email đã đăng ký');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMode('RESET_SENT');
      setSuccessMsg(data.message || 'Nếu email này được đăng ký tại Tất Tần Tật, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong ít phút.');
    } catch (err) {
      setError('Lỗi kết nối máy chủ.');
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
                onClose();
                if (onSuccess) onSuccess();
              } else {
                setError(data.message || 'Lỗi xác thực Google.');
              }
            } catch (err) {
              setError('Lỗi kết nối với Google.');
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

  const handleFacebookAuth = () => {
    const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if ((window as any).FB && fbAppId) {
      (window as any).FB.login(
        async (response: any) => {
          if (response?.authResponse?.accessToken) {
            setLoading(true);
            try {
              const res = await fetch('/api/v1/auth/social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  provider: 'facebook',
                  providerAccountId: response.authResponse.userID || 'facebook_user_2026',
                  accessToken: response.authResponse.accessToken,
                }),
              });
              const data = await res.json();
              if (data.success && data.data) {
                saveSession(data.data);
                onClose();
                if (onSuccess) onSuccess();
              } else {
                setError(data.message || 'Chưa thể xác thực Facebook.');
              }
            } catch (err) {
              setError('Lỗi kết nối Facebook.');
            } finally {
              setLoading(false);
            }
          } else {
            setError('Người dùng đã hủy đăng nhập Facebook.');
          }
        },
        { scope: 'public_profile,email' }
      );
    } else {
      handleSocialLogin('facebook');
    }
  };

  const handleAppleAuth = async () => {
    const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    if ((window as any).AppleID && appleClientId) {
      try {
        (window as any).AppleID.auth.init({
          clientId: appleClientId,
          scope: 'name email',
          redirectURI: window.location.origin + '/',
          usePopup: true,
        });
        const response = await (window as any).AppleID.auth.signIn();
        if (response?.authorization?.id_token) {
          setLoading(true);
          try {
            const res = await fetch('/api/v1/auth/social', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                provider: 'apple',
                providerAccountId: 'apple_oauth_2026',
                idToken: response.authorization.id_token,
                name: response.user ? `${response.user.name?.firstName || ''} ${response.user.name?.lastName || ''}`.trim() : undefined,
                email: response.user?.email,
              }),
            });
            const data = await res.json();
            if (data.success && data.data) {
              saveSession(data.data);
              onClose();
              if (onSuccess) onSuccess();
            } else {
              setError(data.message || 'Lỗi xác thực Apple ID.');
            }
          } catch (err) {
            setError('Lỗi kết nối Apple ID.');
          } finally {
            setLoading(false);
          }
        }
      } catch (err) {
        setError('Đã hủy đăng nhập Apple.');
      }
    } else {
      handleSocialLogin('apple');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
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
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError('Chưa đăng nhập được qua MXH.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(5px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff',
        borderRadius: 24,
        width: '100%',
        maxWidth: 460,
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>

        {/* MODAL HEADER */}
        <div style={{ padding: '24px 24px 16px', textAlign: 'center', position: 'relative', borderBottom: '1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} color="#64748b" />
          </button>

          <img src="/assets/logo.png" alt="Tất Tần Tật" style={{ height: 38, objectFit: 'contain', marginBottom: 8 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Chào mừng đến Tất Tần Tật</h2>
          <p style={{ fontSize: 12.5, color: '#64748b', marginTop: 4, margin: 0 }}>Mua bán dễ dàng – Kết nối mọi người</p>
        </div>

        {/* TABS NAVIGATION */}
        {['LOGIN', 'REGISTER', 'PHONE'].includes(mode) && (
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <button
              onClick={() => { setMode('LOGIN'); setError(null); }}
              style={{ flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600, border: 'none', background: mode === 'LOGIN' ? '#fff' : 'transparent', color: mode === 'LOGIN' ? '#00a65a' : '#64748b', cursor: 'pointer', borderBottom: mode === 'LOGIN' ? '2px solid #00a65a' : 'none' }}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => { setMode('REGISTER'); setError(null); }}
              style={{ flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600, border: 'none', background: mode === 'REGISTER' ? '#fff' : 'transparent', color: mode === 'REGISTER' ? '#00a65a' : '#64748b', cursor: 'pointer', borderBottom: mode === 'REGISTER' ? '2px solid #00a65a' : 'none' }}
            >
              Đăng ký
            </button>
            <button
              onClick={() => { setMode('PHONE'); setError(null); }}
              style={{ flex: 1, padding: '12px 0', fontSize: 13, fontWeight: 600, border: 'none', background: mode === 'PHONE' ? '#fff' : 'transparent', color: mode === 'PHONE' ? '#00a65a' : '#64748b', cursor: 'pointer', borderBottom: mode === 'PHONE' ? '2px solid #00a65a' : 'none' }}
            >
              SĐT + OTP
            </button>
          </div>
        )}

        <div style={{ padding: 24 }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#047857', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={18} /> {successMsg}
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Email hoặc Số điện thoại *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', top: 12, left: 12 }} />
                  <input
                    type="text"
                    value={phoneOrEmail}
                    onChange={e => setPhoneOrEmail(e.target.value)}
                    placeholder="nhapemail@domain.com hoặc 0901234567"
                    style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Mật khẩu *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', top: 12, left: 12 }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mật khẩu của bạn"
                    style={{ width: '100%', padding: '10px 38px 10px 38px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', top: 10, right: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={16} color="#64748b" /> : <Eye size={16} color="#64748b" />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#475569' }}>
                  <input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập
                </label>
                <button type="button" onClick={() => { setMode('FORGOT_PASSWORD'); setError(null); }} style={{ background: 'transparent', border: 'none', color: '#00a65a', fontWeight: 600, cursor: 'pointer' }}>
                  Quên mật khẩu?
                </button>
              </div>

              <button type="submit" disabled={loading} style={{ background: '#00a65a', color: '#ffffff', padding: '12px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 6, boxShadow: '0 4px 12px rgba(0,166,90,0.25)' }}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Họ và tên *</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nguyễn Văn A" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Địa chỉ Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@domain.com" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Số điện thoại (Không bắt buộc)</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901234567" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Mật khẩu (Tối thiểu 8 ký tự) *</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu bảo mật" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Nhập lại mật khẩu *</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Xác nhận mật khẩu" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14 }} />
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#475569', marginTop: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} style={{ marginTop: 2 }} />
                <span>Tôi đồng ý với <Link href="/" style={{ color: '#00a65a', textDecoration: 'underline' }}>Điều khoản sử dụng</Link> và <Link href="/" style={{ color: '#00a65a', textDecoration: 'underline' }}>Chính sách bảo mật</Link> của Tất Tần Tật.</span>
              </label>

              <button type="submit" disabled={loading} style={{ background: '#00a65a', color: '#ffffff', padding: '12px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8, boxShadow: '0 4px 12px rgba(0,166,90,0.25)' }}>
                {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản ngay'}
              </button>
            </form>
          )}

          {/* TAB 3: PHONE OTP */}
          {mode === 'PHONE' && (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Số điện thoại Việt Nam *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '10px 12px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#334155' }}>+84</span>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901234567" style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14 }} />
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ background: '#00a65a', color: '#ffffff', padding: '12px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                {loading ? 'Đang gửi mã...' : 'Gửi mã xác thực OTP'}
              </button>
            </form>
          )}

          {/* MODE: OTP VERIFICATION */}
          {mode === 'OTP' && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>Mã OTP 6 chữ số đã được gửi tới số <strong>{phone}</strong></p>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="123456"
                style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700, padding: 12, borderRadius: 12, border: '2px solid #00a65a', outline: 'none' }}
              />
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : <button type="button" onClick={handleSendOtp} style={{ background: 'transparent', border: 'none', color: '#00a65a', fontWeight: 600, cursor: 'pointer' }}>Gửi lại mã OTP</button>}
              </div>

              <button type="submit" disabled={loading} style={{ background: '#00a65a', color: '#ffffff', padding: '12px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                {loading ? 'Đang xác nhận...' : 'Xác nhận & Đăng nhập'}
              </button>
            </form>
          )}

          {/* MODE: FORGOT PASSWORD */}
          {mode === 'FORGOT_PASSWORD' && (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <button type="button" onClick={() => setMode('LOGIN')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', padding: 0 }}>
                <ArrowLeft size={16} /> Quay lại đăng nhập
              </button>
              <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                Nhập email đã đăng ký. Tất Tần Tật sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn từ <strong>hotro@tattantat.vn</strong>.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Email đăng ký *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@domain.com" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14 }} />
              </div>

              <button type="submit" disabled={loading} style={{ background: '#00a65a', color: '#ffffff', padding: '12px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                {loading ? 'Đang xử lý...' : 'Gửi hướng dẫn đặt lại mật khẩu'}
              </button>
            </form>
          )}

          {/* SOCIAL LOGIN DIVIDER */}
          {['LOGIN', 'REGISTER', 'PHONE'].includes(mode) && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px', color: '#94a3b8', fontSize: 12 }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <span style={{ padding: '0 12px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500 }}>Hoặc tiếp tục với</span>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={handleGoogleAuth} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  <GoogleIcon /> Google
                </button>
                <button type="button" onClick={handleFacebookAuth} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  <FacebookIcon /> Facebook
                </button>
                <button type="button" onClick={handleAppleAuth} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  <AppleIcon /> Apple
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
