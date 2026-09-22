import Link from 'next/link';

export const metadata = {
  title: 'Chính sách bảo mật - Tất Tần Tật',
  description: 'Chính sách thu thập và bảo mật thông tin cá nhân trên Tất Tần Tật (www.tattantat.vn).',
};

export default function PrivacyPage() {
  return (
    <main className="shell" style={{ marginTop: 24, marginBottom: 48 }}>
      <nav style={{ fontSize: 13.5, color: '#64748b', marginBottom: 16 }}>
        <Link href="/" style={{ color: '#475569', textDecoration: 'none' }}>Trang chủ</Link> / <span style={{ color: '#00a65a', fontWeight: 600 }}>Chính sách bảo mật</span>
      </nav>

      <div className="white-card-box" style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
          Chính sách bảo mật thông tin
        </h1>
        <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24 }}>Áp dụng cho toàn bộ thành viên trên www.tattantat.vn</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 20, color: '#334155', lineHeight: 1.7, fontSize: 14.5 }}>
          <p>
            <b>Tất Tần Tật</b> cam kết bảo mật tuyệt đối thông tin cá nhân của người dùng theo Luật An ninh mạng và các quy định pháp luật Việt Nam.
          </p>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>1. Thu thập thông tin</h3>
          <p>
            Chúng tôi thu thập các thông tin cần thiết khi bạn đăng ký tài khoản như: Họ tên, Email, Số điện thoại, Tọa độ vị trí địa lý (khi cấp quyền) nhằm phục vụ việc hiển thị sản phẩm gần bạn.
          </p>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>2. Bảo vệ thông tin liên hệ (Closed Marketplace)</h3>
          <p>
            Sàn Tất Tần Tật áp dụng cơ chế <b>Bảo vệ thông tin cá nhân khép kín</b>: Số điện thoại, Email và Địa chỉ chính xác của người bán không được công khai trên giao diện web/mọi public API để tránh bị thu thập trái phép hoặc lừa đảo ngoài nền tảng.
          </p>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>3. Cam kết không chia sẻ</h3>
          <p>
            Chúng tôi không bán, chia sẻ hoặc tiết lộ thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào ngoại trừ trường hợp có yêu cầu bằng văn bản từ cơ quan pháp luật có thẩm quyền.
          </p>
        </section>
      </div>
    </main>
  );
}
