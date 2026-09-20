'use client';
import { useRef, useState } from 'react';
import { Camera, Film, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { ListingMedia, uploadListingMedia } from '../../lib/listings';

async function prepareImage(file: File, square: boolean): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const width = square ? side : bitmap.width, height = square ? side : bitmap.height;
    const ratio = Math.min(1, 1800 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, square ? (bitmap.width-side)/2 : 0, square ? (bitmap.height-side)/2 : 0, width, height, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve,reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Không thể xử lý ảnh.')), 'image/jpeg', 0.85));
    return new File([blob], file.name.replace(/\.[^.]+$/, '')+'.jpg', {type:'image/jpeg'});
  } finally { bitmap.close(); }
}

export function MediaPicker({ listingId, images, videos, media, disabled, onAdd, onOrder, onRemove, onBusy }: {
  listingId: string; images: string[]; videos: string[]; media: ListingMedia[]; disabled: boolean;
  onAdd: (item: ListingMedia) => void; onOrder: (kind:'images'|'videos', ids:string[])=>void;
  onRemove: (item:ListingMedia)=>Promise<void>; onBusy: (busy:boolean)=>void;
}) {
  const input = useRef<HTMLInputElement>(null), videoInput = useRef<HTMLInputElement>(null);
  const [error,setError] = useState(''), [progress,setProgress] = useState<number|null>(null);
  const [square,setSquare] = useState(false), [preview,setPreview] = useState<ListingMedia|null>(null);
  const [pending,setPending] = useState<File[]>([]), [previewUrl,setPreviewUrl] = useState('');
  const [uploadKind,setUploadKind] = useState<'images'|'videos'>('images');
  const busy = progress !== null;
  function pick(files: FileList|null, kind:'images'|'videos') {
    setError('');
    const selection = Array.from(files??[]);
    if (!selection.length) return;
    const count = kind === 'images' ? images.length : videos.length;
    if (count+selection.length > (kind === 'images' ? 20 : 3)) { setError(kind === 'images' ? 'Tối đa 20 ảnh.' : 'Tối đa 3 video.'); return; }
    for (const file of selection) {
      if (!(kind === 'images' ? ['image/jpeg','image/png','image/webp'] : ['video/mp4','video/webm']).includes(file.type)) { setError('Chỉ hỗ trợ JPG, PNG, WEBP và video MP4, WEBM.'); return; }
      if (!file.size || file.size > (kind === 'images' ? 10 : 50)*1024*1024) { setError(`${file.name}: giới hạn ${kind === 'images' ? 10 : 50} MB/tệp.`); return; }
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadKind(kind); setPending(selection); setPreviewUrl(URL.createObjectURL(selection[0])); onBusy(true);
  }
  function clearPending() { if (previewUrl) URL.revokeObjectURL(previewUrl); setPending([]); setPreviewUrl(''); onBusy(false); }
  async function upload() {
    setProgress(0); setError('');
    try {
      for (const file of pending) onAdd(await uploadListingMedia(listingId,uploadKind,uploadKind==='images'?await prepareImage(file,square):file,setProgress));
    } catch (error) { setError(error instanceof Error ? error.message : 'Tải tệp thất bại.'); }
    finally {clearPending();setProgress(null);}
  }
  async function remove(item:ListingMedia) { onBusy(true); setError(''); try { await onRemove(item); } catch(error) { setError(error instanceof Error ? error.message : 'Không thể xóa tệp.'); } finally { onBusy(false); } }
  return <div className="lf-media-picker">
    <div className="lf-callout"><Camera size={22}/><div><strong>Ảnh đẹp giúp tin của bạn nổi bật</strong><p>Tối đa 20 ảnh, 3 video. Ảnh đầu tiên là ảnh bìa; dùng mũi tên để sắp xếp.</p></div></div>
    <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event=>{pick(event.target.files,'images');event.target.value='';}} />
    <input ref={videoInput} hidden type="file" accept="video/mp4,video/webm" multiple onChange={event=>{pick(event.target.files,'videos');event.target.value='';}} />
    <div className="lf-media-actions"><button type="button" className="lf-secondary" disabled={disabled||busy||pending.length>0} onClick={()=>input.current?.click()}><Camera size={18}/>Thêm ảnh ({images.length}/20)</button><button type="button" className="lf-secondary" disabled={disabled||busy||pending.length>0} onClick={()=>videoInput.current?.click()}><Film size={18}/>Thêm video ({videos.length}/3)</button></div>
    <small>Ảnh tối đa 10 MB, tự nén xuống cạnh dài 1.800 px. Video tối đa 50 MB.</small>
    {pending.length>0 && <div className="lf-upload-review"><h3>Xem trước tệp tải lên</h3>{uploadKind==='images' ? <img src={previewUrl} alt="Ảnh được chọn" style={{width:220,height:square?220:160,objectFit:square?'cover':'contain'}}/> : <video src={previewUrl} controls style={{maxWidth:'100%',height:180}}/>}<p>{pending.length} tệp đã chọn</p>{uploadKind==='images' && <label className="lf-check"><input type="checkbox" checked={square} disabled={busy} onChange={event=>setSquare(event.target.checked)}/>Cắt vuông từ tâm cho các ảnh đã chọn</label>}<div className="lf-media-actions"><button type="button" className="lf-primary" disabled={busy} onClick={upload}>Tải lên</button><button type="button" className="lf-secondary" disabled={busy} onClick={clearPending}>Hủy</button></div></div>}
    {busy && <div role="status"><progress max={100} value={progress??0}/><p>Đang tải lên… {progress}%</p></div>}
    {error && <p role="alert" className="lf-error">{error}</p>}
    {(['images','videos'] as const).map(kind=><div key={kind} className="lf-media-grid">{(kind==='images'?images:videos).map((id,index,ids)=>{
      const item=media.find(item=>item.id===id); if(!item)return null;
      return <div key={id} className="lf-media-tile"><button className="lf-media-preview" type="button" onClick={()=>setPreview(item)} aria-label={`Xem ${kind==='images'?'ảnh':'video'} ${index+1}`}>{kind==='images'?<img src={item.url} alt={`Ảnh sản phẩm ${index+1}`}/>:<span><Film/>Video {index+1}</span>}{kind==='images'&&index===0&&<b>Ảnh bìa</b>}</button><div className="lf-media-controls"><button type="button" disabled={disabled||busy||index===0} aria-label={`Chuyển tệp ${index+1} lên trước`} onClick={()=>{const next=[...ids];[next[index-1],next[index]]=[next[index],next[index-1]];onOrder(kind,next);}}><ArrowLeft size={16}/></button><button type="button" disabled={disabled||busy||index===ids.length-1} aria-label={`Chuyển tệp ${index+1} ra sau`} onClick={()=>{const next=[...ids];[next[index+1],next[index]]=[next[index],next[index+1]];onOrder(kind,next);}}><ArrowRight size={16}/></button><button type="button" disabled={disabled||busy} aria-label={`Bỏ tệp ${index+1}`} onClick={()=>remove(item)}><Trash2 size={16}/></button></div></div>;
    })}</div>)}
    {preview && <div className="lf-modal" role="dialog" aria-modal="true" aria-label="Xem tệp"><div><button type="button" autoFocus className="lf-secondary" onClick={()=>setPreview(null)}>Đóng</button>{preview.kind==='images'?<img src={preview.url} alt="Ảnh sản phẩm phóng to"/>:<video src={preview.url} controls/>}</div></div>}
  </div>;
}
