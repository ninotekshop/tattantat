import { __resetSharpForTest, optimizeImage } from './image-processor';

describe('optimizeImage', () => {
  afterEach(() => __resetSharpForTest(undefined));
  it('returns the original when sharp is unavailable', async () => {
    __resetSharpForTest(null);
    const f = { buffer: Buffer.from('abc'), mimetype: 'image/jpeg' };
    expect(await optimizeImage(f)).toBe(f);
  });
  it('re-encodes with rotate+resize and keeps mime; falls back on error', async () => {
    const calls: string[] = [];
    const chain: any = { rotate: () => { calls.push('rotate'); return chain; }, resize: (o: any) => { calls.push('resize' + o.width); return chain; }, jpeg: () => { calls.push('jpeg'); return chain; }, toBuffer: async () => Buffer.from('a') };
    __resetSharpForTest(() => chain);
    const big = { buffer: Buffer.alloc(5000), mimetype: 'image/jpeg' };
    const out = await optimizeImage(big);
    expect(calls).toEqual(['rotate', 'resize1600', 'jpeg']); expect(out.buffer.length).toBe(1); expect(out.mimetype).toBe('image/jpeg');
    __resetSharpForTest(() => { throw new Error('bad'); });
    expect(await optimizeImage(big)).toBe(big);
  });
});
