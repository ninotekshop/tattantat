'use client';
import { Ic } from '../../components/Ic';
import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Copy, Image as ImageIcon, MapPin, MoreHorizontal, Send as SendIcon, Trash2, Undo2, Video, X, ShieldCheck, TriangleAlert, ArrowRight, Search, MessageSquare, ChevronLeft } from 'lucide-react';
import { MemberArea } from '../../components/MemberArea';
import { ApiError, memberRequest, uploadRequest } from '../../lib/api';
import type { WebSession } from '../../lib/auth';
import { mergeMessages, selectConversation } from '../../lib/chat-ui';

type Chat = { id: string; product_id: string; product_title: string; product_status: string; other_name: string; last_message: string | null; seller_id_is_me?: boolean; product_price?: string | null; product_price_mode?: string | null; product_address?: string | null; product_image?: string | null };
const priceText = (c: Chat) => c.product_price_mode === 'FREE' ? 'Miễn phí' : c.product_price_mode === 'CONTACT' || !c.product_price ? 'Liên hệ' : Number(c.product_price).toLocaleString('vi-VN') + ' đ';
function Thumb({ src, size }: { src?: string | null; size: number }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [src]);
  return src && !bad
    ? <img src={src} alt="" width={size} height={size} onError={() => setBad(true)} style={{ width: size, height: size, maxWidth: 'none', objectFit: 'cover', borderRadius: 8, flex: 'none', background: '#eee' }} />
    : <span style={{ width: size, height: size, borderRadius: 8, flex: 'none', background: '#eef2ef', display: 'inline-block' }} />;
}
type Attachment = { type: 'image' | 'video' | 'location'; url?: string | null; mime?: string; lat?: number; lng?: number; label?: string };
type Message = { id: string; sender_id: string; content: string; created_at: string; safety_flags?: string[] | null; kind?: string; attachments?: Attachment[] | null; recalled_at?: string | null; can_recall?: boolean };
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp', VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime';
const iconBtn: React.CSSProperties = { width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 999, border: 0, background: 'transparent', color: '#00a65a', cursor: 'pointer', padding: 0, flex: 'none' };
const mapsUrl = (a: Attachment) => `https://www.google.com/maps?q=${a.lat},${a.lng}`;
const isPlaceholder = (m: Message) => ['[Hình ảnh]', '[Video]', '[Vị trí]'].includes(m.content) || /^\[\d+ hình ảnh\]$/.test(m.content);

function ProgressRing({ percent, size = 44 }: { percent: number; size?: number }) {
  const r = (size - 6) / 2, c = 2 * Math.PI * r;
  return <span role="progressbar" aria-label="Đang tải lên" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.45)' }}>
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} style={{ transition: 'stroke-dashoffset .2s' }} />
    </svg>
    <span style={{ position: 'absolute', color: '#fff', fontSize: 11, fontWeight: 600 }}>{percent}%</span>
  </span>;
}

