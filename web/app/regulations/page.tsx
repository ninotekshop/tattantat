import Link from 'next/link';

export const metadata = {
  title: 'Quy chế hoạt động - Tất Tần Tật',
  description: 'Quy chế hoạt động Sàn Thương mại Điện tử Rao vặt Tất Tần Tật (www.tattantat.vn).',
};

export default function RegulationsPage() {
  return (
    <main className="shell" style={{ marginTop: 24, marginBottom: 48 }}>
      <nav style={{ fontSize: 13.5, color: '#64748b', marginBottom: 16 }}>
        <Link href="/" style={{ color: '#475569', textDecoration: 'none' }}>Trang chủ</Link> / <span style={{ color: '#00a65a', fontWeight: 600 }}>Quy chế hoạt động</span>
      </nav>

      <div className="white-card-box" style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
          Quy chế hoạt động Sàn TMĐT Tất Tần Tật
        </h1>
        <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24 }}>Đã thông báo và tuân thủ quy định Bộ Công Thương</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 20, color: '#334155', lineHeight: 1.7, fontSize: 14.5 }}>
          <p>
            Quy chế này áp dụng cho tất cả các thành viên tham gia giao dịch, đăng tin mua bán trên Sàn Thương mại Điện tử Tất Tần Tật (`www.tattantat.vn`).
          </p>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>I. Nguyên tắc chung</h3>
          <p>
            Sàn TMĐT Tất Tần Tật do Công ty quản lý hoạt động nhằm tạo môi trường kết nối mua bán hàng hóa, sản phẩm, dịch vụ hợp pháp giữa các cá nhân, thương nhân trên toàn quốc.
          </p>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>II. Quy trình giao dịch</h3>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><b>Bước 1:</b> Người bán tạo tin đăng thanh lý/bán hàng qua biểu mẫu thông minh.</li>
            <li><b>Bước 2:</b> Hệ thống Moderation tự động kiểm tra nội dung và duyệt hiển thị.</li>
            <li><b>Bước 3:</b> Người mua tìm kiếm, xem chi tiết và liên hệ qua Chat nội bộ Tất Tần Tật.</li>
            <li><b>Bước 4:</b> Hai bên thống nhất phương thức thanh toán và giao nhận hàng hóa.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
