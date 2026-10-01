import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { renderEmail, siteUrl } from './email-template';

const nowVN = () => new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    // Biến môi trường luôn là chuỗi: phải đổi sang số, nếu không cổng 465 sẽ không bật SSL và gửi thất bại.
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587) || 587;
    const user = this.config.get<string>('SMTP_USER') ?? this.config.get<string>('SMTP_USERNAME');
    const pass = this.config.get<string>('SMTP_PASS') ?? this.config.get<string>('SMTP_PASSWORD');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP MailService initialized with host ${host}`);
    } else {
      this.logger.warn('SMTP credentials not fully provided. MailService running in logger mode.');
    }
  }

  private get fromAddress(): string {
    const full = this.config.get<string>('MAIL_FROM');
    if (full) return full;
    const name = this.config.get<string>('MAIL_FROM_NAME', 'Tất Tần Tật');
    const address = this.config.get<string>('MAIL_FROM_ADDRESS', 'hotro@tattantat.vn');
    return `"${name}" <${address}>`;
  }

  /** Thư chúc mừng khi đăng ký tài khoản thành công. */
  async sendWelcomeEmail(toEmail: string, name: string): Promise<void> {
    const site = siteUrl();
    const { html, text } = renderEmail({
      tone: 'brand', icon: '🎉', eyebrow: 'Chào mừng thành viên mới',
      title: 'Chúc mừng bạn đã gia nhập Tất Tần Tật!',
      subtitle: 'Tài khoản của bạn đã sẵn sàng. Mua bán dễ dàng, kết nối mọi người.',
      preheader: `Chào ${name}, tài khoản Tất Tần Tật của bạn đã được tạo thành công.`,
      greeting: `Xin chào ${name},`,
      paragraphs: [
        'Cảm ơn bạn đã đăng ký tài khoản trên Tất Tần Tật. Từ hôm nay, bạn có thể đăng tin miễn phí, tìm món đồ ưng ý và giao dịch an toàn với hàng nghìn người mua bán khác.',
      ],
      details: [['Tài khoản', toEmail], ['Ngày tham gia', nowVN()]],
      cta: { label: 'Đăng tin đầu tiên', url: `${site}/sell` },
      secondary: { label: 'Hoặc khám phá các tin đăng mới nhất', url: site },
      tips: { title: 'Bắt đầu thật nhanh với 3 bước', items: [
        'Hoàn thiện hồ sơ và ảnh đại diện để người mua tin tưởng hơn.',
        'Xác minh số điện thoại để nhận huy hiệu “Đã xác thực”.',
        'Thanh toán qua mã QR trên Tất Tần Tật — tiền được giữ an toàn đến khi bạn nhận hàng.',
      ] },
      footerNote: 'Bạn nhận được email này vì vừa đăng ký tài khoản trên Tất Tần Tật.',
    });
    await this.sendMail(toEmail, `🎉 Chào mừng ${name} đến với Tất Tần Tật!`, html, text);
  }

  private lastLoginMail = new Map<string, number>();
  /** Thư thông báo đăng nhập thành công (tối đa 1 thư / 30 phút / tài khoản để tránh làm phiền). */
  async sendLoginEmail(toEmail: string, name: string, method: string): Promise<void> {
    const key = toEmail.toLowerCase(), now = Date.now();
    if (now - (this.lastLoginMail.get(key) ?? 0) < 30 * 60_000) return;
    this.lastLoginMail.set(key, now);
    if (this.lastLoginMail.size > 20_000) this.lastLoginMail.clear();
    const site = siteUrl();
    const { html, text } = renderEmail({
      tone: 'success', icon: '👋', eyebrow: 'Đăng nhập thành công',
      title: `Chào mừng ${name} quay lại!`,
      subtitle: 'Bạn vừa đăng nhập vào Tất Tần Tật. Chúc bạn mua bán thuận lợi hôm nay.',
      preheader: `Tài khoản của bạn vừa đăng nhập lúc ${nowVN()}.`,
      greeting: `Xin chào ${name},`,
      paragraphs: ['Chúng tôi ghi nhận một lượt đăng nhập thành công vào tài khoản của bạn với thông tin bên dưới.'],
      details: [['Thời gian', nowVN()], ['Phương thức', method], ['Tài khoản', toEmail]],
      cta: { label: 'Vào Tất Tần Tật', url: site },
      tips: { title: 'Không phải bạn đăng nhập?', items: [
        'Đổi mật khẩu ngay trong mục Tài khoản → Hồ sơ.',
        `Liên hệ hotro@tattantat.vn để được hỗ trợ khóa tài khoản tạm thời.`,
      ] },
      footerNote: 'Email bảo mật này được gửi tự động mỗi khi tài khoản của bạn đăng nhập.',
    });
    await this.sendMail(toEmail, '👋 Đăng nhập thành công vào Tất Tần Tật', html, text);
  }

  async sendPasswordResetEmail(toEmail: string, name: string, resetToken: string): Promise<void> {
    const resetUrl = `${siteUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const { html, text } = renderEmail({
      tone: 'info', icon: '🔐', eyebrow: 'Bảo mật tài khoản',
      title: 'Đặt lại mật khẩu của bạn',
      subtitle: 'Liên kết chỉ có hiệu lực trong 15 phút.',
      greeting: `Xin chào ${name},`,
      paragraphs: ['Tất Tần Tật nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Bấm nút bên dưới để tạo mật khẩu mới.'],
      cta: { label: 'Đặt lại mật khẩu', url: resetUrl },
      tips: { title: 'Lưu ý an toàn', items: [
        'Nếu bạn không yêu cầu, hãy bỏ qua email này — mật khẩu hiện tại vẫn giữ nguyên.',
        'Không chuyển tiếp email này cho bất kỳ ai.',
      ] },
      footerNote: 'Email này được gửi vì có yêu cầu đặt lại mật khẩu cho tài khoản của bạn.',
    });
    await this.sendMail(toEmail, '🔐 Đặt lại mật khẩu Tất Tần Tật', html, text);
  }

  /** Xác nhận mật khẩu đã được thay đổi. */
  async sendPasswordChangedEmail(toEmail: string, name: string): Promise<void> {
    const site = siteUrl();
    const { html, text } = renderEmail({
      tone: 'success', icon: '✅', eyebrow: 'Bảo mật tài khoản',
      title: 'Mật khẩu đã được thay đổi',
      subtitle: 'Từ giờ hãy dùng mật khẩu mới để đăng nhập.',
      greeting: `Xin chào ${name},`,
      paragraphs: ['Mật khẩu tài khoản Tất Tần Tật của bạn vừa được đặt lại thành công.'],
      details: [['Thời gian', nowVN()], ['Tài khoản', toEmail]],
      cta: { label: 'Đăng nhập ngay', url: `${site}/login` },
      tips: { title: 'Không phải bạn thực hiện?', items: [
        'Dùng chức năng Quên mật khẩu để lấy lại quyền truy cập ngay.',
        'Liên hệ hotro@tattantat.vn để được hỗ trợ khóa tài khoản tạm thời.',
      ] },
      footerNote: 'Email bảo mật này được gửi tự động khi mật khẩu tài khoản của bạn thay đổi.',
    });
    await this.sendMail(toEmail, '✅ Mật khẩu Tất Tần Tật đã được thay đổi', html, text);
  }

  private async sendMail(to: string, subject: string, html: string, text: string): Promise<void> {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to,
          subject,
          html,
          text,
        });
        this.logger.log(`Sent email "${subject}" to ${to}`);
      } catch (err: any) {
        this.logger.error(`Gửi email thất bại tới ${to}: ${err.message}`);
      }
    } else {
      this.logger.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
    }
  }
}