function Attachments({ m, onOpen }: { m: Message; onOpen: (url: string) => void }) {
  const list = m.attachments ?? [];
  if (!list.length) return null;
  return <div style={{ display: 'grid', gap: 6, marginBottom: 4, gridTemplateColumns: 'minmax(0, 1fr)' }}>
    {list.map((a, i) => {
      if (a.type === 'image') return a.url ? <img key={i} src={a.url} alt="Ảnh trong tin nhắn" loading="lazy" onClick={() => onOpen(a.url!)} style={{ display: 'block', maxWidth: '100%', maxHeight: 260, width: 'auto', height: 'auto', objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in', background: '#eee' }} /> : <em key={i} className="member-muted">Ảnh không còn khả dụng</em>;
      if (a.type === 'video') return a.url ? <video key={i} src={a.url} controls preload="metadata" playsInline style={{ maxWidth: 280, width: '100%', borderRadius: 8, background: '#000' }} /> : <em key={i} className="member-muted">Video không còn khả dụng</em>;
      if (a.type === 'location' && typeof a.lat === 'number' && typeof a.lng === 'number') {
        const d = 0.004, bbox = [a.lng - d, a.lat - d, a.lng + d, a.lat + d].join('%2C');
        return <div key={i} style={{ width: 260, maxWidth: '100%', border: '1px solid #dfe8e2', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
          <iframe title="Bản đồ vị trí" loading="lazy" style={{ border: 0, width: '100%', height: 140, display: 'block' }} src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${a.lat}%2C${a.lng}`} />
          <a href={mapsUrl(a)} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '6px 8px', fontSize: 13 }}><Ic i={MapPin}/>{a.label || 'Vị trí được chia sẻ'} · Mở Google Maps</a>
        </div>;
      }
      return null;
    })}
  </div>;
}
const FLAG_TEXT: Record<string, string> = { ADVANCE_PAYMENT: 'yêu cầu chuyển khoản/đặt cọc trước', OFF_PLATFORM: 'mời liên hệ ngoài Tất Tần Tật', PHONE: 'có số điện thoại', LINK: 'có đường link', BANK_ACCOUNT: 'có số tài khoản ngân hàng', OTP_REQUEST: 'hỏi mã OTP / thông tin cá nhân' };
type Pending = { key: string; chatId: string; content: string };

export default function MessagesPage() {
  return <Suspense fallback={<p>Đang tải hội thoại...</p>}><MemberArea>{session => <Messages session={session}/>}</MemberArea></Suspense>;
}

function Messages({ session }: { session: WebSession }) {
  const search = useSearchParams(), productId = search.get('product'), requestedChat = search.get('chat');
  const [chats, setChats] = useState<Chat[]>([]), [selected, setSelected] = useState('');
  const [filterQ, setFilterQ] = useState(''), [mobileList, setMobileList] = useState(!(productId || requestedChat));
  const [messages, setMessages] = useState<Message[]>([]), [content, setContent] = useState('');
  const [loadError, setLoadError] = useState(''), [sendError, setSendError] = useState('');
  const [loading, setLoading] = useState(true), [historyLoading, setHistoryLoading] = useState(false);
  const [sending, setSending] = useState(false), [uncertain, setUncertain] = useState(false), [reload, setReload] = useState(0);
  const pending = useRef<Pending | null>(null), sendingRef = useRef(false), history = useRef<HTMLDivElement>(null);
  const generation = useRef(0), sent = useRef<Message[]>([]);
  const [files, setFiles] = useState<File[]>([]), [previews, setPreviews] = useState<string[]>([]), [lightbox, setLightbox] = useState('');
  const [menu, setMenu] = useState<{ id: string; confirm?: 'recall' | 'hide' } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [place, setPlace] = useState<{ lat: number; lng: number; accuracy?: number; address?: string; lookup?: 'loading' | 'done' | 'failed' } | null>(null), [locBusy, setLocBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null), videoInput = useRef<HTMLInputElement>(null);
  useEffect(() => { const urls = files.map(f => URL.createObjectURL(f)); setPreviews(urls); return () => urls.forEach(u => URL.revokeObjectURL(u)); }, [files]);
  useEffect(() => { if (!lightbox) return; const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(''); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [lightbox]);

  function pickFiles(list: FileList | null) {
    const picked = Array.from(list ?? []);
    if (fileInput.current) fileInput.current.value = '';
    if (videoInput.current) videoInput.current.value = '';
    if (!picked.length) return;
    const next = [...files, ...picked];
    const videos = next.filter(f => f.type.startsWith('video/'));
    if (videos.length && next.length > 1) { setSendError('Mỗi tin nhắn chỉ gửi 1 video, không gửi kèm ảnh khác.'); return; }
    if (next.length > 5) { setSendError('Tối đa 5 ảnh mỗi tin nhắn.'); return; }
    const big = next.find(f => f.size > (f.type.startsWith('video/') ? 25 : 8) * 1024 * 1024);
    if (big) { setSendError(big.type.startsWith('video/') ? 'Video tối đa 25 MB.' : 'Mỗi ảnh tối đa 8 MB.'); return; }
    setSendError(''); setFiles(next);
  }
  async function sendMedia() {
    if (sendingRef.current || !selected || !files.length) return;
    sendingRef.current = true; setSending(true); setSendError(''); setProgress(0);
    const currentGeneration = generation.current;
    try {
      const fd = new FormData(); files.forEach(f => fd.append('files', f)); if (content.trim()) fd.set('caption', content.trim());
      const message = await uploadRequest<Message>('/chats/' + selected + '/media', fd, setProgress);
      if (generation.current !== currentGeneration) return;
      sent.current = mergeMessages(sent.current, [message]); setMessages(items => mergeMessages(items, [message]));
      setFiles([]); setContent('');
    } catch (e) { if (generation.current === currentGeneration) setSendError(e instanceof Error ? e.message : 'Không gửi được tệp.'); }
    finally { sendingRef.current = false; setSending(false); setProgress(null); }
  }
  async function recallMessage(m: Message) {
    if (!selected) return;
    setMenu(null); setSendError('');
    try {
      const updated = await memberRequest<Message>(`/chats/${selected}/messages/${m.id}/recall`, 'POST');
      sent.current = sent.current.map(x => x.id === m.id ? updated : x);
      setMessages(items => items.map(x => x.id === m.id ? updated : x));
    } catch (e) { setSendError(e instanceof Error ? e.message : 'Không thu hồi được tin nhắn.'); }
  }
  async function hideMessage(m: Message) {
    if (!selected) return;
    setMenu(null); setSendError('');
    try {
      await memberRequest(`/chats/${selected}/messages/${m.id}`, 'DELETE');
      sent.current = sent.current.filter(x => x.id !== m.id);
      setMessages(items => items.filter(x => x.id !== m.id));
    } catch (e) { setSendError(e instanceof Error ? e.message : 'Không xóa được tin nhắn.'); }
  }
  useEffect(() => { if (!menu) return; const close = () => setMenu(null); window.addEventListener('click', close); return () => window.removeEventListener('click', close); }, [menu]);
  function locate() {
    setSendError('');
    if (!navigator.geolocation) { setSendError('Trình duyệt không hỗ trợ định vị.'); return; }
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocBusy(false);
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setPlace({ lat, lng, accuracy: Math.round(accuracy), lookup: 'loading' });
        memberRequest<{ displayName: string }>(`/geo/reverse?lat=${lat}&lng=${lng}`)
          .then(r => setPlace(p => p && p.lat === lat && p.lng === lng ? { ...p, address: r.displayName, lookup: 'done' } : p))
          .catch(() => setPlace(p => p && p.lat === lat && p.lng === lng ? { ...p, lookup: 'failed' } : p));
      },
      () => { setLocBusy(false); setSendError('Không lấy được vị trí. Hãy cho phép trình duyệt truy cập vị trí rồi thử lại.'); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  async function sendPlace() {
    if (!place || sendingRef.current || !selected) return;
    sendingRef.current = true; setSending(true); setSendError('');
    const currentGeneration = generation.current;
    try {
      const message = await memberRequest<Message>('/chats/' + selected + '/location', 'POST', { lat: place.lat, lng: place.lng, label: place.address ? place.address.slice(0, 200) : undefined });
      if (generation.current !== currentGeneration) return;
      sent.current = mergeMessages(sent.current, [message]); setMessages(items => mergeMessages(items, [message])); setPlace(null);
    } catch (e) { if (generation.current === currentGeneration) setSendError(e instanceof Error ? e.message : 'Không gửi được vị trí.'); }
    finally { sendingRef.current = false; setSending(false); }
  }

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
    sent.current = []; setMessages([]); setSendError(''); setContent(''); setFiles([]); setPlace(null); pending.current = null; setUncertain(false);
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
    if (files.length) { await sendMedia(); return; }
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
  const kw = filterQ.trim().toLowerCase();
  const shownChats = kw ? chats.filter(c => [c.other_name, c.product_title].some(v => (v ?? '').toLowerCase().includes(kw))) : chats;
  return <>
        {loadError && <p role="alert">{loadError} <button disabled={sending || uncertain} onClick={() => setReload(v => v + 1)}>Tải lại</button></p>}
    {loading ? <p>Đang mở hội thoại...</p> : <div className={'msg-app' + (mobileList ? ' show-list' : '')}>
      <aside className="msg-list" aria-label="Hội thoại">
        <div className="msg-list-h"><h1>Tin nhắn</h1>
          <label className="msg-search"><Search size={16} /><input value={filterQ} onChange={e => setFilterQ(e.target.value)} placeholder="Tìm hội thoại…" aria-label="Tìm hội thoại" /></label></div>
        <div className="msg-items">
        {!chats.length && !loadError && <p className="msg-empty">Chưa có hội thoại. Mở tin đăng và chọn “Nhắn người bán”.</p>}
        {!!chats.length && !shownChats.length && <p className="msg-empty">Không có hội thoại nào khớp.</p>}
        {shownChats.map(c => <button key={c.id} className={'msg-item' + (selected === c.id ? ' on' : '')} disabled={sending || uncertain} aria-pressed={selected === c.id} onClick={() => { setSelected(c.id); setMobileList(false); }}>
          <span style={{ display: 'flex', gap: 8, alignItems: 'flex-start', textAlign: 'left' }}><Thumb src={c.product_image} size={44} /><span className="msg-txt"><strong>{c.other_name}</strong><small className="msg-prod">{c.product_title} · {priceText(c)}</small><small className="msg-last">{c.last_message?.slice(0, 70) || 'Chưa có tin nhắn'}</small></span></span>
        </button>)}
        </div>
      </aside>
      {!chat && <section className="msg-pane msg-none"><MessageSquare size={44} /><h2>Chọn một cuộc trò chuyện</h2><p>Nội dung trao đổi về từng tin đăng sẽ hiển thị ở đây.</p></section>}
      {chat && <section className="msg-pane">
        <div className="msg-head"><button type="button" className="msg-back" aria-label="Quay lại danh sách" onClick={() => setMobileList(true)}><ChevronLeft size={22} /></button><h2>{chat.other_name}</h2><a className="msg-prodlink" href={'/products/' + chat.product_id} title={chat.product_title}><span>{chat.product_title}</span><ArrowRight size={14} /></a></div>
        {chat.product_status !== 'ACTIVE' && <p className="member-muted">Tin không còn mở bán. Bạn vẫn có thể tiếp tục trao đổi tại đây.</p>}
        <p style={{ fontSize: 12, background: '#eef7f1', padding: '6px 10px', borderRadius: 8 }}><Ic i={ShieldCheck}/>Không chuyển khoản trước cho người lạ, không chia sẻ mã OTP/mật khẩu. Ưu tiên giao dịch có bảo vệ trong Tất Tần Tật.</p>
        <div ref={history} className="chat-history" role="log" aria-label="Lịch sử tin nhắn" aria-live="polite">
          {historyLoading ? <p>Đang tải tin nhắn...</p> : !messages.length && <p>Hãy gửi lời chào đầu tiên.</p>}
          {messages.map(m => {
            const mine = m.sender_id === session.user.id, recalled = !!m.recalled_at || m.kind === 'RECALLED', open = menu?.id === m.id;
            const menuBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: 13, color: '#222', whiteSpace: 'nowrap' };
            return <div key={m.id} className={'chat-bubble ' + (mine ? 'mine' : '')} style={{ position: 'relative' }}>
              {recalled ? <em style={{ color: '#777' }}>{mine ? 'Bạn đã thu hồi một tin nhắn' : 'Tin nhắn đã được thu hồi'}</em> : <>
            <Attachments m={m} onOpen={setLightbox} />
              {!(m.attachments?.length && isPlaceholder(m)) && m.content}
              {m.sender_id !== session.user.id && !!m.safety_flags?.length && <div role="alert" style={{ marginTop: 6, padding: '6px 8px', background: '#fff4e5', border: '1px solid #f5c98a', borderRadius: 8, fontSize: 12, color: '#8a4b00' }}><Ic i={TriangleAlert}/>Cẩn trọng: tin nhắn này {m.safety_flags.map(f => FLAG_TEXT[f]).filter(Boolean).join(', ')}. Đừng chuyển tiền trước hay cung cấp mã OTP; hãy thanh toán và nhận hàng qua Tất Tần Tật.</div>}
              </>}
              <button type="button" aria-label="Tùy chọn tin nhắn" title="Tùy chọn" aria-expanded={open} onClick={e => { e.stopPropagation(); setMenu(open ? null : { id: m.id }); }} style={{ position: 'absolute', top: 4, [mine ? 'left' : 'right']: -30, width: 24, height: 24, padding: 0, display: 'grid', placeItems: 'center', border: 0, borderRadius: '50%', background: open ? '#e3ebe6' : 'transparent', color: '#66756c', cursor: 'pointer', opacity: open ? 1 : .55 }}><MoreHorizontal size={16} /></button>
              {open && <div role="menu" onClick={e => e.stopPropagation()} style={{ position: 'absolute', zIndex: 20, top: 30, [mine ? 'right' : 'left']: 0, minWidth: 200, background: '#fff', border: '1px solid #dfe8e2', borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,.15)', padding: '4px 0' }}>
                {menu?.confirm ? <div style={{ padding: '8px 12px', fontSize: 13 }}>
                  {menu.confirm === 'recall' ? 'Thu hồi tin nhắn này với mọi người? Người kia sẽ không còn xem được nội dung.' : 'Xóa tin nhắn này ở phía bạn? Người kia vẫn thấy tin nhắn.'}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button type="button" className="member-primary" onClick={() => menu.confirm === 'recall' ? recallMessage(m) : hideMessage(m)}>{menu.confirm === 'recall' ? 'Thu hồi' : 'Xóa'}</button>
                    <button type="button" onClick={() => setMenu(null)}>Hủy</button>
                  </div>
                </div> : <>
                  {!recalled && m.content && !isPlaceholder(m) && <button type="button" role="menuitem" style={menuBtn} onClick={() => { void navigator.clipboard?.writeText(m.content).catch(() => undefined); setMenu(null); }}><Copy size={15} /> Sao chép</button>}
                  {mine && !recalled && m.can_recall && <button type="button" role="menuitem" style={menuBtn} onClick={() => setMenu({ id: m.id, confirm: 'recall' })}><Undo2 size={15} /> Thu hồi</button>}
                  <button type="button" role="menuitem" style={{ ...menuBtn, color: '#c0392b' }} onClick={() => setMenu({ id: m.id, confirm: 'hide' })}><Trash2 size={15} /> Xóa ở phía tôi</button>
                </>}
              </div>}
            <small>{new Date(m.created_at).toLocaleString('vi-VN')}</small>
          
            </div>;
          })}
        </div>
        {sendError && <p role="alert">{sendError}</p>}
        <form onSubmit={send}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', whiteSpace: 'nowrap', margin: '6px 0' }} aria-label="Câu trả lời nhanh">
            {(chat.seller_id_is_me ? ['Chào bạn, hàng vẫn còn nhé.', 'Bạn muốn xem hàng vào lúc nào?', 'Giá này đã là giá tốt nhất rồi bạn nhé.', 'Mình sẽ giao hàng qua đơn trên Tất Tần Tật.'] : ['Sản phẩm còn không bạn?', 'Bạn có thể bớt giá được không?', 'Sản phẩm có lỗi gì không bạn?', 'Mình đặt mua qua Tất Tần Tật được không?']).map(t => <button type="button" key={t} disabled={sending || uncertain} onClick={() => setContent(c => c ? c : t)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, border: '1px solid #cfe3d6', background: '#f4fbf6', cursor: 'pointer' }}>{t}</button>)}
          </div>
          {!!files.length && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '6px 0' }} aria-label="Tệp sắp gửi">
            {files.map((f, i) => <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', flex: 'none' }}>
              {f.type.startsWith('video/') ? <video src={previews[i]} muted style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, background: '#000' }} /> : <img src={previews[i]} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />}
              {progress !== null && <ProgressRing percent={progress} />}
              {progress === null && <button type="button" aria-label="Bỏ tệp này" title="Bỏ tệp này" onClick={() => setFiles(list => list.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, minWidth: 0, minHeight: 0, padding: 0, margin: 0, display: 'grid', placeItems: 'center', borderRadius: '50%', border: 0, background: 'rgba(0,0,0,.65)', color: '#fff', cursor: 'pointer', boxShadow: 'none' }}><X size={12} strokeWidth={3} /></button>}
            </div>)}
          </div>}
          {place && <div style={{ margin: '6px 0', padding: 8, border: '1px solid #f5c98a', background: '#fff8ec', borderRadius: 8, fontSize: 13 }}>
            <strong><Ic i={MapPin}/>Sắp gửi vị trí hiện tại của bạn</strong><br />
            Tọa độ: {place.lat.toFixed(5)}, {place.lng.toFixed(5)}{place.accuracy ? ` (sai số khoảng ${place.accuracy} m)` : ''}<br />
            {place.lookup === 'loading' && <em>Đang tra địa chỉ…</em>}
            {place.lookup === 'done' && place.address && <>Địa chỉ: {place.address}<br /></>}
            {place.lookup === 'failed' && <em>Chưa tra được địa chỉ, sẽ chỉ gửi tọa độ.<br /></em>}
            Chỉ chia sẻ vị trí ở nơi công cộng khi hẹn gặp giao dịch, tránh gửi địa chỉ nhà riêng cho người lạ.
            <div style={{ marginTop: 6, display: 'flex', gap: 8 }}><button type="button" className="member-primary" disabled={sending} onClick={sendPlace}>Gửi vị trí này</button><button type="button" disabled={sending} onClick={() => setPlace(null)}>Hủy</button></div>
          </div>}
          <input ref={fileInput} type="file" accept={IMAGE_ACCEPT} multiple style={{ display: 'none' }} tabIndex={-1} aria-hidden onChange={e => pickFiles(e.target.files)} />
          <input ref={videoInput} type="file" accept={VIDEO_ACCEPT} style={{ display: 'none' }} tabIndex={-1} aria-hidden onChange={e => pickFiles(e.target.files)} />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, margin: '6px 0' }}>
            <button type="button" title="Gửi ảnh" aria-label="Gửi ảnh" disabled={sending || uncertain} onClick={() => fileInput.current?.click()} style={iconBtn}><ImageIcon size={22} /></button>
            <button type="button" title="Gửi video" aria-label="Gửi video" disabled={sending || uncertain} onClick={() => videoInput.current?.click()} style={iconBtn}><Video size={22} /></button>
            <button type="button" title="Gửi vị trí" aria-label="Gửi vị trí" disabled={sending || uncertain || locBusy} onClick={locate} style={iconBtn}><MapPin size={22} /></button>
            <textarea aria-label={files.length ? 'Chú thích' : 'Tin nhắn'} value={content} onChange={e => setContent(e.target.value)} maxLength={2000} rows={1} required={!files.length} disabled={sending || uncertain} placeholder={files.length ? 'Thêm chú thích…' : 'Nhập tin nhắn…'} style={{ flex: 1, minWidth: 0, minHeight: 38, maxHeight: 110, resize: 'none', borderRadius: 19, padding: '8px 14px', margin: '0 4px' }} />
            <button aria-label={uncertain ? 'Thử gửi lại' : 'Gửi'} title={uncertain ? 'Thử gửi lại' : 'Gửi'} disabled={sending || (!content.trim() && !files.length)} style={{ ...iconBtn, color: '#00a65a' }}><SendIcon size={22} /></button>
          </div>
        </form>
      </section>}
    </div>}
  {lightbox && <div role="dialog" aria-label="Xem ảnh" onClick={() => setLightbox('')} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 1000, display: 'grid', placeItems: 'center', cursor: 'zoom-out' }}><img src={lightbox} alt="Ảnh phóng to" style={{ maxWidth: '94vw', maxHeight: '92vh', objectFit: 'contain' }} /></div>}
  </>;
}
