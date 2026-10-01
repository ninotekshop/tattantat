import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Gửi email qua SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM). Chưa cấu hình thì bỏ qua, không lỗi. */
@Injectable()
export class MailerService {
  private readonly log = new Logger('Mailer');
  private transport?: Transporter | null;
  private sentByUser = new Map<string, number[]>();

  get enabled(): boolean { return !!(process.env.SMTP_HOST && process.env.MAIL_FROM); }
  private get tx(): Transporter | null {
    if (this.transport !== undefined) return this.transport;
    if (!this.enabled) { this.transport = null; return null; }
    this.transport = createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: Number(process.env.SMTP_PORT ?? 587) === 465, auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined });
    return this.transport;
  }
  /** Tối đa 10 email / người dùng / giờ để tránh spam khi có nhiều sự kiện dồn dập. */
  private withinLimit(key: string): boolean {
    const now = Date.now(); const list = (this.sentByUser.get(key) ?? []).filter(t => t > now - 3_600_000);
    if (list.length >= 10) { this.sentByUser.set(key, list); return false; }
    list.push(now); this.sentByUser.set(key, list); if (this.sentByUser.size > 50_000) this.sentByUser.clear(); return true;
  }
  render(title: string, content: string, link: string | null): { subject: string; html: string; text: string } {
    const site = (process.env.PUBLIC_WEB_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
    const url = link && site ? site + link : null;
    return {
      subject: title.slice(0, 120),
      text: `${title}\n\n${content}${url ? `\n\nXem chi tiết: ${url}` : ''}\n\n— Tất Tần Tật\nBạn có thể tắt email này trong Tài khoản → Cài đặt thông báo.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2 style="color:#00a65a">${esc(title)}</h2><p style="font-size:15px;line-height:1.6">${esc(content).replace(/\n/g, '<br>')}</p>${url ? `<p><a href="${esc(url)}" style="background:#00a65a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Xem chi tiết</a></p>` : ''}<hr style="border:none;border-top:1px solid #e3ebe6"><p style="font-size:12px;color:#71817b">Tất Tần Tật — Bạn có thể tắt email này trong Tài khoản → Cài đặt thông báo.</p></div>`,
    };
  }
  async send(userId: string, to: string, title: string, content: string, link: string | null): Promise<boolean> {
    const tx = this.tx; if (!tx || !to) return false;
    if (!this.withinLimit(userId)) return false;
    const m = this.render(title, content, link);
    try { await tx.sendMail({ from: process.env.MAIL_FROM, to, subject: m.subject, text: m.text, html: m.html }); return true; }
    catch (e) { this.log.warn('Gửi email lỗi: ' + (e instanceof Error ? e.message : String(e))); return false; }
  }
}
