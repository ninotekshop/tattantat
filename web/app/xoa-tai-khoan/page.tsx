import Link from 'next/link';

export const metadata = {
  title: 'Xóa tài khoản và dữ liệu - Tất Tần Tật',
  description: 'Hướng dẫn yêu cầu xóa tài khoản và dữ liệu cá nhân trên ứng dụng và website Tất Tần Tật.',
};

const SUPPORT_EMAIL = 'cskh@ninotekpos.com';

const h3 = { fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' } as const;
const list = { paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 } as const;

export default function DeleteAccountPage() {
  return (
    <main className="shell" style={{ marginTop: 24, marginBottom: 48 }}>
      <nav style={{ fontSize: 13.5, color: '#64748b', marginBottom: 16 }}>
        <Link href="/" style={{ color: '#475569', textDecoration: 'none' }}>Trang chủ</Link> / <span style={{ color: '#00a65a', fontWeight: 600 }}>Xóa tài khoản</span>
      </nav>

      <div className="white-card-box" style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
          Yêu cầu xóa tài khoản và dữ liệu
        </h1>
        <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24 }}>
          Áp dụng cho ứng dụng “Tất Tần Tật” (Android, iOS) và website tattantat.vn do Ninotek Technology &amp; Service Company Limited vận hành.
        </p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 20, color: '#334155', lineHeight: 1.7, fontSize: 14.5 }}>
          <h3 style={h3}>Các bước yêu cầu xóa tài khoản</h3>
          <ol style={{ ...list, listStyle: 'decimal' }}>
            <li>Gửi email đến <a href={`mailto:${SUPPORT_EMAIL}?subject=Yêu cầu xóa tài khoản Tất Tần Tật`} style={{ color: '#00a65a', fontWeight: 600 }}>{SUPPORT_EMAIL}</a> với tiêu đề “Yêu cầu xóa tài khoản Tất Tần Tật”. Nên gửi từ chính email đã đăng ký tài khoản.</li>
            <li>Ghi rõ email hoặc số điện thoại dùng để đăng nhập (và tên hiển thị nếu có) để chúng tôi xác định đúng tài khoản.</li>
            <li>Chúng tôi sẽ phản hồi để xác nhận danh tính và xử lý yêu cầu trong vòng 7 ngày làm việc. Khi hoàn tất, bạn sẽ nhận email thông báo.</li>
          </ol>

          <h3 style={h3}>Dữ liệu sẽ bị xóa</h3>
          <ul style={list}>
            <li>Thông tin tài khoản: họ tên, email, số điện thoại, ảnh đại diện, thông tin đăng nhập (kể cả liên kết Google, Facebook, Apple).</li>
            <li>Tin đăng, hình ảnh, danh sách yêu thích, tìm kiếm đã lưu và cài đặt thông báo.</li>
            <li>Tin nhắn và dữ liệu hoạt động gắn với tài khoản.</li>
            <li>Ảnh giấy tờ, ảnh chân dung và dữ liệu xác minh danh tính (nếu bạn đã xác minh).</li>
          </ul>

          <h3 style={h3}>Dữ liệu có thể được giữ lại</h3>
          <ul style={list}>
            <li>Thông tin giao dịch, đơn hàng và khiếu nại cần lưu theo quy định pháp luật, hoặc để giải quyết tranh chấp và phòng chống gian lận: giữ tối đa 12 tháng kể từ khi xóa tài khoản, sau đó xóa hoặc ẩn danh hoàn toàn.</li>
            <li>Bản sao lưu hệ thống: tự động bị xóa trong vòng 30 ngày.</li>
          </ul>

          <h3 style={h3}>Lưu ý</h3>
          <ul style={list}>
            <li>Sau khi xóa, bạn không thể khôi phục tài khoản và dữ liệu.</li>
            <li>Bạn có thể yêu cầu xóa một phần dữ liệu (ví dụ ảnh xác minh) mà không cần xóa tài khoản, bằng cách ghi rõ trong email.</li>
            <li>Xem thêm <Link href="/privacy" style={{ color: '#00a65a', fontWeight: 600 }}>Chính sách bảo mật</Link>.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
