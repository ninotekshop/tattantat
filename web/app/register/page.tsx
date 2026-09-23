'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, User, Phone, CheckCircle, ArrowLeft } from 'lucide-react';
import { saveSession } from '../../lib/auth';

function RegisterContent() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu phải chứa tối thiểu 8 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    if (!termsAgreed) {
      setError('Bạn cần đồng ý với Điều khoản sử dụng & Chính sách bảo mật.');
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
        setSuccessMsg('Đăng ký tài khoản thành công! Bạn đang được chuyển hướng...');
        setTimeout(() => {
          router.replace('/');
        }, 1200);
      } else {
        setError(data.message || 'Đăng ký không thành công. Email hoặc SĐT có thể đã tồn tại.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="shell" style={{ marginTop: 32, marginBottom: 56, display: 'flex', justifyContent: 'center' }}>
      <div className="white-card-box" style={{ width: '100%', maxWidth: 480, padding: '32px 28px', borderRadius: 24, boxShadow: '0 12px 36px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link href="/">
            <img src="/assets/logo.png" alt="Tất Tần Tật" style={{ height: 44, objectFit: 'contain', marginBottom: 10 }} />
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>Tham gia Tất Tần Tật</h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>Tạo tài khoản miễn phí để mua bán & rao vặt nhanh chóng</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 500, marginBottom: 18 }}>
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#047857', padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={18} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Họ và tên *</label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#94a3b8" style={{ position: 'absolute', top: 12, left: 12 }} />
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Địa chỉ Email *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#94a3b8" style={{ position: 'absolute', top: 12, left: 12 }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@domain.com"
                required
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Số điện thoại (Không bắt buộc)</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} color="#94a3b8" style={{ position: 'absolute', top: 12, left: 12 }} />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0901234567"
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Mật khẩu (Tối thiểu 8 ký tự) *</label>
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

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Nhập lại mật khẩu *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu"
              required
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#475569', marginTop: 4, cursor: 'pointer', lineHeight: 1.5 }}>
            <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} style={{ marginTop: 3 }} />
            <span>Tôi đồng ý với <Link href="/terms" style={{ color: '#00a65a', textDecoration: 'underline' }}>Điều khoản sử dụng</Link> và <Link href="/privacy" style={{ color: '#00a65a', textDecoration: 'underline' }}>Chính sách bảo mật</Link> của Tất Tần Tật.</span>
          </label>

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
            {loading ? 'Đang tạo tài khoản...' : 'TẠO TÀI KHOẢN NGAY'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9', fontSize: 13.5, color: '#64748b' }}>
          Đã có tài khoản? <Link href="/login" style={{ color: '#00a65a', textDecoration: 'none', fontWeight: 700 }}>Đăng nhập ngay</Link>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="shell" style={{ padding: 60, textAlign: 'center' }}>Đang tải trang đăng ký...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
