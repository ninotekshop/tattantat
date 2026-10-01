import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * Ghi log chi tiết mọi lỗi 5xx và (tùy chọn) báo về ALERT_WEBHOOK_URL (Slack/Discord/Telegram-proxy... nhận JSON {text}).
 * Cùng một lỗi chỉ báo tối đa 1 lần/5 phút để không tràn kênh cảnh báo. 4xx không bị báo.
 */
@Catch()
export class ErrorAlertFilter implements ExceptionFilter {
  private readonly log = new Logger('Errors');
  private readonly recent = new Map<string, number>();

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp(); const res = ctx.getResponse(); const req = ctx.getRequest();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    if (status >= 500) this.report(exception, req);
    if (res.headersSent) return;
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const message = typeof body === 'string' ? body : (body as { message?: unknown }).message ?? exception.message;
      const errorCode = typeof body === 'object' && body ? (body as { errorCode?: string }).errorCode ?? null : null;
      res.status(status).json({ success: false, message, errorCode, statusCode: status });
    } else {
      res.status(500).json({ success: false, message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.', errorCode: 'INTERNAL_ERROR', statusCode: 500 });
    }
  }

  private report(exception: unknown, req: { method?: string; originalUrl?: string; user?: { id?: string } }) {
    const err = exception instanceof Error ? exception : new Error(String(exception));
    this.log.error(`${req?.method} ${req?.originalUrl} (user=${req?.user?.id ?? '-'}): ${err.message}`, err.stack);
    const url = process.env.ALERT_WEBHOOK_URL; if (!url) return;
    const key = createHash('sha1').update(`${req?.method}${(req?.originalUrl ?? '').split('?')[0]}${err.message}`).digest('hex');
    const now = Date.now(); if ((this.recent.get(key) ?? 0) > now - 300_000) return;
    if (this.recent.size > 500) this.recent.clear(); this.recent.set(key, now);
    const text = `Tất Tần Tật lỗi 5xx\n${req?.method} ${(req?.originalUrl ?? '').split('?')[0]}\n${err.message.slice(0, 300)}`;
    void fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, content: text }), signal: AbortSignal.timeout(5000) }).catch(() => undefined);
  }
}
