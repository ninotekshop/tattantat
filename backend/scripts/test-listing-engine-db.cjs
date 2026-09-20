// Real PostgreSQL integration test; every database change is rolled back.
require('dotenv').config({quiet:true});
require('reflect-metadata');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {Client}=require('pg');
const {ListingsService}=require('../dist/listings/listings.service');
async function run(){
  if(process.env.NODE_ENV==='production')throw new Error('DEV tests only.');
  const client=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});
  await client.connect();
  try{
    await client.query('BEGIN');
    const db={query:(...args)=>client.query(...args),transaction:work=>work(client)};
    const media={signed:async()=>'/test-media',remove:async()=>{}};
    const service=new ListingsService(db,media);
    const user=(await client.query("INSERT INTO users(email,full_name,password_hash,role) VALUES($1,'Listing integration test','disabled','USER') RETURNING id",[`listing-test-${randomUUID()}@example.invalid`])).rows[0].id;
    const categories=(await service.categories()).data;
    assert.equal(categories.filter(item=>item.isGroup).length,12);
    const category=categories.find(item=>item.slug==='dien-thoai');assert.ok(category);
    const key=randomUUID();
    const draft=(await service.create(user,category.id,key)).data;
    assert.equal((await service.create(user,category.id,key)).data.id,draft.id);
    await assert.rejects(()=>service.get(draft.id,randomUUID()));
    const values={};
    for(const field of draft.template.fields){
      if(field.type==='select'||field.type==='radio')values[field.key]=field.options[0].value;
      else if(field.type==='multi-select')values[field.key]=[field.options[0].value];
      else if(['number','range','year'].includes(field.type))values[field.key]=field.type==='year'?2025:field.config.min??1;
      else if(['boolean','checkbox'].includes(field.type))values[field.key]=false;
      else values[field.key]=field.type==='currency'?'100000':field.type==='date'?'2026-09-20':'Kiểm thử';
    }
    const image=(await client.query("INSERT INTO listing_images(listing_id,storage_key,mime_type,byte_size) VALUES($1,$2,'image/jpeg',100) RETURNING id",[draft.id,`integration/${randomUUID()}.jpg`])).rows[0].id;
    const data={title:'Integration only: never committed',description:'Database integration rollback test',condition:'USED_GOOD',priceMode:'FIXED',price:'10000000',images:[image],videos:[],values,location:{province:'Test',ward:'Test',address:'PRIVATE ADDRESS',hideExact:true,latitude:13.782,longitude:109.219},contact:{name:'Test',phone:'0901234567',email:'private@example.invalid'}};
    const saved=(await service.save(draft.id,user,0,data)).data;
    await assert.rejects(()=>service.save(draft.id,user,0,data));
    const publishKey=randomUUID();
    const published=(await service.publish(draft.id,user,saved.revision,publishKey)).data;
    assert.equal((await service.publish(draft.id,user,saved.revision,publishKey)).data.productId,published.productId);
    const publicView=(await service.get(draft.id)).data;
    assert.equal((await service.byProduct(published.productId,user)).data.listingId,draft.id);
    await assert.rejects(()=>service.byProduct(published.productId,randomUUID()));
    assert.equal((await service.get(draft.id,user)).data.data.location.latitude,13.782);
    assert.equal(publicView.data.location.latitude,undefined);assert.equal(publicView.data.location.longitude,undefined);
    assert.equal(publicView.data.contact.email,undefined);assert.equal(publicView.data.location.address,undefined);
    assert.equal((await client.query('SELECT price::text,address FROM products WHERE id=$1',[published.productId])).rows[0].price,'10000000.00');
    await service.save(draft.id,user,saved.revision,{...data,title:'Edited private draft'});
    assert.equal((await service.get(draft.id)).data.data.title,data.title);
    const newFields=draft.template.fields.map(field=>({...field,label:field.label+' mới'}));
    await service.adminVersion(user,category.id,{...draft.template,fields:newFields,reason:'Integration test rollback'});
    assert.equal((await service.get(draft.id,user)).data.template.version,draft.template.version);
    console.log('PASS: PostgreSQL draft idempotency, isolation, revision locking, publishing, replay, privacy, live snapshot and template history. All test data rolled back.');
  }finally{await client.query('ROLLBACK');await client.end();}
}
run().catch(error=>{console.error('Listing integration failed:',error.code??error.message);process.exitCode=1;});
