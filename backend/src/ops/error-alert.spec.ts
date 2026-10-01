import { BadRequestException } from '@nestjs/common';
import { ErrorAlertFilter } from './error-alert.filter';

const host = (res: any, req: any = { method: 'GET', originalUrl: '/x?a=1' }) => ({ switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }) }) as any;
const mkRes = () => { const r: any = { headersSent: false, status: jest.fn(() => r), json: jest.fn(() => r) }; return r; };

describe('ErrorAlertFilter', () => {
  afterEach(() => { delete process.env.ALERT_WEBHOOK_URL; jest.restoreAllMocks(); });
  it('keeps 4xx bodies and never alerts for them', () => {
    const f = new ErrorAlertFilter(); const res = mkRes(); const spy = jest.spyOn(global, 'fetch' as never).mockResolvedValue({} as never); process.env.ALERT_WEBHOOK_URL = 'http://x';
    f.catch(new BadRequestException('sai rồi'), host(res));
    expect(res.status).toHaveBeenCalledWith(400); expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'sai rồi' })); expect(spy).not.toHaveBeenCalled();
  });
  it('hides internals on 500 and alerts once per 5 minutes', () => {
    const f = new ErrorAlertFilter(); jest.spyOn((f as any).log, 'error').mockImplementation(() => undefined);
    const spy = jest.spyOn(global, 'fetch' as never).mockResolvedValue({} as never); process.env.ALERT_WEBHOOK_URL = 'http://x';
    const res = mkRes(); f.catch(new Error('secret db password leak'), host(res)); f.catch(new Error('secret db password leak'), host(mkRes()));
    expect(res.status).toHaveBeenCalledWith(500); expect(JSON.stringify(res.json.mock.calls)).not.toContain('secret'); expect(spy).toHaveBeenCalledTimes(1);
  });
});
