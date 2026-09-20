import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../../shared/map-picker/picker.js',import.meta.url),'utf8');
function setup(hash=''){
  const events={},markerEvents={},messages=[],nodes={};let point;
  const map={setView(){return this;},on(name,fn){events[name]=fn;return this;},getCenter(){return {lat:13.782,lng:109.219};}};
  const marker={setLatLng(p){point={lat:p[0],lng:p[1]};return this;},addTo(){return this;},on(name,fn){markerEvents[name]=fn;return this;},getLatLng(){return point;}};
  const parent={postMessage(message,origin){messages.push({message,origin});}};
  const window={addEventListener(name,fn){events[name]=fn;}};
  const document={getElementById(id){return nodes[id]??=( {textContent:'',addEventListener(name,fn){this[name]=fn;}} );}};
  const L={map:()=>map,marker:()=>marker,divIcon:()=>({}),tileLayer:()=>({addTo(){return this;},on(){}})};
  runInNewContext(source,{window,parent,document,L,URLSearchParams,location:{hash,origin:'http://localhost:3001'}});
  return {window,parent,events,markerEvents,messages,nodes,marker};
}
test('map never assumes the default viewport is a selected address',()=>{
  const s=setup();assert.equal(s.window.TatMap.selection(),null);assert.equal(s.messages.length,0);
  assert.equal(setup('#lat=&lng=').window.TatMap.selection(),null);
  assert.equal(setup('#lat=10').window.TatMap.selection(),null);
  s.nodes.center.click();assert.equal(s.window.TatMap.selection().latitude,13.782);
});
test('initial zero coordinate and rounded map clicks preserve exact selection',()=>{
  const s=setup('#lat=0&lng=0');assert.equal(s.window.TatMap.selection().latitude,0);
  s.events.click({latlng:{lat:13.123456789,lng:109.87654321}});
  assert.equal(s.window.TatMap.selection().latitude,13.123457);
  assert.equal(s.messages[0].origin,'http://localhost:3001');
  assert.equal(s.nodes.position.textContent,'13.123457, 109.876543');
});
test('drag selects a new point and invalid coordinates cannot overwrite it',()=>{
  const s=setup();s.marker.setLatLng([10,106]);s.markerEvents.dragend();
  for(const [lat,lng] of [[NaN,0],[86,0],[0,181],['10',106]])s.window.TatMap.setPoint(lat,lng);
  assert.equal(s.window.TatMap.selection().latitude,10);
});
test('incoming map updates require both trusted origin and parent window',()=>{
  const s=setup();const message={type:'tattantat-map-set',latitude:12,longitude:108};
  s.events.message({source:s.parent,origin:'https://evil.invalid',data:message});
  s.events.message({source:{},origin:'http://localhost:3001',data:message});
  assert.equal(s.window.TatMap.selection(),null);
  s.events.message({source:s.parent,origin:'http://localhost:3001',data:message});
  assert.equal(s.window.TatMap.selection().longitude,108);assert.equal(s.messages.length,0);
});
