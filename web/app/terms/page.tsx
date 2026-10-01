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
        <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24 }}>Cập nhật lần cuối: Ngày 30 tháng 09 năm 2026</p>

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

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>4. Thanh toán đảm bảo (thanh toán online)</h3>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Khi người mua chọn thanh toán online, tiền được Tất Tần Tật giữ lại và chỉ chuyển vào ví của người bán sau khi người mua xác nhận đã nhận hàng.</li>
            <li>Nếu người mua không xác nhận và không khiếu nại, đơn được tự động hoàn tất sau 3 ngày kể từ khi đơn ở trạng thái đã giao; tiền được ghi vào ví của người bán.</li>
            <li>Nếu người bán không giao hàng trong 5 ngày kể từ khi đơn được thanh toán, đơn bị hủy và tiền được hoàn lại cho người mua.</li>
            <li>Giao dịch thanh toán online không hoàn tất trong 30 phút sẽ bị đóng và đơn hàng chưa xác nhận bị hủy.</li>
            <li>Việc hoàn tiền được thực hiện về phương thức thanh toán ban đầu hoặc tài khoản do người mua cung cấp; thời gian hoàn phụ thuộc vào cổng thanh toán và ngân hàng.</li>
            <li>Đơn thanh toán khi nhận hàng (COD) do người bán xác nhận hoàn tất sau khi đã thu đủ tiền.</li>
          </ul>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>5. Xác minh tài khoản</h3>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Người dùng có thể xác minh số điện thoại bằng mã OTP và xác minh danh tính bằng ảnh CMND/CCCD kèm ảnh chân dung.</li>
            <li>Tài khoản mới chưa xác minh có thể bị giới hạn số tin đăng mỗi ngày và bị hạn chế gửi số điện thoại, đường dẫn hoặc lời mời liên hệ ngoài nền tảng trong tin nhắn.</li>
            <li>Mỗi số điện thoại và mỗi số giấy tờ chỉ được dùng để xác minh cho một tài khoản. Cung cấp giấy tờ giả mạo sẽ bị khóa tài khoản.</li>
          </ul>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>6. Đánh giá và khiếu nại</h3>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Người mua và người bán chỉ được đánh giá nhau sau khi đơn hoàn tất, trong 14 ngày. Đánh giá phải trung thực; đánh giá vi phạm có thể bị ẩn.</li>
            <li>Người mua có thể gửi khiếu nại khi đơn đang giao, đã giao hoặc trong 7 ngày sau khi hoàn tất; người bán có thể khiếu nại khi đơn đang giao hoặc đã giao. Quy trình xử lý xem tại trang Giải quyết khiếu nại.</li>
            <li>Tất Tần Tật có thể tự động gắn cảnh báo lên tin nhắn có dấu hiệu lừa đảo (đòi đặt cọc trước, mời giao dịch ngoài sàn, hỏi mã OTP…) để bảo vệ người dùng.</li>
          </ul>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px 0' }}>7. Trợ lý AI viết tin</h3>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Nội dung bạn nhập khi dùng tính năng AI viết giúp mô tả có thể được gửi tới nhà cung cấp dịch vụ AI để tạo văn bản. Bạn chịu trách nhiệm đọc lại và chỉnh sửa cho đúng thực tế trước khi đăng.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
