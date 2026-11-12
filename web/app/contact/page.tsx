import type { Metadata } from 'next';
import Link from 'next/link';
import { contactPageNode, jsonLdString } from '../../lib/jsonld';
import { siteUrl } from '../../lib/seo-landing';
import { APP_LINKS, COMPANY, SITE_NAME } from '../../lib/site-info';

export const metadata: Metadata = {
  title: 'Liên hệ - Tất Tần Tật',
  description: `Liên hệ ${SITE_NAME}: email ${COMPANY.email}, hotline CSKH ${COMPANY.phoneDisplay}, địa chỉ ${COMPANY.addressLine}.`,
  alternates: { canonical: siteUrl() + '/contact' },
};

const row: React.CSSProperties = { margin: '0 0 10px', fontSize: 15, color: '#334155', lineHeight: 1.7 };
const link: React.CSSProperties = { color: '#008247', fontWeight: 600, textDecoration: 'none' };

export default function ContactPage() {
  return (
    <main className="shell" style={{ marginTop: 24, marginBottom: 48 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(contactPageNode(siteUrl())) }} />
      <nav style={{ fontSize: 13.5, color: '#64748b', marginBottom: 16 }}>
        <Link href="/" style={{ color: '#475569', textDecoration: 'none' }}>Trang chủ</Link> / <span style={{ color: '#00a65a', fontWeight: 600 }}>Liên hệ</span>
      </nav>

      <div className="white-card-box" style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Liên hệ Tất Tần Tật</h1>
        <p style={{ ...row, marginBottom: 24 }}>Cần hỗ trợ đăng tin, giao dịch hay báo cáo vi phạm? Hãy liên hệ đội ngũ chăm sóc khách hàng qua các kênh dưới đây.</p>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Thông tin liên hệ</h2>
          <p style={row}><b>Đơn vị vận hành:</b> {COMPANY.legalName}</p>
          <p style={row}><b>Email hỗ trợ:</b> <a href={`mailto:${COMPANY.email}`} style={link}>{COMPANY.email}</a></p>
          <p style={row}><b>Hotline CSKH:</b> <a href="tel:02563577988" style={link}>{COMPANY.phoneDisplay}</a></p>
          <p style={row}><b>Địa chỉ:</b> {COMPANY.addressLine}</p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Trợ giúp nhanh</h2>
          <p style={row}><Link href="/safety-guide" style={link}>An toàn giao dịch</Link>: mẹo mua bán an toàn, nhận biết dấu hiệu lừa đảo.</p>
          <p style={row}><Link href="/posting-rules" style={link}>Quy định đăng tin</Link>: nội dung được phép và bị cấm.</p>
          <p style={row}><Link href="/dispute-resolution" style={link}>Giải quyết khiếu nại</Link>: gửi báo cáo vi phạm và theo dõi xử lý.</p>
          <p style={row}><Link href="/about" style={link}>Giới thiệu</Link> · <Link href="/terms" style={link}>Điều khoản sử dụng</Link> · <Link href="/privacy" style={link}>Chính sách bảo mật</Link> · <Link href="/regulations" style={link}>Quy chế hoạt động</Link></p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Ứng dụng di động</h2>
          <p style={row}>
            <a href={APP_LINKS.android} target="_blank" rel="noopener noreferrer" style={link}>Tải trên Google Play</a> · <a href={APP_LINKS.ios} target="_blank" rel="noopener noreferrer" style={link}>Tải trên App Store</a>
          </p>
        </section>
      </div>
    </main>
  );
}
