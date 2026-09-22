import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT', 587);
    const user = this.config.get<string>('SMTP_USERNAME');
    const pass = this.config.get<string>('SMTP_PASSWORD');

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
    const name = this.config.get<string>('MAIL_FROM_NAME', 'Tất Tần Tật');
    const address = this.config.get<string>('MAIL_FROM_ADDRESS', 'hotro@tattantat.vn');
    return `"${name}" <${address}>`;
  }

  async sendWelcomeEmail(toEmail: string, name: string): Promise<void> {
    const subject = 'Chào mừng bạn đến với Tất Tần Tật! 🎉';
    const appUrl = this.config.get<string>('APP_URL', 'https://www.tattantat.vn');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #00a65a; margin: 0; font-size: 24px;">Tất Tần Tật</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Mua bán dễ dàng – Kết nối mọi người</p>
        </div>
        <p style="font-size: 16px; color: #1e293b;">Xin chào <strong>${name}</strong>,</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">Chúc mừng bạn đã đăng ký tài khoản Tất Tần Tật thành công!</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">Từ bây giờ, bạn có thể khám phá, mua bán và kết nối thuận tiện hơn trên Tất Tần Tật:</p>
        <ul style="font-size: 14px; color: #475569; line-height: 1.8;">
          <li>Đăng tin mua bán miễn phí</li>
          <li>Lưu tin đăng yêu thích</li>
          <li>Quản lý bài đăng của tôi</li>
          <li>Nhắn tin và giao dịch an toàn</li>
        </ul>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${appUrl}" style="background-color: #00a65a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 999px; font-weight: bold; font-size: 15px; display: inline-block;">Khám phá Tất Tần Tật ngay</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Tất Tần Tật · hotro@tattantat.vn</p>
      </div>
    `;

    const text = `
Xin chào ${name},

Chúc mừng bạn đã đăng ký tài khoản Tất Tần Tật thành công!

Từ bây giờ, bạn có thể khám phá, mua bán và kết nối thuận tiện hơn trên Tất Tần Tật.

Khám phá Tất Tần Tật: ${appUrl}

Tất Tần Tật
hotro@tattantat.vn
    `;

    await this.sendMail(toEmail, subject, html, text);
  }

  async sendPasswordResetEmail(toEmail: string, name: string, resetToken: string): Promise<void> {
    const subject = 'Đặt lại mật khẩu Tất Tần Tật';
    const appUrl = this.config.get<string>('APP_URL', 'https://www.tattantat.vn');
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #00a65a; margin: 0; font-size: 24px;">Tất Tần Tật</h1>
        </div>
        <p style="font-size: 16px; color: #1e293b;">Xin chào <strong>${name}</strong>,</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">Tất Tần Tật nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #00a65a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 999px; font-weight: bold; font-size: 15px; display: inline-block;">ĐẶT LẠI MẬT KHẨU</a>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Liên kết này sẽ hết hạn sau 15 phút. Nếu bạn không thực hiện yêu cầu này, bạn có thể an tâm bỏ qua email này.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Tất Tần Tật · hotro@tattantat.vn</p>
      </div>
    `;

    const text = `
Xin chào ${name},

Tất Tần Tật nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
Đặt lại mật khẩu: ${resetUrl}

Liên kết hết hạn sau 15 phút.

Tất Tần Tật
hotro@tattantat.vn
    `;

    await this.sendMail(toEmail, subject, html, text);
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
        this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      }
    } else {
      this.logger.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
    }
  }
}
