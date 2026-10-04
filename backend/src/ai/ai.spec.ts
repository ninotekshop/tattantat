import { HttpException } from '@nestjs/common';
import { AiService, parseDraft, scrubContact } from './ai.service';

const mk = (n: number) => { const db: any = { query: jest.fn(async (sql: string) => sql.startsWith('SELECT') ? { rows: [{ n }] } : { rows: [] }) }; return { svc: new AiService(db), db }; };
describe('AiService', () => {
  it('scrubs phone numbers and links from model output', () => {
    expect(scrubContact('Gọi 0912 345 678 hoặc xem https://x.vn/a nhé')).not.toMatch(/0912|https/);
  });
  it('mock draft needs some input and uses no contact info', async () => {
    const { svc } = mk(0);
    await expect(svc.draftListing('u', {})).rejects.toThrow('tiêu đề');
    const r = await svc.draftListing('u', { title: 'iPhone 13', condition: 'LIKE_NEW', notes: 'Pin 90%, liên hệ 0912345678' });
    expect(r.data.provider).toBe('mock'); expect(r.data.description).toContain('như mới'); expect(r.data.description).not.toContain('0912345678'); expect(r.data.remaining).toBe(19);
  });
  it('enforces the daily limit', async () => { await expect(mk(20).svc.draftListing('u', { title: 'x' })).rejects.toBeInstanceOf(HttpException); });
});

describe('support chat', () => {
  it('answers from FAQ in mock mode and rejects empty input', async () => {
    const { svc } = mk(0);
    await expect(svc.supportChat('u', [])).rejects.toThrow('câu hỏi');
    const r = await svc.supportChat('u', [{ role: 'user', content: 'Thanh toán QR thế nào?' }]);
    expect(r.data.provider).toBe('mock'); expect(r.data.reply).toContain('QR'); expect(r.data.remaining).toBe(39);
  });
  it('enforces the chat limit', async () => { await expect(mk(40).svc.supportChat('u', [{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(HttpException); });
});

describe('parseDraft', () => {
  it('đọc định dạng TITLE/DESCRIPTION nhiều dòng', () => {
    expect(parseDraft('TITLE: Loa Harman Kardon\nDESCRIPTION:\nDòng 1\n\n- Ý 2')).toEqual({ title: 'Loa Harman Kardon', description: 'Dòng 1\n\n- Ý 2' });
  });
  it('đọc JSON có xuống dòng thô trong chuỗi và JSON bọc markdown', () => {
    expect(parseDraft('```json\n{"title":"A","description":"x\ny"}\n```')).toEqual({ title: 'A', description: 'x\ny' });
  });
  it('trả null khi không đọc được', () => { expect(parseDraft('xin lỗi, không viết được')).toBeNull(); });
});
