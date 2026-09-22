import Link from 'next/link';

export const metadata = {
  title: 'Giới thiệu - Tất Tần Tật (www.tattantat.vn)',
  description: 'Giới thiệu về Sàn TMĐT Rao vặt Tất Tần Tật - Mua bán mọi thứ, gần bạn.',
};

export default function AboutPage() {
  return (
    <main className="shell" style={{ marginTop: 24, marginBottom: 48 }}>
      <nav style={{ fontSize: 13.5, color: '#64748b', marginBottom: 16 }}>
        <Link href="/" style={{ color: '#475569', textDecoration: 'none' }}>Trang chủ</Link> / <span style={{ color: '#00a65a', fontWeight: 600 }}>Giới thiệu về Tất Tần Tật</span>
      </nav>

      <div className="white-card-box" style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
          Giới thiệu về Sàn TMĐT Rao vặt Tất Tần Tật
        </h1>
        <p style={{ fontSize: 15, color: '#00a65a', fontWeight: 700, marginBottom: 24 }}>
          Slogan: "Mua bán mọi thứ, gần bạn." · Website: www.tattantat.vn
        </p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 20, color: '#334155', lineHeight: 1.7, fontSize: 15 }}>
          <p>
            <b>Tất Tần Tật (www.tattantat.vn)</b> là sàn thương mại điện tử chuyên về rao vặt, kết nối mua bán trực tiếp giữa người mua và người bán hàng đầu tại Việt Nam. Nền tảng được xây dựng với mục tiêu mang đến trải nghiệm mua bán <i>Đơn giản - Nhanh chóng - An toàn - Tiết kiệm</i> cho mọi người dân.
          </p>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: 20 }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#008247', fontSize: 17, fontWeight: 700 }}>Tầm nhìn & Sứ mệnh</h3>
            <p style={{ margin: 0, fontSize: 14.5 }}>
              Tất Tần Tật mong muốn trở thành nền tảng rao vặt số 1 Việt Nam về độ phủ rộng và sự tin cậy. Chúng tôi trao quyền cho cộng đồng dọn dẹp đồ dùng cũ, thanh lý hàng hóa nhanh chóng và dễ dàng tìm thấy những món đồ chất lượng ngay tại khu vực sinh sống của mình.
            </p>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 12, marginBottom: 8 }}>
            Những điểm nổi bật tại Tất Tần Tật
          </h2>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><b>14 Danh mục chuyên sâu:</b> Đồ công nghệ, Xe cộ, Bất động sản, Nhà cửa & Đời sống, Thời trang, Thú cưng, Việc làm, Dịch vụ,...</li>
            <li><b>Công nghệ Location Engine thông minh:</b> Định vị GPS và gợi ý sản phẩm ngay gần bạn theo bán kính từ 1km đến 50km.</li>
            <li><b>Đăng tin miễn phí & Nhanh chóng:</b> Tạo tin đăng thanh lý chỉ trong 30 giây với biểu mẫu động thông minh.</li>
            <li><b>Giao dịch khép kín & An toàn:</b> Tích hợp hệ thống Chat nội bộ, bảo mật thông tin liên hệ cá nhân và cơ chế kiểm duyệt tin đăng nghiêm ngặt.</li>
            <li><b>Chứng nhận chính thức:</b> Đã hoàn tất thông báo và tuân thủ quy định với Bộ Công Thương Việt Nam.</li>
          </ul>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 14, color: '#64748b' }}>Trụ sở chính: Quy Nhơn, Bình Định, Việt Nam</span>
            <Link href="/sell" style={{ background: '#00a65a', color: '#fff', padding: '10px 24px', borderRadius: 999, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              ĐĂNG TIN NGAY
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
