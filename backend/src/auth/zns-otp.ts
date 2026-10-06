// Gửi mã OTP qua Zalo (ZNS) bằng API eTelecom: POST {BASE_URL}.Zalo/SendZNS, Authorization: Bearer <api_key>.
// Biến môi trường: ETELECOM_BASE_URL, ETELECOM_API_KEY, ZNS_OA_ID, ZNS_OTP_TEMPLATE_ID, (tuỳ chọn) ZNS_OTP_PARAM (mặc định "otp"), ZNS_MODE=development để thử.

export const znsOtpEnabled = () => !!(process.env.ETELECOM_BASE_URL && process.env.ETELECOM_API_KEY && process.env.ZNS_OA_ID && process.env.ZNS_OTP_TEMPLATE_ID);

/** 0901234567 / +84901234567 → 84901234567 (định dạng Zalo yêu cầu). */
export const toZaloPhone = (p: string) => { const d = p.replace(/[^\d]/g, ''); return d.startsWith('84') ? d : d.startsWith('0') ? '84' + d.slice(1) : '84' + d; };

export async function sendZnsOtp(phone: string, otp: string) {
  const base = (process.env.ETELECOM_BASE_URL || '').replace(/\/+$/, '');
  const url = base.endsWith('.Zalo') ? `${base}/SendZNS` : `${base}.Zalo/SendZNS`;
  const body: Record<string, unknown> = {
    oa_id: Number(process.env.ZNS_OA_ID),
    template_id: Number(process.env.ZNS_OTP_TEMPLATE_ID),
    phone: toZaloPhone(phone),
    template_data: { [process.env.ZNS_OTP_PARAM || 'otp']: otp },
    tracking_id: `otp-${Date.now()}`,
  };
  if (process.env.ZNS_MODE === 'development') body.mode = 'development';
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.ETELECOM_API_KEY}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const text = await r.text();
  if (!r.ok) { console.warn('[zns otp] gửi thất bại', r.status, text.slice(0, 300)); throw new Error('Không gửi được mã qua Zalo'); }
  let j: { status?: string } = {};
  try { j = JSON.parse(text); } catch { /* bỏ qua */ }
  if (j.status === 'N') { console.warn('[zns otp] bị từ chối', text.slice(0, 300)); throw new Error('Số này chưa nhận được tin Zalo. Hãy dùng số đã đăng ký Zalo.'); }
}
