import Link from 'next/link';

export const metadata = {
  title: 'Quy định đăng tin - Tất Tần Tật',
  description: 'Các quy định chi tiết về hình ảnh, tiêu đề, mô tả và danh mục cấm đăng tin trên Tất Tần Tật.',
};

export default function PostingRulesPage() {
  return (
    <main className="shell" style={{ marginTop: 24, marginBottom: 48 }}>
      <nav style={{ fontSize: 13.5, color: '#64748b', marginBottom: 16 }}>
        <Link href="/" style={{ color: '#475569', textDecoration: 'none' }}>Trang chủ</Link> / <span style={{ color: '#00a65a', fontWeight: 600 }}>Quy định đăng tin</span>
      </nav>

      <div className="white-card-box" style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
          Quy định đăng tin bài trên Tất Tần Tật
        </h1>
        <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24 }}>Đảm bảo tin đăng chất lượng, minh bạch và thu hút người mua</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 20, color: '#334155', lineHeight: 1.7, fontSize: 14.5 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>1. Tiêu đề & Nội dung mô tả</h3>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Tiêu đề phải viết bằng tiếng Việt rõ ràng, mô tả đúng sản phẩm cần bán.</li>
            <li>Không chèn số điện thoại, Zalo, địa chỉ email, link website vào tiêu đề và nội dung tin đăng.</li>
            <li>Mô tả rõ tình trạng thực tế, nguồn gốc xuất xứ và phụ kiện đi kèm.</li>
          </ul>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>2. Hình ảnh sản phẩm</h3>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Ảnh chụp thật của sản phẩm cần bán, ánh sáng rõ ràng, không sử dụng ảnh mạng giả mạo.</li>
            <li>Không dùng ảnh chứa khung số điện thoại hoặc watermark thông tin liên hệ lách luật.</li>
          </ul>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>3. Danh mục cấm giao dịch</h3>
          <p>
            Tuyệt đối nghiêm cấm đăng tải: Vũ khí, chất cấm, thuốc lá, chất cháy nổ, động vật hoang dã nguy cấp, tiền giả, bằng cấp giả, phần mềm gian lận và các dịch vụ vi phạm thuần phong mỹ tục.
          </p>
        </section>
      </div>
    </main>
  );
}
