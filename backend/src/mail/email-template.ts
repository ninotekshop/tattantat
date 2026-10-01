/**
 * Mẫu email dùng chung của Tất Tần Tật: bố cục bảng + CSS inline để hiển thị tốt trên Gmail, Outlook, Apple Mail và điện thoại.
 * Ảnh (logo, linh vật) lấy từ PUBLIC_WEB_URL/email/*.png.
 */
export type Tone = 'brand' | 'success' | 'info' | 'warning' | 'danger';

export interface EmailSpec {
  /** Dòng xem trước hiển thị cạnh tiêu đề trong hộp thư. */
  preheader?: string;
  tone?: Tone;
  /** Emoji lớn trên đầu thư. */
  icon?: string;
  /** Nhãn nhỏ phía trên tiêu đề, ví dụ "ĐƠN HÀNG". */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  greeting?: string;
  paragraphs: string[];
  /** Ô nổi bật (số tiền, mã đơn...). */
  highlight?: { label: string; value: string };
  details?: [string, string][];
  cta?: { label: string; url: string };
  secondary?: { label: string; url: string };
  tips?: { title?: string; items: string[] };
  /** Lý do người dùng nhận thư, đặt ở chân thư. */
  footerNote?: string;
  /** Hiện liên kết "Cài đặt thông báo" ở chân thư. */
  managePrefs?: boolean;
}

const TONES: Record<Tone, { from: string; to: string; solid: string; soft: string; ink: string }> = {
  brand:   { from: '#00a65a', to: '#14c47a', solid: '#00a65a', soft: '#e8f8f0', ink: '#0b6b3f' },
  success: { from: '#00a65a', to: '#22c55e', solid: '#00a65a', soft: '#e8f8f0', ink: '#0b6b3f' },
  info:    { from: '#0ea5e9', to: '#2563eb', solid: '#2563eb', soft: '#eaf2ff', ink: '#1e40af' },
  warning: { from: '#f59e0b', to: '#f97316', solid: '#ea580c', soft: '#fff4e5', ink: '#9a3412' },
  danger:  { from: '#f43f5e', to: '#e11d48', solid: '#e11d48', soft: '#ffecef', ink: '#9f1239' },
};

export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const nl2br = (s: string) => esc(s).replace(/\n/g, '<br>');

export function siteUrl(): string {
  return (process.env.PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || 'https://tattantat.vn').replace(/\/$/, '');
}
/** Biến đường dẫn tương đối (/orders) thành địa chỉ đầy đủ. */
export const absUrl = (path: string) => /^https?:\/\//.test(path) ? path : siteUrl() + (path.startsWith('/') ? path : '/' + path);

const FONT = `'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif`;

function button(label: string, url: string, color: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 0"><tr>
<td align="center" bgcolor="${color}" style="border-radius:999px;background:${color};box-shadow:0 8px 20px ${color}55">
<a href="${esc(url)}" target="_blank" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;letter-spacing:.2px">${esc(label)} &rarr;</a>
</td></tr></table>`;
}

export function renderEmail(spec: EmailSpec): { html: string; text: string } {
  const t = TONES[spec.tone ?? 'brand'];
  const site = siteUrl();
  const year = new Date().getFullYear();
  const support = 'hotro@tattantat.vn';

  const paragraphs = spec.paragraphs.filter(Boolean).map(p => `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.65;color:#334155">${nl2br(p)}</p>`).join('');

  const highlight = spec.highlight ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px"><tr>
<td style="background:${t.soft};border-radius:16px;padding:18px 20px;text-align:center;border:1px dashed ${t.solid}66">
<div style="font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${t.ink}">${esc(spec.highlight.label)}</div>
<div style="font-family:${FONT};font-size:28px;font-weight:800;color:${t.solid};margin-top:4px">${esc(spec.highlight.value)}</div>
</td></tr></table>` : '';

  const details = spec.details?.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;border:1px solid #e6eef0;border-radius:14px;border-collapse:separate;overflow:hidden">
${spec.details.map(([k, v], i) => `<tr><td style="padding:12px 16px;font-family:${FONT};font-size:14px;color:#64748b;background:${i % 2 ? '#ffffff' : '#f8fbfa'};width:42%">${esc(k)}</td><td style="padding:12px 16px;font-family:${FONT};font-size:14px;color:#0f172a;font-weight:600;background:${i % 2 ? '#ffffff' : '#f8fbfa'};text-align:right">${esc(v)}</td></tr>`).join('')}
</table>` : '';

  const cta = spec.cta ? `<div style="text-align:center;margin:10px 0 6px">${button(spec.cta.label, spec.cta.url, t.solid)}</div>` : '';
  const secondary = spec.secondary ? `<p style="margin:14px 0 0;text-align:center;font-family:${FONT};font-size:13px"><a href="${esc(spec.secondary.url)}" style="color:${t.solid};text-decoration:underline">${esc(spec.secondary.label)}</a></p>` : '';

  const tips = spec.tips?.items.length ? `<tr><td style="padding:0 32px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f6faf8;border-radius:16px;padding:18px 20px">
<div style="font-family:${FONT};font-size:14px;font-weight:700;color:#0f172a;margin-bottom:8px">${esc(spec.tips.title ?? 'Mẹo nhỏ dành cho bạn')}</div>
${spec.tips.items.map(i => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0"><tr><td valign="top" style="padding:1px 10px 0 0"><span style="display:inline-block;width:20px;height:20px;line-height:20px;border-radius:50%;background:${t.solid};color:#fff;font-size:12px;text-align:center;font-family:${FONT}">&#10003;</span></td><td style="font-family:${FONT};font-size:14px;line-height:1.55;color:#475569">${esc(i)}</td></tr></table>`).join('')}
</td></tr></table></td></tr>` : '';

  const html = `<!doctype html>
