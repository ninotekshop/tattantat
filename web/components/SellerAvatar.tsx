/* eslint-disable @next/next/no-img-element */
/** Avatar tròn nhỏ của người bán trên thẻ tin đăng; không có ảnh thì hiện chữ cái đầu. */
export function SellerAvatar({ name, url, size = 20 }: { name: string; url?: string | null; size?: number }) {
  const box = { width: size, height: size, borderRadius: '50%', flex: 'none' as const, marginTop: 0 };
  return url
    ? <img src={url} alt="" width={size} height={size} loading="lazy" style={{ ...box, objectFit: 'cover', background: '#e6f6ed' }} />
    : <span aria-hidden style={{ ...box, display: 'grid', placeItems: 'center', background: '#e6f6ed', color: '#007c4b', fontWeight: 800, fontSize: Math.round(size * 0.5) }}>{(name || '?').slice(0, 1).toUpperCase()}</span>;
}
