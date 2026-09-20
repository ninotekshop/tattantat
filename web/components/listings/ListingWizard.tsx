'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Cloud, MapPin, ShieldCheck, FileText } from 'lucide-react';
import { readSession } from '../../lib/auth';
import { Listing, ListingCategory, ListingData, ListingError, ListingMedia, ListingSummary, Template, conditionLabels, listingPrice, listingRequest, priceLabels, publicData, validateListing, visible } from '../../lib/listings';
import { DynamicField } from './DynamicField';
import { MediaPicker } from './MediaPicker';
import { LocationMap } from './LocationMap';
const steps=['Danh mục','Thông tin','Ảnh & video','Giá & vị trí','Liên hệ','Xem trước','Hoàn tất'];

export function ListingWizard() {
  const [categories,setCategories]=useState<ListingCategory[]>([]), [drafts,setDrafts]=useState<ListingSummary[]>([]);
  const [categoryId,setCategoryId]=useState(''), [template,setTemplate]=useState<Template|null>(null);
  const [listing,setListing]=useState<Listing|null>(null), [data,setData]=useState<ListingData>({});
  const [media,setMedia]=useState<ListingMedia[]>([]), [step,setStep]=useState(0);
  const [loading,setLoading]=useState(true), [busy,setBusy]=useState(false), [mediaBusy,setMediaBusy]=useState(false);
  const [error,setError]=useState(''), [errors,setErrors]=useState<Record<string,string>>({});
  const [saveState,setSaveState]=useState(''), [conflict,setConflict]=useState(false), [signedIn,setSignedIn]=useState(false);
  const current=useRef<ListingData>({}), listingRef=useRef<Listing|null>(null);
  const saved=useRef(''), revision=useRef(0), saving=useRef<Promise<void>|null>(null), stopped=useRef(false), owner=useRef('');
  const publishKey=useRef<{revision:number;key:string}|null>(null), createKey=useRef<{categoryId:string;key:string}|null>(null);
  const dirty=JSON.stringify(data)!==saved.current;

  useEffect(()=>{
    const session=readSession(); setSignedIn(!!session); owner.current=session?.user.id??'';
    const selected = new URLSearchParams(window.location.search).get('listing');
    Promise.all([listingRequest<ListingCategory[]>('/listing-categories').then(setCategories),session?listingRequest<ListingSummary[]>('/listings/mine').then(setDrafts):Promise.resolve(), session && selected && /^[0-9a-f-]{36}$/i.test(selected) ? listingRequest<Listing>(`/listings/${selected}`).then(accept) : Promise.resolve()]).catch(error=>setError(error.message)).finally(()=>setLoading(false));
  },[]);
  const fail=useCallback((error:unknown)=>{
    setError(error instanceof Error?error.message:'Không thể kết nối máy chủ.');
    if(error instanceof ListingError) { setErrors(error.fields); if(error.status===409) {stopped.current=true;setConflict(true);} }
  },[]);
  const flush=useCallback(async function save():Promise<void> {
    if(saving.current) {await saving.current;return save();}
    const item=listingRef.current;
    if(!item||JSON.stringify(current.current)===saved.current)return;
    if(stopped.current)throw new Error('Cần tải lại bản nháp trước khi tiếp tục.');
    if(readSession()?.user.id!==owner.current)throw new Error('Tài khoản đã thay đổi. Hãy tải lại trang để bảo vệ bản nháp.');
    const snapshot=JSON.stringify(current.current);setSaveState('Đang lưu…');
    const work=listingRequest<{revision:number}>(`/listings/${item.id}`,'PUT',{revision:revision.current,data:JSON.parse(snapshot)}).then(result=>{revision.current=result.revision;saved.current=snapshot;setSaveState('Đã lưu trên máy chủ');}).catch(error=>{setSaveState('Chưa lưu được');fail(error);throw error;});
    saving.current=work;
    try {await work;} finally {saving.current=null;}
  },[fail]);
  useEffect(()=>{
    if(!listing||!dirty||conflict||step===6)return;
    const timer=setTimeout(()=>{void flush().catch(()=>{});},1200);return()=>clearTimeout(timer);
  },[data,listing,dirty,conflict,step,flush]);
  useEffect(()=>{
    const warn=(event:BeforeUnloadEvent)=>{if(listingRef.current&&JSON.stringify(current.current)!==saved.current){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[]);
  useEffect(()=>{
    if(!categoryId||listing)return;
    let active=true;setTemplate(null);
    listingRequest<Template>(`/listing-templates/${categoryId}`).then(value=>{if(active)setTemplate(value);}).catch(error=>{if(active)fail(error);});
    return()=>{active=false;};
  },[categoryId,listing,fail]);
  function change(next:ListingData) {current.current=next;setData(next);setSaveState('Có thay đổi chưa lưu');setErrors({});}
  function patch(next:Partial<ListingData>) {change({...current.current,...next});}
  function accept(item:Listing) {
    if(!item.owner)throw new Error('Bạn không có quyền sửa tin này.');
    listingRef.current=item;current.current=item.data;revision.current=item.revision;saved.current=JSON.stringify(item.data);stopped.current=false;
    setListing(item);setData(item.data);setMedia(item.media);setTemplate(item.template);setCategoryId(item.categoryId);setConflict(false);setErrors({});setError('');setSaveState('Đã tải bản nháp');setStep(1);
  }
  async function resume(id:string) {setBusy(true);try{if(listingRef.current&&!stopped.current)await flush();accept(await listingRequest<Listing>(`/listings/${id}`));}catch(error){fail(error);}finally{setBusy(false);}}
  async function begin() {
    if(!template||!categoryId)return;
    if(!readSession()){setError('Vui lòng đăng nhập trước khi lưu và đăng tin.');return;}
    setBusy(true);setError('');
    if(createKey.current?.categoryId!==categoryId)createKey.current={categoryId,key:crypto.randomUUID()};
    try{accept(await listingRequest<Listing>('/listings/draft','POST',{categoryId,clientKey:createKey.current.key}));}catch(error){fail(error);}finally{setBusy(false);}
  }
  async function next() {
    if(step===0){if(listing)setStep(1);else await begin();return;}
    if(!template)return;
    const all=validateListing(current.current,template,true);
    const keys=step===1?['title','condition','description','values.']:step===2?['images','videos']:step===3?['price','priceMode','location']:step===4?['contact']:[];
    // Media-reference fields are selected after media has been uploaded.
    const relevant=Object.fromEntries(Object.entries(all).filter(([key])=>keys.some(prefix=>key===prefix||key.startsWith(prefix))&&!template.fields.some(field=>key==='values.'+field.key&&['image','video'].includes(field.type))));
    if(Object.keys(relevant).length){setErrors(relevant);setError(Object.values(relevant)[0]);return;}
    setBusy(true);setError('');try{await flush();setStep(value=>Math.min(5,value+1));}catch(error){fail(error);}finally{setBusy(false);}
  }
  async function publish() {
    if(!listing||!template)return;
    const validation=validateListing(current.current,template,true);setErrors(validation);
    if(Object.keys(validation).length){setError(Object.values(validation)[0]);return;}
    setBusy(true);setError('');
    try {
      await flush();
      if(publishKey.current?.revision!==revision.current)publishKey.current={revision:revision.current,key:crypto.randomUUID()};
      const result=await listingRequest<{productId:string}>(`/listings/${listing.id}/publish`,'POST',{revision:revision.current},publishKey.current.key);
      setListing({...listing,productId:result.productId,status:'PUBLISHED'});setStep(6);setSaveState('Tin đã được đăng');
    }catch(error){fail(error);}finally{setBusy(false);}
  }
  async function remove(item:ListingMedia) {
    const values={...current.current.values};
    for(const field of template?.fields??[])if(['image','video'].includes(field.type)&&values[field.key]===item.id)delete values[field.key];
    patch({[item.kind]:(current.current[item.kind]??[]).filter(id=>id!==item.id),values});await flush();
    try{await listingRequest(`/listings/${listing!.id}/media/${item.id}`,'DELETE');setMedia(items=>items.filter(value=>value.id!==item.id));}
    catch(error){if(error instanceof ListingError&&error.status===409){setError('Đã bỏ tệp khỏi bản nháp. Tệp cũ được giữ cho tin đang công khai đến khi bạn đăng bản cập nhật.');}else throw error;}
  }
  function locate() {
    setError('');if(!navigator.geolocation){setError('Trình duyệt không hỗ trợ định vị. Bạn có thể nhập địa chỉ.');return;}
    navigator.geolocation.getCurrentPosition(position=>patch({location:{...current.current.location,latitude:position.coords.latitude,longitude:position.coords.longitude}}),()=>setError('Chưa lấy được vị trí. Hãy cấp quyền hoặc nhập địa chỉ bên dưới.'),{timeout:10000});
  }
  const groups=categories.filter(item=>item.isGroup), selected=categories.find(item=>item.id===categoryId);
  const ancestors:ListingCategory[]=[];let cursor=selected;
  while(cursor&&!ancestors.some(item=>item.id===cursor!.id)&&ancestors.length<10){ancestors.unshift(cursor);cursor=categories.find(item=>item.id===cursor?.parentId);}
  const groupId=ancestors.find(item=>item.isGroup)?.id??'', children=categories.filter(item=>item.parentId===categoryId);
  const previewData=template?publicData(data,template):data, disabled=busy||conflict;
  function fieldError(key:string){return errors[key]?<small className="lf-error">{errors[key]}</small>:null;}
  function dynamicFields(mediaFields:boolean) {return template?.fields.filter(field=>visible(field,data.values??{},template.fields)&&['image','video'].includes(field.type)===mediaFields).map(field=><DynamicField key={field.key} field={field} value={data.values?.[field.key]} error={errors['values.'+field.key]} media={media.filter(item=>(data[item.kind]??[]).includes(item.id))} onChange={value=>patch({values:{...current.current.values,[field.key]:value}})}/>);}

  return <main id="main-content" className="lf-page"><div className="lf-heading"><div><Link href="/" className="lf-back"><ArrowLeft size={16}/>Trang chủ</Link><p className="lf-eyebrow">TẤT TẦN TẬT · ĐĂNG TIN MIỄN PHÍ</p><h1>Món đồ của bạn, cơ hội mới.</h1><p>Đăng tin rõ ràng, kết nối người mua ở gần bạn.</p></div><span className="lf-security"><ShieldCheck size={18}/>Thông tin được bảo vệ</span></div>
    <nav className="lf-steps" aria-label="Các bước đăng tin">{steps.map((name,index)=><button key={name} disabled={busy||mediaBusy||index>step||step===6} aria-current={step===index?'step':undefined} onClick={()=>setStep(index)}><span>{index<step?<Check size={15}/>:index+1}</span>{name}</button>)}</nav>
    <div className="lf-layout"><section className="lf-panel"><div className="lf-panel-heading"><div><p className="lf-eyebrow">BƯỚC {step+1} / 7</p><h2>{steps[step]}</h2></div>{listing&&<span className="lf-save" role="status"><Cloud size={17}/>{saveState}</span>}</div>
      {error&&<div className="lf-alert" role="alert">{error}{conflict&&listing&&<button className="lf-secondary" onClick={()=>resume(listing.id)} disabled={busy}>Tải lại bản nháp từ máy chủ</button>}</div>}
      {loading?<p role="status">Đang tải danh mục…</p>:<fieldset disabled={disabled||step===6} className="lf-fieldset">
      {step===0&&<>
        {!signedIn&&<div className="lf-callout"><FileText size={24}/><div><strong>Chọn danh mục trước, đăng nhập để lưu tin</strong><p><Link href="/login">Đăng nhập</Link> hoặc <Link href="/register">tạo tài khoản</Link> để tiếp tục. Bản nháp được lưu vào tài khoản của bạn.</p></div></div>}
        {listing?<div className="lf-callout">Danh mục bản nháp: <strong>{selected?.name}</strong>. Để đổi danh mục, hãy tạo tin mới; bản nháp này vẫn được giữ.</div>:<>
          <h3>Bạn muốn đăng gì?</h3><div className="lf-category-grid">{groups.map(group=><button key={group.id} type="button" className={groupId===group.id?'selected':''} onClick={()=>{setCategoryId(group.id);setError('');}}><span>{group.name}</span><ArrowRight size={17}/></button>)}</div>
          {ancestors.length>0&&<div className="lf-breadcrumb">{ancestors.map(item=><button key={item.id} type="button" onClick={()=>setCategoryId(item.id)}>{item.name} /</button>)}</div>}
          {children.length>0&&<div className="lf-category-grid compact">{children.map(child=><button key={child.id} type="button" onClick={()=>setCategoryId(child.id)}>{child.name}<ArrowRight size={15}/></button>)}</div>}
          {template&&<p className="lf-hint">Biểu mẫu: {template.name} · phiên bản {template.version} · {template.fields.filter(field=>field.enabled).length} thông tin chi tiết</p>}
        </>}
        {!listing&&drafts.length>0&&<div className="lf-drafts"><h3>Tiếp tục tin đã lưu</h3>{drafts.map(draft=><button type="button" key={draft.id} onClick={()=>resume(draft.id)}><FileText size={18}/><span><strong>{draft.title||'Tin chưa có tiêu đề'}</strong><small>{draft.status==='PUBLISHED'?'Đã đăng · Chỉnh sửa':'Bản nháp'} · {new Date(draft.updatedAt).toLocaleDateString('vi-VN')}</small></span><ArrowRight size={17}/></button>)}</div>}
      </>}
      {step===1&&template&&<>
        <div className="lf-field"><label htmlFor="listing-title">Tiêu đề *</label><input id="listing-title" value={data.title??''} maxLength={200} placeholder="Ví dụ: iPhone 14 Pro 128GB, còn đẹp, chính chủ" onChange={event=>patch({title:event.target.value})} aria-invalid={!!errors.title}/><small>{data.title?.length??0}/200 ký tự</small>{fieldError('title')}</div>
        <div className="lf-field"><label htmlFor="listing-condition">Tình trạng *</label><select id="listing-condition" value={data.condition??''} onChange={event=>patch({condition:event.target.value})}><option value="">Chọn tình trạng</option>{Object.entries(conditionLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>{fieldError('condition')}</div>
        <h3>Thông tin {selected?.name.toLowerCase()}</h3><div className="lf-fields-grid">{dynamicFields(false)}</div>
        <div className="lf-field"><label htmlFor="listing-description">Mô tả chi tiết *</label><textarea id="listing-description" rows={6} value={data.description??''} maxLength={10000} placeholder="Tình trạng thực tế, phụ kiện, lý do bán và lưu ý cho người mua…" onChange={event=>patch({description:event.target.value})}/>{fieldError('description')}</div>
      </>}
      {step===2&&listing&&<><MediaPicker listingId={listing.id} images={data.images??[]} videos={data.videos??[]} media={media} disabled={disabled} onBusy={setMediaBusy} onAdd={item=>{setMedia(items=>[...items,item]);patch({[item.kind]:[...(current.current[item.kind]??[]),item.id]});}} onOrder={(kind,ids)=>patch({[kind]:ids})} onRemove={remove}/>{fieldError('images')}<div className="lf-fields-grid">{dynamicFields(true)}</div>{media.some(item=>!(data[item.kind]??[]).includes(item.id))&&<details className="lf-recovery"><summary>Tệp đã tải nhưng chưa dùng</summary><p>Khôi phục tệp nếu lần tải trước bị gián đoạn.</p>{media.filter(item=>!(data[item.kind]??[]).includes(item.id)).map(item=><div key={item.id}>{item.kind==='images'?<img src={item.url} alt="Ảnh chưa dùng"/>:<span>Video</span>}<button type="button" className="lf-secondary" disabled={(data[item.kind]?.length??0)>=(item.kind==='images'?20:3)} onClick={()=>patch({[item.kind]:[...(data[item.kind]??[]),item.id]})}>Dùng tệp</button><button type="button" className="lf-secondary" onClick={()=>remove(item).catch(fail)}>Xóa tệp</button></div>)}</details>}</>}
      {step===3&&template&&<>
        <div className="lf-fields-grid"><div className="lf-field"><label htmlFor="listing-price-mode">Cách tính giá *</label><select id="listing-price-mode" value={data.priceMode} onChange={event=>patch({priceMode:event.target.value})}>{template.config.priceModes.map(mode=><option key={mode} value={mode}>{priceLabels[mode]}</option>)}</select></div>{!['FREE','CONTACT'].includes(data.priceMode??'')&&<div className="lf-field"><label htmlFor="listing-price">Giá (VND) *</label><input id="listing-price" inputMode="numeric" maxLength={13} placeholder="Nhập số tiền, không có dấu phân cách" value={data.price??''} onChange={event=>patch({price:event.target.value.replace(/[^0-9]/g,'')})}/>{fieldError('price')}<small>{listingPrice(data)}</small></div>}</div>
        <label className="lf-check"><input type="checkbox" checked={data.negotiable??false} onChange={event=>patch({negotiable:event.target.checked})}/>Có thể thương lượng</label><h3>Vị trí sản phẩm / dịch vụ</h3>
        <div className="lf-fields-grid">{([['province','Tỉnh / Thành phố *'],['district','Quận / Huyện (nếu có)'],['ward','Phường / Xã *'],['address','Địa chỉ cụ thể']] as const).map(([key,label])=><div key={key} className="lf-field"><label htmlFor={`listing-${key}`}>{label}</label><input id={`listing-${key}`} value={data.location?.[key]??''} maxLength={key==='address'?300:100} onChange={event=>patch({location:{...current.current.location,[key]:event.target.value}})}/>{fieldError('location.'+key)}</div>)}</div>
        <label className="lf-check"><input type="checkbox" checked={data.location?.hideExact!==false} onChange={event=>patch({location:{...current.current.location,hideExact:event.target.checked}})}/>Ẩn địa chỉ cụ thể và tọa độ với người xem tin</label><button type="button" className="lf-secondary" onClick={locate}><MapPin size={17}/>Lấy vị trí hiện tại</button>{data.location?.latitude!==undefined&&<p className="lf-hint">Đã ghi nhận tọa độ: {data.location.latitude.toFixed(5)}, {data.location.longitude?.toFixed(5)}. {data.location.hideExact?'Chỉ bạn xem vị trí chính xác.':''}</p>}{fieldError('location')}
        <LocationMap latitude={data.location?.latitude} longitude={data.location?.longitude} disabled={disabled} onChange={point=>{const location={...current.current.location};if(point){location.latitude=point.latitude;location.longitude=point.longitude;}else{delete location.latitude;delete location.longitude;}patch({location});}}/>
      </>}
      {step===4&&<><div className="lf-callout"><ShieldCheck size={24}/><div><strong>Thông tin để người mua liên hệ</strong><p>Họ tên và số điện thoại được hiển thị trong tin. Email không được công khai.</p></div></div>{([['name','Tên liên hệ *','text'],['phone','Số điện thoại *','tel'],['email','Email (không bắt buộc)','email']] as const).map(([key,label,type])=><div className="lf-field" key={key}><label htmlFor={`listing-contact-${key}`}>{label}</label><input id={`listing-contact-${key}`} type={type} autoComplete={key==='name'?'name':key==='phone'?'tel':'email'} value={data.contact?.[key]??''} maxLength={key==='email'?254:120} onChange={event=>patch({contact:{...current.current.contact,[key]:event.target.value}})}/>{fieldError('contact.'+key)}</div>)}</>}
      {step===5&&template&&<><div className="lf-callout"><CheckCircle2 size={24}/><div><strong>Kiểm tra lần cuối trước khi đăng</strong><p>Đây là thông tin người mua sẽ nhìn thấy.</p></div></div><article className="lf-preview"><div className="lf-preview-images">{(data.images??[]).map(id=><img key={id} src={media.find(item=>item.id===id)?.url} alt="Ảnh sản phẩm xem trước"/>)}</div><p className="lf-eyebrow">{selected?.name} · {conditionLabels[data.condition??'']}</p><h2>{data.title}</h2><strong className="lf-price">{listingPrice(data)}</strong><p><MapPin size={15}/>{[previewData.location?.address,previewData.location?.ward,previewData.location?.district,previewData.location?.province].filter(Boolean).join(', ')}</p><p className="lf-description">{data.description}</p><dl>{template.fields.filter(field=>visible(field,data.values??{},template.fields)&&data.values?.[field.key]!==undefined&&data.values?.[field.key]!==''&&!['image','video'].includes(field.type)).map(field=><div key={field.key}><dt>{field.label}</dt><dd>{Array.isArray(data.values?.[field.key])?(data.values![field.key] as string[]).join(', '):typeof data.values?.[field.key]==='boolean'?data.values[field.key]?'Có':'Không':String(data.values?.[field.key])} {field.config.unit}</dd></div>)}</dl><p>Liên hệ: {data.contact?.name} · {data.contact?.phone}</p>{(data.videos??[]).map(id=><video key={id} src={media.find(item=>item.id===id)?.url} controls/>)}</article></>}
      </fieldset>}
      {step===6&&<div className="lf-success"><CheckCircle2 size={64}/><h2>Tin của bạn đã sẵn sàng!</h2><p>Người mua có thể tìm thấy tin trên Tất Tần Tật.</p><Link className="lf-primary" href={`/products/${listing?.productId}`}>Xem tin vừa đăng<ArrowRight size={18}/></Link><a className="lf-secondary" href="/sell">Đăng tin khác</a></div>}
      {step<6&&<div className="lf-actions"><button className="lf-secondary" type="button" disabled={step===0||busy||mediaBusy} onClick={()=>{setError('');setStep(value=>value-1);}}><ArrowLeft size={17}/>Quay lại</button><div>{listing&&<button className="lf-text-button" type="button" disabled={disabled||mediaBusy} onClick={()=>flush().catch(fail)}>Lưu nháp</button>}<button className="lf-primary" type="button" disabled={loading||disabled||mediaBusy||(step===0&&!template)} onClick={step===5?publish:next}>{busy?'Đang xử lý…':step===5?'Đăng tin ngay':'Tiếp tục'}<ArrowRight size={18}/></button></div></div>}
    </section><aside className="lf-aside"><div className="lf-tips"><span className="lf-tip-icon"><ShieldCheck size={28}/></span><h3>Đăng tin an tâm</h3><p>Ảnh và bản nháp chỉ bạn xem được trước khi đăng.</p><ul><li>Dùng ảnh thật, đủ sáng.</li><li>Mô tả trung thực tình trạng.</li><li>Không chia sẻ mã OTP hoặc thông tin ngân hàng trong tin.</li></ul><div className="lf-tip-footer"><Cloud size={19}/>Bản nháp tự lưu sau khi bạn nhập</div></div>{template&&<div className="lf-template-info"><FileText size={22}/><strong>{template.name}</strong><small>Phiên bản {template.version}. Cấu hình mới không làm mất dữ liệu của bản nháp này.</small></div>}</aside></div>
  </main>;
}
