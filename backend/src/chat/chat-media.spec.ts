import { BadRequestException } from '@nestjs/common';
import { ChatService, sniffMedia } from './chat.service';

const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(20)]);
const mp4 = Buffer.concat([Buffer.alloc(4), Buffer.from('ftypisom'), Buffer.alloc(20)]);

describe('chat media', () => {
  it('recognises real images/videos and rejects spoofed types', () => {
    expect(sniffMedia({ buffer: jpg, mimetype: 'image/jpeg' })).toBe('IMAGE');
    expect(sniffMedia({ buffer: mp4, mimetype: 'video/mp4' })).toBe('VIDEO');
    expect(sniffMedia({ buffer: Buffer.from('<?php echo 1; ?>........'), mimetype: 'image/jpeg' })).toBeNull();
    expect(sniffMedia({ buffer: jpg, mimetype: 'video/mp4' })).toBeNull();
  });

  const svc = () => { const s = new ChatService({ query: jest.fn(async () => ({ rows: [{}] })) } as any, { create: jest.fn() } as any, undefined, undefined, { uploadChatMedia: jest.fn(async () => 'k') } as any); (s as any).mediaReady = true; return s; };

  it('validates location coordinates', async () => {
    await expect(svc().sendLocation('u', 'c', { lat: 200, lng: 10 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc().sendLocation('u', 'c', { lat: NaN as any, lng: 10 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('limits attachments per message', async () => {
    const img = { buffer: jpg, mimetype: 'image/jpeg' };
    await expect(svc().sendMedia('u', 'c', [], '')).rejects.toThrow('chọn');
    await expect(svc().sendMedia('u', 'c', Array(6).fill(img))).rejects.toThrow('Tối đa 5');
    await expect(svc().sendMedia('u', 'c', [img, { buffer: mp4, mimetype: 'video/mp4' }])).rejects.toThrow('1 video');
    await expect(svc().sendMedia('u', 'c', [{ buffer: Buffer.from('xxxxxxxxxxxxxxxx'), mimetype: 'image/png' }])).rejects.toThrow('hợp lệ');
  });
});
