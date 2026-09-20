require('dotenv').config({ quiet: true });
const { Client } = require('pg');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const groups = require('../src/listings/seed-catalog.json');

async function run() {
  if (!process.argv.includes('--apply')) throw new Error('Use --apply to explicitly apply this additive DEV migration and seed.');
  if (process.env.NODE_ENV === 'production') throw new Error('Production migration requires a separately reviewed deployment.');
  const db = new Client({ connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized:false} });
  await db.connect();
  try {
    await db.query('BEGIN');
    await db.query("SELECT pg_advisory_xact_lock(hashtext('listing-engine-setup'))");
    await db.query('CREATE TABLE IF NOT EXISTS listing_engine_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
    const migration='20260920120000_listing_form_engine';
    if (!(await db.query('SELECT name FROM listing_engine_migrations WHERE name=$1',[migration])).rows.length) {
      await db.query(readFileSync(resolve(__dirname,'../prisma/migrations',migration,'migration.sql'),'utf8'));
      await db.query('INSERT INTO listing_engine_migrations(name) VALUES($1)',[migration]);
    }
    async function template(categoryId,name,fields,config) {
      if ((await db.query('SELECT id FROM listing_templates WHERE category_id=$1',[categoryId])).rows.length) return;
      const id=(await db.query('INSERT INTO listing_templates(category_id,version,name,config) VALUES($1,1,$2,$3::jsonb) RETURNING id',[categoryId,name,JSON.stringify(config)])).rows[0].id;
      for(const [index,field] of fields.entries()) {
        const fieldId=(await db.query('INSERT INTO listing_fields(template_id,key,label,type,required,enabled,sort_order,config) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb) RETURNING id',[id,field.key,field.label,field.type,field.required,field.enabled,index,JSON.stringify(field.config)])).rows[0].id;
        for(const [order,option] of field.options.entries()) await db.query('INSERT INTO listing_field_options(field_id,value,label,sort_order) VALUES($1,$2,$3,$4)',[fieldId,option.value,option.label,order]);
      }
    }
    for(const group of groups) {
      const groupId=(await db.query(`INSERT INTO categories(name,slug,is_listing_group,sort_order) VALUES($1,$2,true,$3)
        ON CONFLICT(slug) DO UPDATE SET is_listing_group=true RETURNING id`,[group.name,group.slug,group.order])).rows[0].id;
      await template(groupId,group.name,group.fields,group.config);
      for(const [index,child] of group.children.entries()) {
        const id=(await db.query(`INSERT INTO categories(name,slug,parent_id,sort_order) VALUES($1,$2,$3,$4)
          ON CONFLICT(slug) DO UPDATE SET parent_id=COALESCE(categories.parent_id,EXCLUDED.parent_id) RETURNING id`,[child.name,child.slug,groupId,index])).rows[0].id;
        await template(id,child.name,child.fields,group.config);
      }
    }
    await db.query('COMMIT');
    const storage=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
    const {data:bucket,error:lookupError}=await storage.storage.getBucket('listing-media');
    if (!bucket) {
      const {error}=await storage.storage.createBucket('listing-media',{public:false,fileSizeLimit:50*1024*1024,allowedMimeTypes:['image/jpeg','image/png','image/webp','video/mp4','video/webm']});
      if(error) throw new Error('Schema seeded; private media bucket could not be created. Check Storage permissions.');
    } else if(bucket.public) throw new Error('listing-media must be private. Review bucket access before uploads.');
    console.log('Listing engine ready: 12 groups, versioned templates, private media bucket. Existing listings preserved.');
  } catch(error) { await db.query('ROLLBACK').catch(()=>{}); console.error(error.code ? 'Setup failed with database code '+error.code : error.message); process.exitCode=1; }
  finally { await db.end(); }
}
run();
