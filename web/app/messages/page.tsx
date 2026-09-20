'use client';
import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { MemberArea } from '../../components/MemberArea';
import { ApiError, memberRequest } from '../../lib/api';
import type { WebSession } from '../../lib/auth';
import { mergeMessages, selectConversation } from '../../lib/chat-ui';

type Chat = { id: string; product_id: string; product_title: string; product_status: string; other_name: string; last_message: string | null };
type Message = { id: string; sender_id: string; content: string; created_at: string };
type Pending = { key: string; chatId: string; content: string };

export default function MessagesPage() {
  return <Suspense fallback={<p>Đang tải hội thoại...</p>}><MemberArea>{session => <Messages session={session}/>}</MemberArea></Suspense>;
}

function Messages({ session }: { session: WebSession }) {
  const search = useSearchParams(), productId = search.get('product'), requestedChat = search.get('chat');
  const [chats, setChats] = useState<Chat[]>([]), [selected, setSelected] = useState('');
  const [messages, setMessages] = useState<Message[]>([]), [content, setContent] = useState('');
  const [loadError, setLoadError] = useState(''), [sendError, setSendError] = useState('');
  const [loading, setLoading] = useState(true), [historyLoading, setHistoryLoading] = useState(false);
  const [sending, setSending] = useState(false), [uncertain, setUncertain] = useState(false), [reload, setReload] = useState(0);
  const pending = useRef<Pending | null>(null), sendingRef = useRef(false), history = useRef<HTMLDivElement>(null);
  const generation = useRef(0), sent = useRef<Message[]>([]);

  useEffect(() => {
    let active = true, running = false, first = true, opened = '';
    setLoading(true); setSelected(''); setMessages([]); setLoadError('');
    const load = async () => {
      if (running || (!first && document.hidden)) return;
      running = true;
      try {
        if (first && productId) opened = (await memberRequest<{ id: string }>('/chats', 'POST', { productId })).id;
        const items = await memberRequest<Chat[]>('/chats');
        if (!active) return;
        if (first) {
          const choice = selectConversation(items, opened || requestedChat);
          if (!choice && (opened || requestedChat)) throw new Error('Hội thoại không tồn tại hoặc bạn không có quyền truy cập.');
          setSelected(choice);
        }
        first = false; setChats(items); setLoadError('');
      } catch (e) { if (active) setLoadError(e instanceof Error ? e.message : 'Không tải được hội thoại.'); }
      finally { running = false; if (active) setLoading(false); }
    };
    void load();
    const timer = setInterval(() => { void load(); }, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [productId, requestedChat, reload]);

  useEffect(() => {
    const currentGeneration = ++generation.current;
    sent.current = []; setMessages([]); setSendError(''); setContent(''); pending.current = null; setUncertain(false);
    if (!selected) return;
    let active = true, running = false;
    setHistoryLoading(true);
    const load = async () => {
      if (running || document.hidden) return;
      running = true;
      try {
        const items = await memberRequest<Message[]>('/chats/' + selected + '/messages');
        if (active && generation.current === currentGeneration) setMessages(mergeMessages(items, sent.current));
      } catch (e) { if (active) setLoadError(e instanceof Error ? e.message : 'Không tải được lịch sử.'); }
      finally { running = false; if (active) setHistoryLoading(false); }
    };
    void load();
    const timer = setInterval(() => { void load(); }, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [selected]);

  useEffect(() => {
    if (history.current) history.current.scrollTop = history.current.scrollHeight;
  }, [messages.length]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (sendingRef.current || !content.trim() || !selected) return;
    sendingRef.current = true; setSending(true); setSendError('');
    const currentGeneration = generation.current;
    pending.current ??= { key: crypto.randomUUID(), chatId: selected, content: content.trim() };
    const request = pending.current;
    try {
      const message = await memberRequest<Message>('/chats/' + request.chatId + '/messages', 'POST', { content: request.content }, request.key);
      if (generation.current !== currentGeneration) return;
      sent.current = mergeMessages(sent.current, [message]);
      setMessages(items => mergeMessages(items, [message]));
      setContent(''); pending.current = null; setUncertain(false);
    } catch (e) {
      if (generation.current !== currentGeneration) return;
      if (e instanceof ApiError && [400, 401, 403, 404, 429].includes(e.status)) {
        pending.current = null; setUncertain(false); setSendError(e.message);
      } else {
        setUncertain(true); setSendError('Chưa xác nhận được kết quả gửi. Bấm “Thử gửi lại” để kiểm tra cùng tin nhắn, không tạo bản sao.');
      }
    } finally { sendingRef.current = false; setSending(false); }
  }

  const chat = chats.find(c => c.id === selected);
  return <>
    <h1>Tin nhắn</h1><p className="member-muted">Tự cập nhật mỗi 5 giây khi trang đang mở.</p>
    {loadError && <p role="alert">{loadError} <button disabled={sending || uncertain} onClick={() => setReload(v => v + 1)}>Tải lại</button></p>}
    {loading ? <p>Đang mở hội thoại...</p> : <div className="chat-layout">
      <aside className="chat-list" aria-label="Hội thoại">
        {!chats.length && !loadError && <p>Chưa có hội thoại. Mở tin đăng và chọn “Nhắn người bán”.</p>}
        {chats.map(c => <button key={c.id} disabled={sending || uncertain} aria-pressed={selected === c.id} onClick={() => setSelected(c.id)}>
          <strong>{c.other_name}</strong><br/><small>{c.product_title}</small><br/><small>{c.last_message?.slice(0, 70) || 'Chưa có tin nhắn'}</small>
        </button>)}
      </aside>
      {chat && <section className="member-card">
        <h2>{chat.other_name}</h2><p>{chat.product_title}</p>
        {chat.product_status === 'ACTIVE' ? <a href={'/products/' + chat.product_id}>Xem tin đăng</a> : <p className="member-muted">Tin không còn mở bán. Bạn vẫn có thể tiếp tục trao đổi tại đây.</p>}
        <div ref={history} className="chat-history" role="log" aria-label="Lịch sử tin nhắn" aria-live="polite">
          {historyLoading ? <p>Đang tải tin nhắn...</p> : !messages.length && <p>Hãy gửi lời chào đầu tiên.</p>}
          {messages.map(m => <div key={m.id} className={'chat-bubble ' + (m.sender_id === session.user.id ? 'mine' : '')}>
            {m.content}<small>{new Date(m.created_at).toLocaleString('vi-VN')}</small>
          </div>)}
        </div>
        {sendError && <p role="alert">{sendError}</p>}
        <form onSubmit={send}>
          <label>Tin nhắn<textarea value={content} onChange={e => setContent(e.target.value)} maxLength={2000} required disabled={sending || uncertain} placeholder="Chào bạn, sản phẩm này còn không?"/></label>
          <button className="member-primary" disabled={sending || !content.trim()}>{sending ? 'Đang gửi...' : uncertain ? 'Thử gửi lại' : 'Gửi tin nhắn'}</button>
        </form>
      </section>}
    </div>}
  </>;
}
