const {test}=require('node:test');
const assert=require('node:assert/strict');
const {entries,stableId,sample,listingData}=require('./demo-catalog-data.cjs');
const {visible,uuid}=require('../dist/listings/listing-domain');
const seeds=require('../src/listings/seed-catalog.json');
const images=Array.from({length:194},(_,i)=>({id:i+1,title:'Model '+(i+1),brand:'Demo',images:['https://cdn.dummyjson.com/test/1.webp','https://cdn.dummyjson.com/test/2.webp']}));
test('stable IDs give deterministic, distinct UUIDs for resumable seeds',()=>{
  assert.equal(stableId('item'),stableId('item'));assert.notEqual(stableId('item'),stableId('other'));assert.ok(uuid(stableId('item')));
});
test('all configured categories have three complete valid snapshots',()=>{
  for(const group of seeds)for(const category of [group,...group.children]){
    const template={...category,id:stableId(category.slug),categoryId:'1',version:1,config:group.config};
    for(let i=0;i<3;i++){
      const s=sample(category,i,images),data=listingData(category,template,s,s.images.map((_,j)=>stableId(category.slug+i+j)));
      assert.ok(data.title.startsWith('[DEMO]'));assert.ok(data.images.length>=1);assert.equal(data.location.hideExact,true);
      assert.equal(data.contact.phone,'0000000000');assert.match(data.price,/^\d+$/);
      for(const f of template.fields)if(visible(f,data.values,template.fields)&&f.type!=='video')assert.notEqual(data.values[f.key],undefined,category.slug+':'+f.key);
    }
  }
});
test('electric vehicle fixture hides combustion-only attributes',()=>{
  const group=seeds.find(g=>g.slug==='xe-co'),category=group.children.find(c=>c.slug==='xe-dien');
  const s=sample(category,0,images),data=listingData(category,{...category,config:group.config},s,[stableId('image')]);
  assert.equal(data.values.fuel,'Điện');assert.equal(data.values.engine,undefined);
});
test('rental fixture uses monthly prices and never decimal VND',()=>{
  const group=seeds.find(g=>g.slug==='bat-dong-san'),category=group.children.find(c=>c.slug==='phong-tro');
  const s=sample(category,1,images),data=listingData(category,{...category,config:group.config},s,[stableId('image')]);
  assert.equal(data.priceMode,'MONTH');assert.equal(data.price,'2750000');
});
test('all 91 curated category entries have media and three price variants',()=>{
  assert.equal(Object.keys(entries).length,91);
  for(const slug of Object.keys(entries))for(let i=0;i<3;i++){const s=sample({slug},i,images);assert.ok(s.images.every(url=>url.startsWith('https://')));assert.ok(BigInt(s.price)>0n);}
});
test('unknown new categories fail closed instead of getting unrelated samples',()=>{
  assert.throws(()=>sample({slug:'new-unknown'},0,images),/No curated/);
});
