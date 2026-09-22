import Link from 'next/link';

export const metadata = {
  title: 'An toàn giao dịch - Tất Tần Tật',
  description: 'Cẩm nang an toàn giao dịch & bí quyết phòng tránh lừa đảo khi mua bán trên Tất Tần Tật.',
};

export default function SafetyGuidePage() {
  return (
    <main className="shell" style={{ marginTop: 24, marginBottom: 48 }}>
      <nav style={{ fontSize: 13.5, color: '#64748b', marginBottom: 16 }}>
        <Link href="/" style={{ color: '#475569', textDecoration: 'none' }}>Trang chủ</Link> / <span style={{ color: '#00a65a', fontWeight: 600 }}>An toàn giao dịch</span>
      </nav>

      <div className="white-card-box" style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
          Cẩm nang an toàn giao dịch & Mua bán tin cậy
        </h1>
        <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24 }}>Những lưu ý quan trọng giúp bạn mua bán an toàn trên Tất Tần Tật</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 20, color: '#334155', lineHeight: 1.7, fontSize: 14.5 }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: 16, color: '#991b1b' }}>
            <strong>⚠️ CẢNH BÁO QUAN TRỌNG:</strong> Tuyệt đối KHÔNG giao dịch, đặt cọc trước hoặc cung cấp thông tin tài khoản ngân hàng/OTP qua các ứng dụng chat bên ngoài (Zalo, Telegram, Facebook) khi chưa trực tiếp kiểm tra hàng hóa!
          </div>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>Bí quyết mua hàng an toàn:</h3>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><b>1. Giao dịch trực tiếp tại nơi đông người:</b> Ưu tiên hẹn gặp kiểm tra máy/sản phẩm tại các địa điểm công cộng như quán cà phê, trung tâm thương mại.</li>
            <li><b>2. Kiểm tra hàng kỹ trước khi trả tiền:</b> Thử đầy đủ chức năng (màn hình, camera, loa, sạc, phím bấm) đối với đồ điện tử.</li>
            <li><b>3. Chỉ chat qua Tất Tần Tật:</b> Dùng khung Chat nội bộ để lưu giữ bằng chứng trao đổi nếu có sự cố xảy ra.</li>
            <li><b>4. Kiểm tra huy hiệu xác thực:</b> Ưu tiên mua từ người bán có huy hiệu <code>✓ Đã xác thực</code>.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
