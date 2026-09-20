/* Shared local map. It never receives account tokens, addresses or listing IDs. */
(() => {
  'use strict';
  const valid=(lat,lng)=>typeof lat==='number'&&typeof lng==='number'&&Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=85&&Math.abs(lng)<=180;
  const params=new URLSearchParams(location.hash.slice(1));
  const lat=Number(params.get('lat')),lng=Number(params.get('lng'));
  let selected=params.get('lat')?.trim()&&params.get('lng')?.trim()&&valid(lat,lng)?{latitude:lat,longitude:lng}:null;
  const map=L.map('map',{scrollWheelZoom:false,minZoom:2,maxZoom:19,maxBounds:[[-85,-180],[85,180]],maxBoundsViscosity:1}).setView(selected?[lat,lng]:[13.782,109.219],selected?16:13);
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,noWrap:true,keepBuffer:0,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);
  tiles.on('tileerror',()=>{document.getElementById('error').textContent='Không tải được nền bản đồ. Kiểm tra Internet hoặc nhập tọa độ ở biểu mẫu.';});
  const marker=L.marker(selected?[lat,lng]:[13.782,109.219],{draggable:true,keyboard:true,title:'Vị trí đã chọn — kéo để đổi',icon:L.divIcon({className:'pin',iconSize:[20,20],iconAnchor:[10,10]})});
  function choose(lat,lng,notify=true){if(!valid(lat,lng))return;selected={latitude:Number(lat.toFixed(6)),longitude:Number(lng.toFixed(6))};marker.setLatLng([lat,lng]).addTo(map);document.getElementById('position').textContent=selected.latitude.toFixed(6)+', '+selected.longitude.toFixed(6);if(notify&&parent!==window)parent.postMessage({type:'tattantat-map-point',...selected},location.origin);}
  if(selected)choose(lat,lng,false);
  map.on('click',event=>choose(event.latlng.lat,event.latlng.lng));
  marker.on('dragend',()=>{const point=marker.getLatLng();choose(point.lat,point.lng);});
  document.getElementById('center').addEventListener('click',()=>{const point=map.getCenter();choose(point.lat,point.lng);});
  window.TatMap=Object.freeze({selection:()=>selected,setPoint:(lat,lng)=>{if(valid(lat,lng)){
    // A parent's acknowledgement must not reset zoom or pan after every drag.
    if(selected?.latitude===Number(lat.toFixed(6))&&selected?.longitude===Number(lng.toFixed(6)))return;
    choose(lat,lng,false);map.setView([lat,lng],16);
  }}});
  window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='tattantat-map-set')return;window.TatMap.setPoint(event.data.latitude,event.data.longitude);});
})();
