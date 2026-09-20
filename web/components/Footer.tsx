import Link from 'next/link';
import { Heart, MessageCircle, ShieldCheck, UsersRound } from 'lucide-react';
import { InfoDialog, StoreBadges } from './InfoDialog';

export function Footer() {
  return <footer className="footer" id="support">
    <div className="container">
      <div className="footer-grid">
        <Link href="/" className="footer-brand">
          <img src="/TatTanTat_icon.svg" alt="" width="58" height="64" />
          <span><strong>Tất Tần Tật</strong><small>Mua bán mọi thứ, gần bạn</small></span>
        </Link>
        <div className="footer-col"><h2>Về chúng tôi</h2>
          <InfoDialog title="Về Tất Tần Tật" trigger="Giới thiệu"><p>Tất Tần Tật kết nối người mua và người bán, từ đồ điện tử, đồ gia dụng đến xe cộ và bất động sản. Tìm món đồ bạn cần hoặc đăng tin để món đồ cũ có một hành trình mới.</p></InfoDialog>
          <InfoDialog title="Điều khoản sử dụng" trigger="Điều khoản sử dụng"><p>Đăng thông tin trung thực, sử dụng ảnh bạn có quyền chia sẻ và không đăng sản phẩm bị cấm. Không mạo danh hoặc chia sẻ dữ liệu cá nhân của người khác. Chính sách chính thức sẽ được công bố trước khi mở dịch vụ thương mại.</p></InfoDialog>
          <InfoDialog title="Bảo vệ thông tin cá nhân" trigger="Chính sách bảo mật"><p>Không đăng công khai mật khẩu, mã OTP, giấy tờ tùy thân hoặc thông tin ngân hàng. Chỉ cung cấp thông tin cần thiết cho giao dịch. Chính sách xử lý dữ liệu chính thức sẽ được công bố khi dịch vụ ra mắt.</p></InfoDialog>
        </div>
        <div className="footer-col"><h2>Hỗ trợ</h2>
          <InfoDialog title="Trung tâm trợ giúp" trigger="Trung tâm trợ giúp"><p>Dùng thanh tìm kiếm hoặc chọn danh mục để khám phá tin đăng. Nhấn vào sản phẩm để xem chi tiết. Bạn cần có tài khoản để sử dụng các tính năng cá nhân.</p></InfoDialog>
          <InfoDialog title="Liên hệ" trigger="Liên hệ"><p>Kênh liên hệ công khai đang được cập nhật. Nếu đang tham gia thử nghiệm, vui lòng liên hệ người quản trị đã cung cấp tài khoản cho bạn.</p></InfoDialog>
          <InfoDialog title="Báo cáo vi phạm" trigger="Báo cáo vi phạm"><p>Lưu lại đường dẫn tin đăng và nội dung cần báo cáo, sau đó gửi cho quản trị viên thử nghiệm. Tính năng gửi báo cáo trực tiếp trên web đang được hoàn thiện.</p></InfoDialog>
        </div>
        <div className="footer-col"><h2>Kết nối với chúng tôi</h2><div className="footer-social">
          <InfoDialog title="Cộng đồng Tất Tần Tật" ariaLabel="Cộng đồng Tất Tần Tật" trigger={<UsersRound size={19} />} className="social-button"><p>Các kênh cộng đồng chính thức sẽ được cập nhật khi ra mắt.</p></InfoDialog>
          <Link className="social-button" href="/messages" aria-label="Tin nhắn"><MessageCircle size={19} /></Link>
          <InfoDialog title="Giao dịch an toàn" ariaLabel="Giao dịch an toàn" trigger={<ShieldCheck size={19} />} className="social-button"><p>Không cung cấp mã OTP, không truy cập liên kết thanh toán lạ và luôn kiểm tra hàng trước khi xác nhận nhận hàng.</p></InfoDialog>
        </div></div>
        <div className="footer-col"><h2>Tải ứng dụng</h2><StoreBadges /></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Tất Tần Tật. Tất cả quyền được bảo lưu.</span><span>Mua bán mọi thứ, gần bạn <Heart size={14} fill="#ff6376" color="#ff6376" /></span></div>
    </div>
  </footer>;
}
