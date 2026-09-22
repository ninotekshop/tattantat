import Link from 'next/link';

export const metadata = {
  title: 'Điều khoản sử dụng - Tất Tần Tật',
  description: 'Các điều khoản sử dụng dịch vụ trên Sàn TMĐT Rao vặt Tất Tần Tật (www.tattantat.vn).',
};

export default function TermsPage() {
  return (
    <main className="shell" style={{ marginTop: 24, marginBottom: 48 }}>
      <nav style={{ fontSize: 13.5, color: '#64748b', marginBottom: 16 }}>
        <Link href="/" style={{ color: '#475569', textDecoration: 'none' }}>Trang chủ</Link> / <span style={{ color: '#00a65a', fontWeight: 600 }}>Điều khoản sử dụng</span>
      </nav>

      <div className="white-card-box" style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
          Điều khoản sử dụng dịch vụ
        </h1>
        <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24 }}>Cập nhật lần cuối: Ngày 01 tháng 01 năm 2026</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 20, color: '#334155', lineHeight: 1.7, fontSize: 14.5 }}>
          <p>
            Chào mừng bạn đến với <b>Sàn Thương mại Điện tử Rao vặt Tất Tần Tật (www.tattantat.vn)</b>. Khi truy cập và sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ toàn bộ các điều khoản và điều kiện được quy định dưới đây.
          </p>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>1. Quyền và Trách nhiệm của Người đăng tin (Người bán)</h3>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Cung cấp đầy đủ, chính xác thông tin về sản phẩm, hàng hóa hoặc dịch vụ.</li>
            <li>Không đăng các sản phẩm nằm trong danh mục cấm giao dịch theo quy định của pháp luật Việt Nam.</li>
            <li>Tuyệt đối không đưa số điện thoại, Zalo, link mạng xã hội hoặc thông tin liên hệ ngoài nền tảng vào tiêu đề, mô tả và hình ảnh sản phẩm.</li>
            <li>Tự chịu trách nhiệm về chất lượng hàng hóa và nghĩa vụ thuế (nếu có).</li>
          </ul>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>2. Quyền và Trách nhiệm của Người mua</h3>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Chỉ thực hiện trao đổi và liên hệ qua hệ thống Chat nội bộ của Tất Tần Tật.</li>
            <li>Kiểm tra kỹ hàng hóa trước khi xác nhận hoàn tất đơn hàng hoặc thanh toán.</li>
            <li>Báo cáo vi phạm ngay lập tức nếu phát hiện dấu hiệu gian lận hoặc hàng giả.</li>
          </ul>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>3. Quyền hạn của Tất Tần Tật</h3>
          <p>
            Tất Tần Tật có quyền từ chối, tạm ẩn hoặc xóa bỏ bất kỳ tin đăng nào vi phạm quy định, hoặc tạm khóa tài khoản có hành vi lừa đảo/lách luật giao dịch ngoài hệ thống mà không cần báo trước.
          </p>
        </section>
      </div>
    </main>
  );
}
