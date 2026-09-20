'use client';
import { useEffect, useRef, useState } from 'react';
type Point={latitude:number;longitude:number};
export function validMapPoint(value:unknown):value is Point {
  if(!value||typeof value!=='object')return false;
  const p=value as Point;return Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=85&&Math.abs(p.longitude)<=180;
}
export function LocationMap({latitude,longitude,onChange,disabled=false}:{latitude?:number;longitude?:number;onChange:(point:Point|undefined)=>void;disabled?:boolean}){
  const [open,setOpen]=useState(false),[manual,setManual]=useState(false),[error,setError]=useState('');
  const frame=useRef<HTMLIFrameElement>(null);
  const [initial,setInitial]=useState('');
  const [lat,setLat]=useState(String(latitude??'')),[lng,setLng]=useState(String(longitude??''));
  useEffect(()=>{setLat(String(latitude??''));setLng(String(longitude??''));},[latitude,longitude]);
  useEffect(()=>{const receive=(event:MessageEvent)=>{if(disabled||event.origin!==window.location.origin||event.source!==frame.current?.contentWindow||event.data?.type!=='tattantat-map-point'||!validMapPoint(event.data))return;onChange({latitude:event.data.latitude,longitude:event.data.longitude});};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);},[disabled,onChange]);
  useEffect(()=>{if(validMapPoint({latitude,longitude}))frame.current?.contentWindow?.postMessage({type:'tattantat-map-set',latitude,longitude},window.location.origin);},[latitude,longitude]);
  function apply(){const point={latitude:Number(lat),longitude:Number(lng)};if(!lat.trim()||!lng.trim()||!validMapPoint(point)){setError('Vĩ độ từ -85 đến 85; kinh độ từ -180 đến 180.');return;}setError('');onChange(point);}
  function toggle(){if(!open)setInitial(validMapPoint({latitude,longitude})?`#lat=${latitude}&lng=${longitude}`:'');setOpen(value=>!value);}
  return <div className="lf-map"><p className="lf-hint">Chọn ghim không tự điền địa chỉ. Hãy kiểm tra tỉnh/thành và phường/xã. Khi mở bản đồ, OpenStreetMap nhận yêu cầu tải nền cho khu vực bạn đang xem.</p><div className="lf-media-actions"><button type="button" className="lf-secondary" disabled={disabled} onClick={toggle}>{open?'Đóng bản đồ':'Chọn vị trí trên bản đồ'}</button><button type="button" className="lf-secondary" disabled={disabled} onClick={()=>setManual(value=>!value)}>Nhập tọa độ</button>{latitude!==undefined&&<button type="button" className="lf-secondary" disabled={disabled} onClick={()=>{setOpen(false);onChange(undefined);}}>Xóa vị trí ghim</button>}</div>
    {open&&<iframe ref={frame} title="Bản đồ chọn vị trí" src={'/map-picker/index.html'+initial} style={{width:'100%',height:390,border:'1px solid #dce7df',borderRadius:12,pointerEvents:disabled?'none':undefined}}/>}
    {manual&&<div className="lf-fields-grid"><div className="lf-field"><label htmlFor="map-lat">Vĩ độ</label><input id="map-lat" type="number" step="any" min={-85} max={85} value={lat} disabled={disabled} onChange={event=>setLat(event.target.value)}/></div><div className="lf-field"><label htmlFor="map-lng">Kinh độ</label><input id="map-lng" type="number" step="any" min={-180} max={180} value={lng} disabled={disabled} onChange={event=>setLng(event.target.value)}/></div><button type="button" className="lf-secondary" disabled={disabled} onClick={apply}>Áp dụng tọa độ</button></div>}{error&&<p role="alert" className="lf-error">{error}</p>}
  </div>;
}
