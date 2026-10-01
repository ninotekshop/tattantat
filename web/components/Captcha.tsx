'use client';
import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { memberRequest } from '../lib/api';

export type CaptchaValue = { token: string; answer: string };

/** Ô nhập mã captcha chống spam. `resetKey` đổi giá trị để tải mã mới (sau khi gửi form). */
export function Captcha({ value, onChange, resetKey = 0 }: { value: CaptchaValue; onChange: (v: CaptchaValue) => void; resetKey?: number }) {
  const [image, setImage] = useState(''); const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    setFailed(false);
    try { const c = await memberRequest<{ token: string; image: string }>('/me/verification/captcha'); setImage(c.image); onChange({ token: c.token, answer: '' }); }
    catch { setFailed(true); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [load, resetKey]);
  return <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
    {image ? <img src={image} alt="Mã captcha" width={150} height={50} style={{ borderRadius: 8, border: '1px solid #dce6e0' }} /> : <span style={{ width: 150, height: 50, display: 'grid', placeItems: 'center', fontSize: 12, color: '#71817b', border: '1px dashed #dce6e0', borderRadius: 8 }}>{failed ? 'Không tải được mã' : 'Đang tải…'}</span>}
    <button type="button" className="bl-btn sm" onClick={() => void load()} title="Đổi mã khác" aria-label="Đổi mã khác"><RefreshCw size={14} /></button>
    <input value={value.answer} onChange={e => onChange({ ...value, answer: e.target.value.toUpperCase() })} maxLength={5} autoComplete="off" placeholder="Nhập mã trong ảnh" aria-label="Mã captcha" style={{ padding: '10px 12px', border: '1px solid #dce6e0', borderRadius: 8, fontSize: 14, width: 170, letterSpacing: 2, textTransform: 'uppercase' }} />
  </div>;
}
