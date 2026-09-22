import Link from 'next/link';

export const metadata = {
  title: 'Giải quyết khiếu nại - Tất Tần Tật',
  description: 'Quy trình tiếp nhận và giải quyết tranh chấp khiếu nại trên Sàn Tất Tần Tật (www.tattantat.vn).',
};

export default function DisputeResolutionPage() {
  return (
    <main className="shell" style={{ marginTop: 24, marginBottom: 48 }}>
      <nav style={{ fontSize: 13.5, color: '#64748b', marginBottom: 16 }}>
        <Link href="/" style={{ color: '#475569', textDecoration: 'none' }}>Trang chủ</Link> / <span style={{ color: '#00a65a', fontWeight: 600 }}>Giải quyết khiếu nại</span>
      </nav>

      <div className="white-card-box" style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
          Quy trình giải quyết tranh chấp & khiếu nại
        </h1>
        <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24 }}>Đảm bảo quyền lợi chính đáng cho Người mua & Người bán</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 20, color: '#334155', lineHeight: 1.7, fontSize: 14.5 }}>
          <p>
            Tất Tần Tật luôn đề cao giải pháp thương lượng, hòa giải giữa các bên nhằm giữ gìn sự uy tín và niềm tin của thành viên đối với chất lượng dịch vụ.
          </p>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>Quy trình 3 bước xử lý khiếu nại:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <strong style={{ color: '#00a65a', fontSize: 15 }}>Bước 1: Tiếp nhận yêu cầu</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: 14 }}>Người dùng gửi khiếu nại qua nút "Báo cáo vi phạm" trên tin đăng hoặc liên hệ bộ phận hỗ trợ trong vòng 24h kể từ khi phát sinh sự cố.</p>
            </div>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <strong style={{ color: '#00a65a', fontSize: 15 }}>Bước 2: Xử lý & Xác minh</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: 14 }}>Ban quản trị Tất Tần Tật kiểm tra dữ liệu tin đăng, lịch sử Chat và bằng chứng cung cấp trong thời gian tối đa 3 ngày làm việc.</p>
            </div>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <strong style={{ color: '#00a65a', fontSize: 15 }}>Bước 3: Phán quyết & Khắc phục</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: 14 }}>Tất Tần Tật đưa ra phán quyết hoàn tiền, yêu cầu đổi trả hoặc tạm khóa tài khoản vi phạm tùy theo mức độ.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
