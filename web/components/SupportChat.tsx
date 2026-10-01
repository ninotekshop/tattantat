'use client';
import { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import { memberRequest } from '../lib/api';
import { readSession } from '../lib/auth';
import './support-chat.css';

type Msg = { role: 'user' | 'assistant'; content: string };
const HELLO: Msg = { role: 'assistant', content: 'Xin chào! Mình là trợ lý Tất Tần Tật. Bạn cần hỗ trợ về đăng tin, đặt hàng, thanh toán QR hay hoàn tiền? Cứ hỏi mình nhé.' };
const SUGGEST = ['Thanh toán QR hoạt động thế nào?', 'Tiền được giữ an toàn ra sao?', 'Cách đăng tin?', 'Gặp tin lừa đảo thì làm gì?'];

export function SupportChat() {
  const [open, setOpen] = useState(false), [logged, setLogged] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([HELLO]), [text, setText] = useState(''), [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null), box = useRef<HTMLElement>(null), fab = useRef<HTMLButtonElement>(null);
  // Bấm chuột ra ngoài bảng hoặc nhấn Esc thì đóng bảng chat.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (box.current?.contains(t) || fab.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  useEffect(() => { setLogged(!!readSession()); }, [open]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy, open]);

  async function send(q: string) {
    const content = q.trim(); if (!content || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', content }];
    setMsgs(next); setText(''); setBusy(true);
    try {
      const r = await memberRequest<{ reply: string }>('/ai/support-chat', 'POST', { messages: next.slice(-10) });
      setMsgs([...next, { role: 'assistant', content: r.reply }]);
    } catch (e) { setMsgs([...next, { role: 'assistant', content: e instanceof Error ? e.message : 'Chưa trả lời được lúc này, bạn thử lại sau nhé.' }]); }
    finally { setBusy(false); }
  }

  return <>
    <button ref={fab} type="button" className={'sc-fab' + (open ? ' is-open' : '')} aria-label={open ? 'Đóng trợ lý hỗ trợ' : 'Mở trợ lý hỗ trợ'} aria-expanded={open} onClick={() => setOpen(o => !o)}>
      <img src="/chatbot-shipper.png" alt="" width={64} height={64}/>
      {open && <span className="sc-fab-x" aria-hidden="true"><X size={14}/></span>}
    </button>
    {open && <section ref={box} className="sc-box" role="dialog" aria-label="Trợ lý hỗ trợ khách hàng">
      <div className="sc-head">
        <span className="sc-title"><img src="/chatbot-shipper.png" alt="" width={32} height={32}/> Trợ lý Tất Tần Tật</span>
        <button type="button" className="sc-close" aria-label="Đóng bảng chat" title="Đóng" onClick={() => setOpen(false)}><X size={20}/></button>
      </div>
      {!logged ? <div className="sc-login"><p>Vui lòng đăng nhập để chat với trợ lý hỗ trợ.</p><a href="/login">Đăng nhập</a></div> : <>
        <div className="sc-list">
          {msgs.map((m, i) => <div key={i} className={'sc-m ' + m.role}>{m.content}</div>)}
          {busy && <div className="sc-m assistant sc-typing">Đang trả lời…</div>}
          {msgs.length === 1 && <div className="sc-sug">{SUGGEST.map(s => <button key={s} type="button" onClick={() => void send(s)}>{s}</button>)}</div>}
          <div ref={end}/>
        </div>
        <form onSubmit={e => { e.preventDefault(); void send(text); }}>
          <input value={text} onChange={e => setText(e.target.value)} maxLength={1000} placeholder="Nhập câu hỏi…" aria-label="Câu hỏi"/>
          <button type="submit" disabled={busy || !text.trim()} aria-label="Gửi"><Send size={18}/></button>
        </form>
      </>}
    </section>}
  </>;
}
