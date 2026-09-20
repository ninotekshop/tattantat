// DEV-only, additive, resumable seed. Never modifies existing listings or finance.
require('dotenv').config({quiet:true});
require('reflect-metadata');
const {Pool}=require('pg');
const {createClient}=require('@supabase/supabase-js');
const {createHash}=require('node:crypto');
const bcrypt=require('bcryptjs');
const {ListingsService}=require('../dist/listings/listings.service');
const {detectMedia}=require('../dist/listings/listing-media.service');
const {validateTemplate}=require('../dist/listings/listing-domain');
const {batch,stableId,entries,sample,listingData}=require('./demo-catalog-data.cjs');
const apply=process.argv.includes('--apply'),verify=process.argv.includes('--verify');
const projectArg=process.argv.find(arg=>arg.startsWith('--project='))?.slice(10);
const demoEmail='catalog-demo@example.invalid';
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},connectionTimeoutMillis:15000,max:4,statement_timeout:30000});
const storage=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(30000)})}}).storage.from('listing-media');
async function transaction(work){const c=await pool.connect();try{await c.query('BEGIN');const out=await work(c);await c.query('COMMIT');return out;}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}}
async function parallel(items,limit,work){let next=0;const out=[];await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(next<items.length){const i=next++;out[i]=await work(items[i],i);}}));return out;}
const service=new ListingsService({query:(...args)=>pool.query(...args),transaction},{});
const imageCache=new Map();
function download(url){
  if(!imageCache.has(url))imageCache.set(url,(async()=>{
    const parsed=new URL(url);if(parsed.protocol!=='https:'||!['cdn.dummyjson.com','images.unsplash.com'].includes(parsed.hostname))throw new Error('Unexpected demo image host');
    const response=await fetch(url,{signal:AbortSignal.timeout(25000),redirect:'error'});
    if(!response.ok)throw new Error('Image source HTTP '+response.status);
    const bytes=Buffer.from(await response.arrayBuffer()),mime=detectMedia(bytes,'images');
    if(!mime||bytes.length<1024||bytes.length>10*1024*1024)throw new Error('Invalid demo image');
    return {bytes,mime,hash:createHash('sha256').update(bytes).digest('hex').slice(0,24)};
  })());
  return imageCache.get(url);
}
function fallback(category){
  if(!['me-va-be','do-dien-tu'].includes(category.slug))throw new Error('No template: '+category.slug);
  return {id:stableId('template:'+category.slug),categoryId:category.id,version:1,name:'DEMO — '+category.name,config:{priceModes:['FIXED','CONTACT','FREE']},fields:
    [['brand','Hãng'],['model','Model'],['material','Chất liệu'],['details','Chi tiết']].map(([key,label])=>({key,label,type:'text',required:true,enabled:true,options:[],config:{maxLength:150}}))};
}
async function ensureFallback(category,template,adminId){
  return transaction(async c=>{
    await c.query('SELECT id FROM categories WHERE id=$1 FOR UPDATE',[category.id]);
    const found=(await c.query('SELECT id,version FROM listing_templates WHERE category_id=$1 AND name=$2',[category.id,template.name])).rows[0];
    if(found)return {...template,id:found.id,version:found.version};
    const version=Number((await c.query('SELECT COALESCE(max(version),0)+1 AS v FROM listing_templates WHERE category_id=$1',[category.id])).rows[0].v);
    // Snapshot-only template: do not activate/replace user configuration while seeding.
    const row=(await c.query('INSERT INTO listing_templates(category_id,version,name,active,config,created_by) VALUES($1,$2,$3,false,$4::jsonb,$5) RETURNING id',[category.id,version,template.name,JSON.stringify(template.config),adminId])).rows[0];
    for(const [i,f] of template.fields.entries())await c.query('INSERT INTO listing_fields(template_id,key,label,type,required,enabled,sort_order,config) VALUES($1,$2,$3,$4,$5,true,$6,$7::jsonb)',[row.id,f.key,f.label,f.type,f.required,i,JSON.stringify(f.config)]);
    return {...template,id:row.id,version};
  });
}
async function seedOne(category,template,s,sellerId,adminId){
  const slug=`${batch}-${category.slug}-${s.index+1}`,id=stableId('listing:'+slug),productId=stableId('product:'+slug);
  const existing=await pool.query('SELECT id,seller_id FROM products WHERE slug=$1',[slug]);
  if(existing.rows.length){if(existing.rows[0].id!==productId||existing.rows[0].seller_id!==sellerId)throw new Error('Demo slug owned by unrelated data');return false;}
  const media=[];
  for(const [i,url] of s.images.entries()){
    const asset=await download(url),key=`${batch}/${id}/${i}-${asset.hash}.${asset.mime.split('/')[1]}`;
    const {error}=await storage.upload(key,asset.bytes,{contentType:asset.mime,cacheControl:'3600',upsert:false});
    if(error&&!['409','Duplicate'].includes(String(error.statusCode))&&!/already exists|duplicate/i.test(error.message))throw new Error('Demo storage upload failed: '+error.message);
    media.push({id:stableId('image:'+slug+':'+i),key,mime:asset.mime,size:asset.bytes.length,sort:i,url:'/'+(process.env.API_PREFIX??'api/v1')+`/listings/${id}/media/${stableId('image:'+slug+':'+i)}`});
  }
  const data=listingData(category,template,s,media.map(m=>m.id));
  return transaction(async c=>{
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[slug]);
    if((await c.query('SELECT id FROM products WHERE slug=$1',[slug])).rows.length)return false;
    const ageMinutes=parseInt(createHash('sha256').update(slug).digest('hex').slice(0,6),16)%1440;
    await c.query(`INSERT INTO products(id,seller_id,category_id,title,slug,description,price,condition,status,published_at,address,listing_price_mode,listing_negotiable)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8::product_condition,'ACTIVE',now()-($9*interval '1 minute'),$10,$11,$12)`,
      [productId,sellerId,category.id,data.title,slug,data.description,data.priceMode==='FREE'||data.priceMode==='CONTACT'?'0':data.price,data.condition,ageMinutes,`${data.location.ward}, ${data.location.province}`,data.priceMode,data.negotiable]);
    await c.query(`INSERT INTO listings(id,seller_id,category_id,template_id,template_snapshot,data,status,revision,client_key,product_id,published_snapshot,published_at)
      VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,'PUBLISHED',1,$7,$8,$9::jsonb,now())`,
      [id,sellerId,category.id,template.id,JSON.stringify(template),JSON.stringify(data),stableId('create:'+slug),productId,JSON.stringify({template,data})]);
    await c.query(`INSERT INTO listing_images(id,listing_id,storage_key,mime_type,byte_size)
      SELECT x.id,$1,x.key,x.mime,x.size FROM jsonb_to_recordset($2::jsonb) AS x(id uuid,key text,mime text,size integer)`,[id,JSON.stringify(media)]);
    await c.query(`INSERT INTO product_images(product_id,url,sort_order) SELECT $1,x.url,x.sort FROM jsonb_to_recordset($2::jsonb) AS x(url text,sort integer)`,[productId,JSON.stringify(media)]);
    await c.query('INSERT INTO listing_field_values(listing_id,field_key,value) SELECT $1,key,value FROM jsonb_each($2::jsonb)',[id,JSON.stringify(data.values)]);
    await c.query('INSERT INTO listing_publish_requests(seller_id,key,listing_id,revision,product_id) VALUES($1,$2,$3,1,$4)',[sellerId,stableId('publish:'+slug),id,productId]);
    await c.query('INSERT INTO listing_audit_logs(actor_id,action,entity_id,detail) VALUES($1,$2,$3,$4::jsonb)',[adminId,'DEMO_CATALOG_SEEDED',id,JSON.stringify({batch,productId,categoryId:category.id,imageSources:s.images,fictional:true})]);
    return true;
  });
}
async function audit(categories){
  const rows=(await pool.query(`SELECT p.id,p.category_id::text,p.title,p.price::text,p.listing_price_mode,l.id AS listing_id,l.data,l.template_snapshot,
    (SELECT count(*)::int FROM product_images pi WHERE pi.product_id=p.id) AS image_count,
    (SELECT jsonb_agg(jsonb_build_object('id',i.id,'key',i.storage_key)) FROM listing_images i WHERE i.listing_id=l.id) AS media
    FROM products p JOIN listings l ON l.product_id=p.id WHERE p.slug LIKE $1 ORDER BY p.category_id,p.slug`,[batch+'-%'])).rows;
  for(const category of categories){const products=rows.filter(r=>r.category_id===category.id);if(products.length!==3)throw new Error(category.slug+': expected 3, got '+products.length);}
  for(const row of rows){
    const errors=require('../dist/listings/listing-domain').validateListing(row.data,row.template_snapshot,true);
    if(Object.keys(errors).length||row.image_count!==row.data.images.length||!row.media?.length)throw new Error('Invalid seeded listing '+row.id);
    for(const f of row.template_snapshot.fields)if(require('../dist/listings/listing-domain').visible(f,row.data.values,row.template_snapshot.fields)&&f.type!=='video'&&(row.data.values[f.key]===undefined||row.data.values[f.key]===''))throw new Error('Incomplete field '+f.key);
  }
  console.log(JSON.stringify({batch,categories:categories.length,products:rows.length,images:rows.reduce((sum,r)=>sum+r.image_count,0),valid:true,samples:rows.slice(0,3).map(r=>({id:r.id,title:r.title}))}));
  if(verify){
    const allMedia=rows.flatMap(r=>r.media);
    for(let offset=0;offset<allMedia.length;offset+=64){
      const batch=allMedia.slice(offset,offset+64);
      const {data,error}=await storage.createSignedUrls(batch.map(image=>image.key),180);
      if(error||data.length!==batch.length||data.some(item=>item.error||!item.signedUrl))throw new Error('Missing stored demo media');
      await parallel(data,4,async image=>{const r=await fetch(image.signedUrl,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('Demo image unreadable');const b=Buffer.from(await r.arrayBuffer());if(!detectMedia(b,'images')||b.length<1024)throw new Error('Demo image invalid');});
      console.log(`CHECKED_IMAGES=${Math.min(offset+64,allMedia.length)}/${allMedia.length}`);
    }
    console.log(`VERIFIED_STORAGE_IMAGES=${allMedia.length}`);
  }
}
async function main(){
  if(process.env.NODE_ENV==='production')throw new Error('DEV demo seed cannot run in production');
  const project=new URL(process.env.SUPABASE_URL).hostname.split('.')[0];
  if(apply&&projectArg!==project)throw new Error('Use --project='+project+' to confirm the DEV target');
  const databaseTarget=new URL(process.env.DATABASE_URL);
  if(apply&&databaseTarget.hostname!==`db.${project}.supabase.co`&&decodeURIComponent(databaseTarget.username)!==`postgres.${project}`)throw new Error('Database and Storage project do not match; refuse seed');
  const categories=(await service.categories()).data;
  if(verify){await audit(categories);return;}
  const response=await fetch('https://dummyjson.com/products?limit=0&select=id,title,category,images,brand',{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error('Demo image catalogue unavailable');
  const catalog=(await response.json()).products;
  const plans=await parallel(categories,4,async category=>{
    if(!entries[category.slug])throw new Error('Unconfigured category '+category.slug);
    let template,missing=false;
    try{template=await service.template(category.id);}catch(e){if(e.getStatus?.()!==404)throw e;template=fallback(category);missing=true;}
    const problem=validateTemplate(template);if(problem)throw new Error(problem);
    const samples=Array.from({length:3},(_,i)=>sample(category,i,catalog));
    samples.forEach((s,i)=>listingData(category,template,s,s.images.map((_,j)=>stableId(`plan:${category.slug}:${i}:${j}`))));
    return {category,template,missing,samples};
  });
  console.log(JSON.stringify({project,categories:plans.length,plannedProducts:plans.length*3,plannedImages:plans.reduce((n,p)=>n+p.samples.reduce((n,s)=>n+s.images.length,0),0),snapshotOnlyTemplates:plans.filter(p=>p.missing).map(p=>p.category.slug),mode:apply?'apply':'read-only plan'}));
  if(!apply)return;
  // Optional second worker can start from the other end. Deterministic IDs,
  // non-overwriting uploads and per-product locks preserve exactly-once inserts.
  if(process.argv.includes('--reverse'))plans.reverse();
  const admin=(await pool.query('SELECT id FROM users WHERE email=$1 AND role=$2',['admin@tattantat.vn','ADMIN'])).rows[0];
  if(!admin)throw new Error('Expected existing DEV admin');
  const sellerId=await transaction(async c=>{
    const existing=(await c.query('SELECT id,full_name FROM users WHERE email=$1',[demoEmail])).rows[0];
    if(existing){if(existing.full_name!=='Shop Demo Tất Tần Tật')throw new Error('Demo seller email belongs to another account');return existing.id;}
    const user=(await c.query(`INSERT INTO users(email,full_name,password_hash,role,email_verified) VALUES($1,$2,$3,'USER',true) RETURNING id`,[demoEmail,'Shop Demo Tất Tần Tật',await bcrypt.hash(process.env.DEMO_CATALOG_PASSWORD??'Demo@123',12)])).rows[0];
    await c.query('INSERT INTO user_profiles(user_id,display_name) VALUES($1,$2)',[user.id,'Shop Demo Tất Tần Tật']);return user.id;
  });
  let created=0,skipped=0;
  for(const plan of plans){
    if(plan.missing)plan.template=await ensureFallback(plan.category,plan.template,admin.id);
    const result=await parallel(plan.samples,3,s=>seedOne(plan.category,plan.template,s,sellerId,admin.id));
    created+=result.filter(Boolean).length;skipped+=result.filter(x=>!x).length;
    console.log(`CATEGORY=${plan.category.slug} CREATED=${result.filter(Boolean).length} TOTAL=${created+skipped}/${plans.length*3}`);
  }
  console.log(`CREATED=${created} SKIPPED_EXISTING=${skipped}`);
  await audit(categories);
}
main().catch(error=>{console.error('DEMO_SEED_FAILED:',error.code??error.message);process.exitCode=1;}).finally(()=>pool.end());
