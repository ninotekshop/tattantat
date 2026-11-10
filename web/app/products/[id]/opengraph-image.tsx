import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import path from 'path';
import { getBaseUrl } from '../../../lib/api';

export const alt = 'Tin đăng trên Tất Tần Tật';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const site = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://tattantat.vn').replace(/\/$/, '');
const abs = (u?: string | null) => (u ? (/^https?:\/\//i.test(u) ? u : site() + (u.startsWith('/') ? '' : '/') + u) : null);

async function product(id: string): Promise<{ title?: string; images?: string[]; imageUrl?: string } | null> {
  const bases = [getBaseUrl(), `${site()}/api/v1`].map(b => b.replace(/\/$/, '')).filter((b, i, a) => /^https?:\/\//i.test(b) && a.indexOf(b) === i);
  for (const base of bases) {
    try {
      const r = await fetch(`${base}/products/${encodeURIComponent(id)}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(2500) });
      if (!r.ok) continue;
      const j = await r.json();
      if (j?.success) return j.data;
    } catch { /* thử địa chỉ tiếp theo */ }
  }
  return null;
}

/** Tải ảnh (theo cả chuyển hướng) rồi nhúng dạng data URL để bộ dựng ảnh không phải tự tải. */
async function dataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: 'follow' });
    if (!r.ok) return null;
    const type = (r.headers.get('content-type') || '').split(';')[0];
    if (!/^image\/(jpeg|png|webp)$/.test(type)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (!buf.length || buf.length > 6 * 1024 * 1024) return null;
    return `data:${type};base64,${buf.toString('base64')}`;
  } catch { return null; }
}

let logoCache: string | null = null;
async function logo(): Promise<string | null> {
  if (logoCache) return logoCache;
  try {
    const buf = await readFile(path.join(process.cwd(), 'public', 'logo.png'));
    logoCache = `data:image/png;base64,${buf.toString('base64')}`;
    return logoCache;
  } catch { return dataUrl(`${site()}/logo.png`); }
}

/** Ảnh chia sẻ 1200x630: ảnh sản phẩm bên trái, logo Tất Tần Tật bên phải. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const p = await product((await params).id);
  const [photo, logoSrc] = await Promise.all([dataUrl(abs(p?.images?.[0] ?? p?.imageUrl)), logo()]);
  const logoNode = logoSrc ? <img src={logoSrc} width={440} height={126} style={{ objectFit: 'contain' }} alt="" /> : null;

  if (!photo) {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#e6f7ee,#ffffff)' }}>{logoNode}</div>,
      size,
    );
  }
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', background: '#ffffff' }}>
      <div style={{ width: 690, height: 630, display: 'flex', background: '#f1f5f3' }}>
        <img src={photo} width={690} height={630} style={{ objectFit: 'cover' }} alt="" />
      </div>
      <div style={{ width: 510, height: 630, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#e6f7ee 0%,#ffffff 70%)', borderLeft: '10px solid #0a9a61' }}>
        {logoNode}
        <div style={{ display: 'flex', marginTop: 28, width: 120, height: 6, borderRadius: 3, background: '#0a9a61' }} />
      </div>
    </div>,
    size,
  );
}
