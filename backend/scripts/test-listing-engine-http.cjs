// Explicit DEV smoke test; creates one private draft, then removes only its own records/files.
require('dotenv').config({quiet:true});
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {Client}=require('pg');
const {createClient}=require('@supabase/supabase-js');
async function run(){
  if(!process.argv.includes('--dev')||process.env.NODE_ENV==='production')throw new Error('Run explicitly with --dev against the local API.');
  const base='http://localhost:3000/api/v1';
  let token,draftId;const key=randomUUID();
  async function request(path,method='GET',body,auth=true){
    const response=await fetch(base+path,{method,headers:{...(auth&&token?{Authorization:'Bearer '+token}:{}),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});
    const payload=await response.json();
    if(!response.ok)throw Object.assign(new Error(payload.message??'HTTP failed'),{status:response.status});
    assert.equal(payload.success,true);return payload.data;
  }
  const db=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});await db.connect();
  const storage=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
  try{
    const session=await request('/auth/login','POST',{phoneOrEmail:'user@tattantat.vn',password:process.env.DEMO_TEST_PASSWORD??'Demo@123'},false);token=session.accessToken;
    const categories=await request('/listing-categories');const category=categories.find(item=>item.slug==='dien-thoai');
    const draft=await request('/listings/draft','POST',{categoryId:category.id,clientKey:key});draftId=draft.id;
    assert.equal((await request('/listings/draft','POST',{categoryId:category.id,clientKey:key})).id,draftId);
    await assert.rejects(()=>request('/listings/'+draftId,'GET',undefined,false),error=>error.status===404);
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
    const body=new FormData();body.append('file',new Blob([png],{type:'image/png'}),'smoke.png');
    const media=await request('/listings/'+draftId+'/images','POST',body);
    assert.equal((await fetch(media.url)).status,200);
    await assert.rejects(()=>request('/listings/'+draftId+'/media/'+media.id,'GET',undefined,false),error=>error.status===404);
    const saved=await request('/listings/'+draftId,'PUT',{revision:0,data:{...draft.data,title:'HTTP private smoke test',images:[media.id]}});
    assert.equal(saved.revision,1);
    await assert.rejects(()=>request('/listings/'+draftId,'PUT',{revision:0,data:draft.data}),error=>error.status===409);
    await assert.rejects(()=>request('/admin/listing-engine/templates/'+category.id+'/versions','POST',{definition:{...draft.template,reason:'This must be forbidden'}}),error=>error.status===403);
    console.log('PASS: HTTP login, category/template, draft replay, owner privacy, real private Storage upload/read, revision conflict and admin RBAC.');
  }finally{
    if(draftId){
      const row=(await db.query('SELECT id FROM listings WHERE id=$1 AND client_key=$2 AND product_id IS NULL',[draftId,key])).rows[0];
      if(row){
        const keys=(await db.query('SELECT storage_key FROM listing_images WHERE listing_id=$1 UNION ALL SELECT storage_key FROM listing_videos WHERE listing_id=$1',[draftId])).rows.map(item=>item.storage_key);
        if(keys.length){const {error}=await storage.storage.from('listing-media').remove(keys);if(error)throw new Error('Test storage cleanup failed; inspect the private smoke draft.');}
        await db.query('BEGIN');await db.query('DELETE FROM listing_field_values WHERE listing_id=$1',[draftId]);await db.query('DELETE FROM listing_images WHERE listing_id=$1',[draftId]);await db.query('DELETE FROM listing_videos WHERE listing_id=$1',[draftId]);await db.query('DELETE FROM listings WHERE id=$1 AND client_key=$2 AND product_id IS NULL',[draftId,key]);await db.query('COMMIT');
        console.log('Private smoke draft and test upload removed. No published products created.');
      }
    }
    await db.end();
  }
}
run().catch(error=>{console.error('HTTP smoke failed:',error.status??error.code??error.message);process.exitCode=1;});