<html lang="vi" xmlns="http://www.w3.org/1999/xhtml"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${esc(spec.title)}</title>
<style>
@media (max-width:620px){ .ttt-wrap{width:100%!important} .ttt-pad{padding-left:20px!important;padding-right:20px!important} .ttt-title{font-size:23px!important} }
a{color:${t.solid}}
</style></head>
<body style="margin:0;padding:0;background:#edf3f0;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(spec.preheader ?? spec.subtitle ?? spec.title)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#edf3f0" style="background:#edf3f0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" class="ttt-wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px">

<!-- Logo -->
<tr><td style="padding:0 6px 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="left"><a href="${site}" target="_blank"><img src="${site}/email/logo.png" width="168" alt="Tất Tần Tật" style="display:block;width:168px;height:auto;border:0"></a></td>
<td align="right" style="font-family:${FONT};font-size:12px;color:#64748b">Mua bán dễ dàng · Kết nối mọi người</td>
</tr></table></td></tr>

<!-- Hero -->
<tr><td bgcolor="${t.solid}" style="background:${t.solid};background-image:linear-gradient(135deg,${t.from} 0%,${t.to} 100%);border-radius:24px 24px 0 0;padding:34px 32px 30px" class="ttt-pad" align="center">
${spec.icon ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" width="76" height="76" bgcolor="#ffffff" style="width:76px;height:76px;border-radius:50%;background:#ffffff;font-size:38px;line-height:76px;text-align:center;box-shadow:0 10px 24px rgba(0,0,0,.18)">${spec.icon}</td></tr></table>` : ''}
${spec.eyebrow ? `<div style="margin-top:18px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.85)">${esc(spec.eyebrow)}</div>` : ''}
<h1 class="ttt-title" style="margin:8px 0 0;font-family:${FONT};font-size:27px;line-height:1.3;font-weight:800;color:#ffffff">${esc(spec.title)}</h1>
${spec.subtitle ? `<p style="margin:10px 0 0;font-family:${FONT};font-size:15px;line-height:1.55;color:rgba(255,255,255,.92)">${esc(spec.subtitle)}</p>` : ''}
</td></tr>

<!-- Nội dung -->
<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:30px 32px 10px" class="ttt-pad">
${spec.greeting ? `<p style="margin:0 0 14px;font-family:${FONT};font-size:16px;color:#0f172a">${esc(spec.greeting)}</p>` : ''}
${paragraphs}${highlight}${details}${cta}${secondary}
<div style="height:22px;line-height:22px">&nbsp;</div>
</td></tr>
${tips ? `<tr><td bgcolor="#ffffff" style="background:#ffffff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${tips}</table></td></tr>` : ''}

<!-- Trợ lý TTT -->
<tr><td bgcolor="#ffffff" style="background:#ffffff;border-radius:0 0 24px 24px;padding:16px 32px 30px" class="ttt-pad">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #edf2f0"><tr>
<td width="84" valign="middle" style="padding-top:18px"><img src="${site}/email/mascot.png" width="72" height="72" alt="Trợ lý TTT" style="display:block;width:72px;height:72px;border:0"></td>
<td valign="middle" style="padding-top:18px;font-family:${FONT};font-size:14px;line-height:1.55;color:#475569"><b style="color:#0f172a">Cần giúp đỡ?</b> Trợ lý TTT luôn sẵn sàng trên <a href="${site}" style="color:#00a65a;font-weight:700;text-decoration:none">tattantat.vn</a>, hoặc gửi thư cho chúng tôi qua <a href="mailto:${support}" style="color:#00a65a;text-decoration:none">${support}</a>.</td>
</tr></table>
</td></tr>

<!-- Chân thư -->
<tr><td align="center" style="padding:24px 16px 6px;font-family:${FONT};font-size:13px;color:#64748b">
<a href="${site}" style="color:#334155;text-decoration:none;font-weight:600">Trang chủ</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${site}/sell" style="color:#334155;text-decoration:none;font-weight:600">Đăng tin</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${site}/safety-guide" style="color:#334155;text-decoration:none;font-weight:600">Mua bán an toàn</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${site}/orders" style="color:#334155;text-decoration:none;font-weight:600">Đơn hàng</a>
</td></tr>
<tr><td align="center" style="padding:8px 24px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:#94a3b8">
${spec.footerNote ? esc(spec.footerNote) + '<br>' : ''}${spec.managePrefs ? `Bạn có thể chọn loại email muốn nhận trong <a href="${site}/account?section=prefs" style="color:#64748b">Cài đặt thông báo</a>.<br>` : ''}
Tất Tần Tật không bao giờ yêu cầu bạn cung cấp mật khẩu hay mã OTP qua email.<br>
&copy; ${year} Tất Tần Tật · ${support}
</td></tr>

</table></td></tr></table>
</body></html>`;

  const lines = [
    spec.title.toUpperCase(),
    spec.subtitle ?? '',
    '',
    spec.greeting ?? '',
    ...spec.paragraphs,
    spec.highlight ? `${spec.highlight.label}: ${spec.highlight.value}` : '',
    ...(spec.details ?? []).map(([k, v]) => `- ${k}: ${v}`),
    spec.cta ? `\n${spec.cta.label}: ${spec.cta.url}` : '',
    ...(spec.tips?.items ?? []).map(i => `* ${i}`),
    '',
    '— Tất Tần Tật · ' + site,
    `Hỗ trợ: ${support}`,
    spec.managePrefs ? `Cài đặt thông báo: ${site}/account?section=prefs` : '',
  ];
  return { html, text: lines.filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n').trim() };
}
