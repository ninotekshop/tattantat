'use client';

import { useId, useRef, type ReactNode } from 'react';
import { X, Apple, Play } from 'lucide-react';

export function InfoDialog({ title, children, trigger, className = '', ariaLabel }: {
  title: string; children: ReactNode; trigger: ReactNode; className?: string; ariaLabel?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return <>
    <button type="button" className={className} aria-label={ariaLabel} onClick={() => dialog.current?.showModal()}>{trigger}</button>
    <dialog ref={dialog} className="info-dialog" aria-labelledby={titleId} onClick={event => {
      if (event.target === event.currentTarget) dialog.current?.close();
    }}>
      <div className="dialog-header"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" aria-label="Đóng" onClick={() => dialog.current?.close()}><X size={22} /></button></div>
      <div className="dialog-body">{children}</div>
      <button className="primary-action" type="button" onClick={() => dialog.current?.close()}>Đã hiểu</button>
    </dialog>
  </>;
}

export function StoreBadges() {
  return <div className="store-badges">
    <InfoDialog className="store-badge" title="Ứng dụng Tất Tần Tật" trigger={<><Apple size={23} fill="currentColor" /><span><small>Download on the</small>App Store</span></>}>
      <p>Ứng dụng iOS chưa được phát hành trên App Store. Bạn có thể tiếp tục mua bán ngay trên website.</p>
    </InfoDialog>
    <a className="store-badge" href="https://play.google.com/store/apps/details?id=com.tattantat.app&pcampaignid=web_share" target="_blank" rel="noopener noreferrer" aria-label="Tải ứng dụng trên Google Play"><Play size={23} className="play-icon" fill="currentColor" /><span><small>GET IT ON</small>Google Play</span></a>
  </div>;
}
