import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

import { renderEmail } from '../mail/email-template';
import { notificationEmail } from '../mail/notification-email';

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
  render(title: string, content: string, link: string | null, type = '', name?: string | null): { subject: string; html: string; text: string } {
    const { html, text } = renderEmail(notificationEmail(type, title, content, link, name));
    return { subject: title.slice(0, 120), html, text };
  }
  async send(userId: string, to: string, title: string, content: string, link: string | null, type = '', name?: string | null): Promise<boolean> {
    const tx = this.tx; if (!tx || !to) return false;
    if (!this.withinLimit(userId)) return false;
    const m = this.render(title, content, link, type, name);
    try { await tx.sendMail({ from: process.env.MAIL_FROM, to, subject: m.subject, text: m.text, html: m.html }); return true; }
    catch (e) { this.log.warn('Gửi email lỗi: ' + (e instanceof Error ? e.message : String(e))); return false; }
  }
}
