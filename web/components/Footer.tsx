'use client';

import Link from 'next/link';
import { ShieldCheck, Zap, Headphones } from 'lucide-react';

function FacebookIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
}

function YoutubeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
}

function TiktokIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.96-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-.99.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.36 1.53-1.38 2.53-.08.97.35 1.96 1.09 2.59.83.71 2.01.91 3.03.55 1.1-.38 1.92-1.37 2.08-2.52.06-2.61.02-5.22.03-7.83 0-1.78.01-3.56 0-5.34z"/></svg>;
}

function ZaloIcon() {
  return <span style={{fontWeight:800, fontSize:12, letterSpacing:-0.5}}>Zalo</span>;
}

export function Footer() {
  return (
    <footer className="main-footer">
      {/* TRUST FEATURE STRIP */}
      <div className="footer-trust-strip">
        <div className="shell trust-strip-inner">
          <div className="trust-item">
            <ShieldCheck size={20} color="#00a65a" />
            <div>
              <strong>Mua bán an toàn</strong>
              <span>Giao dịch trực tiếp, xác thực người dùng</span>
            </div>
          </div>
          <div className="trust-item">
            <Zap size={20} color="#00a65a" />
            <div>
              <strong>Đăng tin nhanh</strong>
              <span>Hoàn toàn miễn phí, chỉ trong 30 giây</span>
            </div>
          </div>
          <div className="trust-item">
            <Headphones size={20} color="#00a65a" />
            <div>
              <strong>Hỗ trợ 24/7</strong>
              <span>Đội ngũ hỗ trợ nhiệt tình, tin cậy</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN FOOTER GRID (5 COLUMNS) */}
      <div className="shell footer-main">
        <div className="footer-grid-5">
          {/* COL 1: BRAND */}
          <div className="footer-col brand-col">
            <Link href="/" className="footer-logo-link">
              <img src="/assets/logo.png" alt="Tất Tần Tật - Mua bán mọi thứ, gần bạn" className="footer-logo" />
            </Link>
            <p className="footer-slogan">Mua bán mọi thứ, gần bạn.</p>
            <p className="footer-desc">
              Nền tảng mua bán, trao đổi và kết nối người mua - người bán nhanh chóng, thuận tiện trên toàn quốc.
            </p>

            {/* BỘ CÔNG THƯƠNG BADGE */}
            <Link href="/regulations" className="bocongthuong-badge" style={{ textDecoration: 'none' }}>
              <div className="bct-icon">✓</div>
              <div>
                <strong>ĐÃ THÔNG BÁO</strong>
                <span>BỘ CÔNG THƯƠNG</span>
              </div>
            </Link>
          </div>

          {/* COL 2: MUA BÁN */}
          <div className="footer-col">
            <h4 className="footer-heading">Mua bán</h4>
            <ul className="footer-links">
              <li><Link href="/categories">Danh mục sản phẩm</Link></li>
              <li><Link href="/?sort=newest">Tin mới đăng</Link></li>
              <li><Link href="/?sort=popular">Sản phẩm nổi bật</Link></li>
              <li><Link href="/?sort=nearby">Gần bạn (GPS)</Link></li>
              <li><Link href="/favorites">Yêu thích</Link></li>
              <li><Link href="/sell" className="highlight-link">Đăng tin miễn phí</Link></li>
            </ul>
          </div>

          {/* COL 3: HỖ TRỢ */}
          <div className="footer-col">
            <h4 className="footer-heading">Hỗ trợ</h4>
            <ul className="footer-links">
              <li><Link href="/about">Trung tâm trợ giúp</Link></li>
              <li><Link href="/posting-rules">Hướng dẫn đăng tin</Link></li>
              <li><Link href="/safety-guide">An toàn giao dịch</Link></li>
              <li><Link href="/posting-rules">Quy định đăng tin</Link></li>
              <li><Link href="/dispute-resolution">Báo cáo vi phạm</Link></li>
              <li><Link href="/about">Liên hệ hỗ trợ</Link></li>
            </ul>
          </div>

          {/* COL 4: VỀ TẤT TẦN TẬT */}
          <div className="footer-col">
            <h4 className="footer-heading">Về Tất Tần Tật</h4>
            <ul className="footer-links">
              <li><Link href="/about">Giới thiệu</Link></li>
              <li><Link href="/terms">Điều khoản sử dụng</Link></li>
              <li><Link href="/privacy">Chính sách bảo mật</Link></li>
              <li><Link href="/regulations">Quy chế hoạt động</Link></li>
              <li><Link href="/dispute-resolution">Giải quyết khiếu nại</Link></li>
            </ul>
          </div>

          {/* COL 5: TẢI APP & SOCIAL */}
          <div className="footer-col app-col">
            <h4 className="footer-heading">Tải ứng dụng</h4>
            <p className="app-subtitle">Mua bán thuận tiện hơn trên điện thoại.</p>

            <div className="app-badges">
              <div className="app-store-btn">
                <span className="app-icon"></span>
                <div>
                  <small>Download on the</small>
                  <strong>App Store</strong>
                </div>
              </div>
              <div className="app-store-btn">
                <span className="app-icon">▶</span>
                <div>
                  <small>GET IT ON</small>
                  <strong>Google Play</strong>
                </div>
              </div>
            </div>

            <div className="footer-socials">
              <h5 className="social-heading">Kết nối với chúng tôi</h5>
              <div className="social-icons">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-btn"><FacebookIcon /></a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="social-btn"><YoutubeIcon /></a>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="social-btn"><TiktokIcon /></a>
                <a href="https://zalo.me" target="_blank" rel="noopener noreferrer" aria-label="Zalo" className="social-btn"><ZaloIcon /></a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER BOTTOM */}
      <div className="footer-bottom">
        <div className="shell footer-bottom-inner">
          <span>© 2026 Tất Tần Tật. Mọi quyền được bảo lưu.</span>
          <span className="domain-text">www.tattantat.vn</span>
        </div>
      </div>
    </footer>
  );
}
