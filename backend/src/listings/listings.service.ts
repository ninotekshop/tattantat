import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { PoolClient, QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';
import { ListingMediaService } from './listing-media.service';
import { type ListingData, type Template, type Field, publicData, validateListing, validateTemplate, uuid } from './listing-domain';

type Row = {id:string;seller_id:string;category_id:string;template_id:string;template_snapshot:Template;data:ListingData;revision:number;status:string;product_id:string|null;published_snapshot:{data:ListingData;template:Template}|null};
const envelope = <T>(data:T) => ({success:true,data,message:null,errorCode:null});
const invalid = (errors:Record<string,string>):never => { throw new BadRequestException({success:false,message:Object.values(errors)[0],errors,errorCode:'LISTING_VALIDATION'}); };

@Injectable()
export class ListingsService {
  constructor(private readonly db:DatabaseService, private readonly media:ListingMediaService) {}
  async categories() {
    return envelope((await this.db.query(`SELECT id::text,parent_id::text AS "parentId",name,slug,is_listing_group AS "isGroup" FROM categories WHERE status='ACTIVE' ORDER BY sort_order,name`)).rows);
  }
  async category(id:string) {
    const row=(await this.db.query('SELECT id::text,name,slug,parent_id::text AS "parentId" FROM categories WHERE id=$1 AND status=$2',[id,'ACTIVE'])).rows[0];
    if(!row) throw new NotFoundException('Không tìm thấy danh mục.');
    return envelope(row);
  }
  async template(categoryId:string, client?:PoolClient):Promise<Template> {
    const db={query:<T extends QueryResultRow>(sql:string,values:unknown[]=[])=>client?client.query<T>(sql,values):this.db.query<T>(sql,values)};
    const row=(await db.query(`WITH RECURSIVE tree AS (
      SELECT id,parent_id,0 AS depth FROM categories WHERE id=$1 AND status='ACTIVE'
      UNION ALL SELECT c.id,c.parent_id,t.depth+1 FROM categories c JOIN tree t ON c.id=t.parent_id WHERE t.depth<10 AND c.status='ACTIVE'
    ) SELECT l.* FROM tree t JOIN listing_templates l ON l.category_id=t.id AND l.active ORDER BY t.depth LIMIT 1`,[categoryId])).rows[0];
    if(!row) throw new NotFoundException('Danh mục chưa có biểu mẫu đăng tin.');
    const fields=(await db.query(`SELECT f.key,f.label,f.type,f.required,f.enabled,f.config,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('value',o.value,'label',o.label) ORDER BY o.sort_order) FROM listing_field_options o WHERE o.field_id=f.id),'[]'::jsonb) AS options
      FROM listing_fields f WHERE template_id=$1 ORDER BY sort_order`,[row.id])).rows as Field[];
    return {id:row.id,categoryId,version:row.version,name:row.name,config:row.config,fields};
  }
  async fields(id:string) {
    const result=await this.db.query('SELECT category_id::text FROM listing_templates WHERE id=$1 AND active',[id]);
    if(!result.rows[0]) throw new NotFoundException('Biểu mẫu không hoạt động.');
    return envelope((await this.template(result.rows[0].category_id)).fields);
  }
  async create(sellerId:string, categoryId:string, clientKey:string) {
    const id=await this.db.transaction(async client=>{
      await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[sellerId]);
      const existing=(await client.query('SELECT id,category_id::text FROM listings WHERE seller_id=$1 AND client_key=$2',[sellerId,clientKey])).rows[0];
      if(existing) { if(existing.category_id!==categoryId) throw new ConflictException('Khóa tạo nháp đã dùng cho danh mục khác.'); return existing.id as string; }
      const count=await client.query(`SELECT count(*)::integer AS count FROM listings WHERE seller_id=$1 AND status='DRAFT'`,[sellerId]);
      if(count.rows[0].count>=100) throw new BadRequestException('Bạn đã có 100 bản nháp. Hãy hoàn thiện các bản nháp hiện tại.');
      const template=await this.template(categoryId,client);
      const result=await client.query(`INSERT INTO listings(seller_id,category_id,template_id,template_snapshot,client_key,data)
        VALUES($1,$2,$3,$4::jsonb,$5,$6::jsonb) RETURNING id`,[sellerId,categoryId,template.id,JSON.stringify(template),clientKey,JSON.stringify({values:{},images:[],videos:[],priceMode:template.config.priceModes[0],condition:'USED_GOOD',location:{hideExact:true}})]);
      return result.rows[0].id as string;
    });
    return this.get(id,sellerId);
  }
  async mine(sellerId:string) {
    return envelope((await this.db.query(`SELECT id,category_id::text AS "categoryId",data->>'title' AS title,status,revision,updated_at AS "updatedAt",product_id AS "productId" FROM listings WHERE seller_id=$1 ORDER BY updated_at DESC LIMIT 100`,[sellerId])).rows);
  }
  async byProduct(productId:string,sellerId:string) {
    // Ownership applies even for legacy products and hidden listings. Do not infer
    // "legacy" from a failed public lookup, or from the paginated draft list.
    const result=await this.db.query(`SELECT l.id FROM products p LEFT JOIN listings l ON l.product_id=p.id AND l.seller_id=p.seller_id
      WHERE p.id=$1 AND p.seller_id=$2 AND p.deleted_at IS NULL`,[productId,sellerId]);
    if(!result.rows.length) throw new NotFoundException('Không tìm thấy tin đăng của bạn.');
    return envelope({listingId:result.rows[0].id??null});
  }
  private async owned(client:PoolClient,id:string,sellerId:string):Promise<Row> {
    const row=(await client.query<Row>('SELECT * FROM listings WHERE id=$1 AND seller_id=$2 FOR UPDATE',[id,sellerId])).rows[0];
    if(!row) throw new NotFoundException('Không tìm thấy tin đăng của bạn.');
    return row;
  }
  async get(id:string,viewerId?:string,publicView=false) {
    const row=(await this.db.query<Row>('SELECT * FROM listings WHERE id=$1',[id])).rows[0];
    if(!row) throw new NotFoundException('Không tìm thấy tin đăng.');
    const owner=viewerId===row.seller_id&&!publicView;
    if(!owner) await this.requirePublic(row,viewerId);
    const data=owner?row.data:publicData(row.published_snapshot!.data,row.published_snapshot!.template);
    const template=owner?row.template_snapshot:row.published_snapshot!.template;
    const media=await this.mediaPayload(id,data,owner);
    return envelope({id:row.id,categoryId:row.category_id,revision:owner?row.revision:undefined,status:owner?row.status:'PUBLISHED',productId:row.product_id,template,data,media,owner});
  }
  private async requirePublic(row:Row,viewerId?:string) {
    if(!row.published_snapshot||!row.product_id) throw new NotFoundException('Tin đăng chưa được công khai.');
    const available=await this.db.query(`SELECT id FROM products p WHERE id=$1 AND status='ACTIVE' AND deleted_at IS NULL AND NOT EXISTS (
      SELECT 1 FROM user_blocks b WHERE $2::uuid IS NOT NULL AND ((b.blocker_id=$2 AND b.blocked_id=p.seller_id) OR (b.blocker_id=p.seller_id AND b.blocked_id=$2)))`,[row.product_id,viewerId??null]);
    if(!available.rows.length) throw new NotFoundException('Tin đăng không khả dụng.');
  }
  private async mediaPayload(id:string,data:ListingData,owner:boolean) {
    const result:{id:string;kind:string;url:string}[]=[];
    for(const kind of ['images','videos'] as const) {
      const rows=(await this.db.query<{id:string;storage_key:string}>(`SELECT id,storage_key FROM listing_${kind} WHERE listing_id=$1 AND ($3::boolean OR id=ANY($2::uuid[])) ORDER BY created_at`,[id,data[kind]??[],owner])).rows;
      // Owners can recover uploads interrupted before the next autosave.
      const ids=owner?[...(data[kind]??[]),...rows.map(item=>item.id).filter(id=>!data[kind]?.includes(id))]:data[kind]??[];
      for(const mediaId of ids) {
        const item=rows.find(row=>row.id===mediaId);
        if(item) result.push({id:item.id,kind,url:owner?await this.media.signed(item.storage_key):this.mediaPath(id,item.id)});
      }
    }
    return result;
  }
  private mediaPath(listingId:string,mediaId:string) { return '/'+(process.env.API_PREFIX??'api/v1')+'/listings/'+listingId+'/media/'+mediaId; }
  async publicMedia(id:string,mediaId:string) {
    const row=(await this.db.query<Row>('SELECT * FROM listings WHERE id=$1',[id])).rows[0];
    if(!row) throw new NotFoundException();
    await this.requirePublic(row);
    const snapshot=row.published_snapshot!.data;
    const kind=snapshot.images?.includes(mediaId)?'images':snapshot.videos?.includes(mediaId)?'videos':null;
    if(!kind) throw new NotFoundException();
    const item=(await this.db.query<{storage_key:string}>(`SELECT storage_key FROM listing_${kind} WHERE id=$1 AND listing_id=$2`,[mediaId,id])).rows[0];
    if(!item) throw new NotFoundException();
    return this.media.signed(item.storage_key);
  }
  async save(id:string,sellerId:string,revision:number,data:ListingData) {
    return this.db.transaction(async client=>{
      const row=await this.owned(client,id,sellerId);
      if(row.revision!==revision) throw new ConflictException('Bản nháp đã thay đổi ở cửa sổ khác. Hãy tải lại trước khi lưu.');
      const errors=validateListing(data,row.template_snapshot,false);
      if(Object.keys(errors).length) invalid(errors);
      await this.checkMedia(client,id,data);
      const updated=await client.query(`UPDATE listings SET data=$2::jsonb,revision=revision+1,status='DRAFT',updated_at=now() WHERE id=$1 RETURNING revision`,[id,JSON.stringify(data)]);
      await client.query('DELETE FROM listing_field_values WHERE listing_id=$1',[id]);
      for(const [key,value] of Object.entries(data.values??{})) await client.query('INSERT INTO listing_field_values(listing_id,field_key,value) VALUES($1,$2,$3::jsonb)',[id,key,JSON.stringify(value)]);
      return envelope({id,revision:updated.rows[0].revision});
    });
  }
  private async checkMedia(client:PoolClient,id:string,data:ListingData) {
    for(const kind of ['images','videos'] as const) {
      const ids=data[kind]??[];
      const result=await client.query(`SELECT id FROM listing_${kind} WHERE listing_id=$1 AND id=ANY($2::uuid[])`,[id,ids]);
      if(result.rows.length!==ids.length) invalid({[kind]:'Tệp không thuộc tin đăng này.'});
    }
  }
  async upload(id:string,sellerId:string,kind:'images'|'videos',file:{buffer:Buffer;mimetype:string}) {
    // Hold ownership/count lock through upload; compensate storage if DB commit fails.
    let uploadedKey:string|undefined;
    try {
      return await this.db.transaction(async client=>{
        await this.owned(client,id,sellerId);
        const count=(await client.query(`SELECT count(*)::integer AS count FROM listing_${kind} WHERE listing_id=$1`,[id])).rows[0].count;
        // Keep room for a complete replacement while the published version still owns its media.
        if(count>=(kind==='images'?40:6)) throw new BadRequestException('Kho tệp của tin đã đầy. Hãy xóa các tệp chưa dùng trước khi tải thêm.');
        const uploaded=await this.media.upload(sellerId,id,kind,file); uploadedKey=uploaded.key;
        const result=await client.query(`INSERT INTO listing_${kind}(listing_id,storage_key,mime_type,byte_size) VALUES($1,$2,$3,$4) RETURNING id`,[id,uploaded.key,uploaded.mime,uploaded.size]);
        return envelope({id:result.rows[0].id,kind,url:await this.media.signed(uploaded.key)});
      });
    } catch(error) { if(uploadedKey) await this.media.remove(uploadedKey).catch(()=>undefined); throw error; }
  }
  async removeMedia(id:string,mediaId:string,sellerId:string) {
    return this.db.transaction(async client=>{
      const row=await this.owned(client,id,sellerId);
      if([...(row.published_snapshot?.data.images??[]),...(row.published_snapshot?.data.videos??[])].includes(mediaId)) throw new ConflictException('Tệp đang dùng trong tin công khai; bỏ tệp khỏi bản nháp rồi đăng lại trước khi xóa.');
      if([...(row.data.images??[]),...(row.data.videos??[])].includes(mediaId)) throw new ConflictException('Hãy lưu bản nháp không chứa tệp này trước khi xóa.');
      for(const kind of ['images','videos'] as const) {
        const media=(await client.query<{storage_key:string}>(`DELETE FROM listing_${kind} WHERE id=$1 AND listing_id=$2 RETURNING storage_key`,[mediaId,id])).rows[0];
        if(media) await this.media.remove(media.storage_key);
      }
      return envelope({id:mediaId});
    });
  }
  async publish(id:string,sellerId:string,revision:number,key:string) {
    if(!uuid(key)) throw new BadRequestException('Cần Idempotency-Key dạng UUID.');
    return this.db.transaction(async client=>{
      const row=await this.owned(client,id,sellerId);
      // Seller lock also serializes cross-listing uses of the same idempotency key.
      await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[sellerId]);
      const previous=(await client.query('SELECT * FROM listing_publish_requests WHERE seller_id=$1 AND key=$2',[sellerId,key])).rows[0];
      if(previous) {
        if(previous.listing_id!==id||previous.revision!==revision) throw new ConflictException('Idempotency-Key đã được dùng cho yêu cầu khác.');
        return envelope({id,productId:previous.product_id,status:'PUBLISHED'});
      }
      if(row.revision!==revision) throw new ConflictException('Bản nháp đã thay đổi. Hãy xem trước bản mới nhất.');
      const errors=validateListing(row.data,row.template_snapshot,true);
      if(Object.keys(errors).length) invalid(errors);
      await this.checkMedia(client,id,row.data);
      const data=row.data;
      const price=['CONTACT','FREE'].includes(data.priceMode!)?'0':data.price!;
      const location=data.location!;
      const address=[...(location.hideExact!==false?[]:[location.address]),location.ward,location.district,location.province].filter(Boolean).join(', ');
      let productId=row.product_id;
      if(!productId) {
        const plan=(await client.query(`SELECT max_listings_snapshot AS max FROM subscriptions WHERE seller_id=$1 AND status='ACTIVE' AND (ends_at IS NULL OR ends_at>now()) ORDER BY created_at DESC LIMIT 1`,[sellerId])).rows[0];
        const max=plan?plan.max:10;
        const count=(await client.query(`SELECT count(*)::integer AS count FROM products WHERE seller_id=$1 AND status IN ('DRAFT','PENDING_REVIEW','ACTIVE','RESERVED') AND deleted_at IS NULL`,[sellerId])).rows[0].count;
        if(max!==null&&count>=max) throw new BadRequestException('Bạn đã đạt giới hạn tin đăng của gói hiện tại.');
        productId=(await client.query(`INSERT INTO products(seller_id,category_id,title,slug,description,price,condition,status,published_at,address,listing_price_mode,listing_negotiable)
          VALUES($1,$2,$3,$4,$5,$6,$7::product_condition,'ACTIVE',now(),$8,$9,$10) RETURNING id`,[sellerId,row.category_id,data.title!.trim(),'listing-'+id,data.description,price,data.condition,address,data.priceMode,data.negotiable??false])).rows[0].id;
      } else {
        const updated=await client.query(`UPDATE products SET title=$3,description=$4,price=$5,condition=$6::product_condition,address=$7,listing_price_mode=$8,listing_negotiable=$9,updated_at=now()
          WHERE id=$1 AND seller_id=$2 AND status IN ('ACTIVE','HIDDEN') AND deleted_at IS NULL RETURNING id`,[productId,sellerId,data.title!.trim(),data.description,price,data.condition,address,data.priceMode,data.negotiable??false]);
        if(!updated.rows.length) throw new ConflictException('Tin đang có giao dịch hoặc không thể chỉnh sửa.');
      }
      await client.query('DELETE FROM product_images WHERE product_id=$1',[productId]);
      for(const [index,mediaId] of data.images!.entries()) await client.query('INSERT INTO product_images(product_id,url,sort_order) VALUES($1,$2,$3)',[productId,this.mediaPath(id,mediaId),index]);
      await client.query(`UPDATE listings SET product_id=$2,status='PUBLISHED',published_snapshot=$3::jsonb,published_at=now(),updated_at=now() WHERE id=$1`,[id,productId,JSON.stringify({data,template:row.template_snapshot})]);
      await client.query('INSERT INTO listing_publish_requests(seller_id,key,listing_id,revision,product_id) VALUES($1,$2,$3,$4,$5)',[sellerId,key,id,revision,productId]);
      await this.audit(client,sellerId,'LISTING_PUBLISHED',id,{revision,productId});
      return envelope({id,productId,status:'PUBLISHED'});
    });
  }
  async adminVersion(actorId:string,categoryId:string,input:{name:string;fields:Field[];config:Template['config'];reason:string}) {
    const error=validateTemplate(input);
    if(error) throw new BadRequestException(error);
    if(typeof input.reason!=='string'||input.reason.trim().length<3||input.reason.length>500) throw new BadRequestException('Cần lý do thay đổi từ 3 đến 500 ký tự.');
    return this.db.transaction(async client=>{
      const category=await client.query(`SELECT id FROM categories WHERE id=$1 AND status='ACTIVE' FOR UPDATE`,[categoryId]);
      if(!category.rows.length) throw new NotFoundException('Danh mục không tồn tại.');
      const version=Number((await client.query('SELECT COALESCE(max(version),0)+1 AS version FROM listing_templates WHERE category_id=$1',[categoryId])).rows[0].version);
      await client.query('UPDATE listing_templates SET active=false WHERE category_id=$1 AND active',[categoryId]);
      const id=(await client.query('INSERT INTO listing_templates(category_id,version,name,config,created_by) VALUES($1,$2,$3,$4::jsonb,$5) RETURNING id',[categoryId,version,input.name.trim(),JSON.stringify(input.config),actorId])).rows[0].id;
      for(const [index,field] of input.fields.entries()) {
        const fieldId=(await client.query('INSERT INTO listing_fields(template_id,key,label,type,required,enabled,sort_order,config) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb) RETURNING id',[id,field.key,field.label,field.type,field.required,field.enabled,index,JSON.stringify(field.config)])).rows[0].id;
        for(const [order,option] of field.options.entries()) await client.query('INSERT INTO listing_field_options(field_id,value,label,sort_order) VALUES($1,$2,$3,$4)',[fieldId,option.value,option.label,order]);
      }
      await this.audit(client,actorId,'TEMPLATE_VERSION_CREATED',id,{categoryId,version,reason:input.reason});
      return envelope(await this.template(categoryId,client));
    });
  }
  async adminCategory(actorId:string,name:string,slug:string,parentId?:string) {
    if(!name.trim()||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new BadRequestException('Tên hoặc mã danh mục không hợp lệ.');
    return this.db.transaction(async client=>{
      if(parentId && !(await client.query('SELECT id FROM categories WHERE id=$1 AND status=$2',[parentId,'ACTIVE'])).rows.length) throw new BadRequestException('Danh mục cha không tồn tại.');
      const created=await client.query('INSERT INTO categories(name,slug,parent_id,is_listing_group) VALUES($1,$2,$3,$4) ON CONFLICT(slug) DO NOTHING RETURNING id::text,name,slug',[name.trim(),slug,parentId??null,!parentId]);
      if(!created.rows[0]) throw new ConflictException('Mã danh mục đã tồn tại.');
      await this.audit(client,actorId,'CATEGORY_CREATED',created.rows[0].id,{parentId});
      return envelope(created.rows[0]);
    });
  }
  private async audit(client:PoolClient,actor:string,action:string,id:string,detail:unknown) { await client.query('INSERT INTO listing_audit_logs(actor_id,action,entity_id,detail) VALUES($1,$2,$3,$4::jsonb)',[actor,action,id,JSON.stringify(detail)]); }
}
