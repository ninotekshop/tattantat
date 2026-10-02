'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

/** Thông điệp có dạng lỗi/cảnh báo (cần hiện popup giữa màn hình) hay thông báo thành công (toast nhỏ). */
export function isErrorMessage(msg: string) {
  if (/^(đã|thành công)/i.test(msg.trim())) return false;
  return /(không|lỗi|thất bại|hết hạn|vui lòng|quá lớn|chỉ quản trị|chưa |sai |trùng|từ chối|hãy thử lại|error|failed)/i.test(msg);
}

/** Popup lỗi hiển thị chính giữa màn hình. */
export function ErrorDialog({ message, onClose, title = 'Có lỗi xảy ra' }: { message: string | null | undefined; onClose: () => void; title?: string }) {
  useEffect(() => {
    if (!message) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [message, onClose]);
  if (!message || typeof document === 'undefined') return null;
  return createPortal(
    <div role="alertdialog" aria-modal="true" aria-label={title} onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '24px 24px 20px', width: 'min(420px, 100%)', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,.3)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 999, background: '#fef2f2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><AlertTriangle size={28} /></div>
        <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#0f172a' }}>{title}</h3>
        <p style={{ margin: '0 0 18px', fontSize: 14.5, color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message}</p>
        <button type="button" autoFocus onClick={onClose} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Đã hiểu</button>
      </div>
    </div>, document.body);
}
