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

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>4. Dữ liệu định danh (CMND/CCCD)</h3>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Chỉ thu thập khi bạn chủ động xác minh tài khoản: họ tên, số giấy tờ (hệ thống lưu dạng mã hóa một chiều và 4 số cuối để chống trùng lặp), ảnh giấy tờ và ảnh chân dung.</li>
            <li>Ảnh được lưu ở kho lưu trữ riêng tư, không công khai; chỉ quản trị viên phụ trách xác minh được xem qua liên kết có thời hạn ngắn.</li>
            <li>Dữ liệu chỉ dùng để xác minh danh tính, phòng chống gian lận và giải quyết tranh chấp; không dùng cho quảng cáo và không chia sẻ cho bên thứ ba trừ khi có yêu cầu hợp pháp của cơ quan nhà nước có thẩm quyền.</li>
            <li>Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu cá nhân bằng cách liên hệ bộ phận hỗ trợ.</li>
          </ul>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>5. Thông báo, tìm kiếm đã lưu và số điện thoại</h3>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Chúng tôi gửi thông báo trong ứng dụng, thông báo đẩy và email (nếu được bật). Bạn có thể bật/tắt từng nhóm thông báo tại Tài khoản → Cài đặt thông báo.</li>
            <li>Số điện thoại được dùng để xác minh bằng mã OTP; mã chỉ có hiệu lực 5 phút.</li>
            <li>Từ khóa và bộ lọc của các tìm kiếm bạn chọn lưu được dùng để thông báo khi có tin mới phù hợp; bạn có thể xóa bất kỳ lúc nào.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
