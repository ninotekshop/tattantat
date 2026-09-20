'use client';
import { useEffect,useState } from 'react';
import { Listing, listingRequest } from '../../lib/listings';
export function PublishedListing({id}:{id:string}){
  const [listing,setListing]=useState<Listing|null>(null),[error,setError]=useState('');
  useEffect(()=>{let active=true;listingRequest<Listing>(`/listings/${id}?view=published`).then(value=>{if(active)setListing(value);}).catch(error=>{if(active)setError(error.message);});return()=>{active=false;};},[id]);
  if(error)return <p role="alert">{error}</p>;
  if(!listing)return <p>Đang tải thông tin chi tiết…</p>;
  return <section className="published-listing"><h2>Thông tin chi tiết</h2><dl>{listing.template.fields.filter(field=>listing.data.values?.[field.key]!==undefined&&!['image','video'].includes(field.type)).map(field=>{const value=listing.data.values![field.key];const label=(value:unknown)=>field.options.find(option=>option.value===value)?.label??String(value);return <div key={field.key}><dt>{field.label}</dt><dd>{typeof value==='boolean'?value?'Có':'Không':Array.isArray(value)?value.map(label).join(', '):label(value)} {field.config.unit}</dd></div>;})}</dl><div className="published-gallery">{listing.media.map(item=>item.kind==='images'?<a href={item.url} key={item.id} target="_blank" rel="noreferrer"><img src={item.url} alt={listing.data.title??'Ảnh sản phẩm'}/></a>:<video key={item.id} src={item.url} controls/>)}</div><p>Liên hệ: <strong>{listing.data.contact?.name}</strong></p>{listing.data.contact?.phone&&<a className="primary-action" href={`tel:${listing.data.contact.phone}`}>Gọi {listing.data.contact.phone}</a>}</section>;
}
