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

  async getCategorySchema(categoryKeyOrId: string) {
    const key = categoryKeyOrId.toLowerCase();

    // Default dynamic attributes for Technology / Mobile / Laptop
    let attributes: Field[] = [
      {
        key: 'brand',
        label: 'Thương hiệu',
        type: 'select',
        required: true,
        enabled: true,
        options: [
          { value: 'apple', label: 'Apple / iPhone' },
          { value: 'samsung', label: 'Samsung' },
          { value: 'xiaomi', label: 'Xiaomi' },
          { value: 'oppo', label: 'Oppo' },
          { value: 'sony', label: 'Sony' },
          { value: 'canon', label: 'Canon' },
          { value: 'dell', label: 'Dell' },
          { value: 'hp', label: 'HP' },
          { value: 'lenovo', label: 'Lenovo' },
          { value: 'asus', label: 'Asus' }
        ],
        config: { placeholder: 'Chọn hãng sản xuất' }
      },
      {
        key: 'model',
        label: 'Model / Dòng máy',
        type: 'select',
        required: false,
        enabled: true,
        options: [
          // Apple
          { value: 'iphone_15_promax', label: 'iPhone 15 Pro Max', parentOptionId: 'apple' },
          { value: 'iphone_15_pro', label: 'iPhone 15 Pro', parentOptionId: 'apple' },
          { value: 'iphone_14_promax', label: 'iPhone 14 Pro Max', parentOptionId: 'apple' },
          { value: 'iphone_13', label: 'iPhone 13', parentOptionId: 'apple' },
          { value: 'macbook_air_m2', label: 'MacBook Air M2', parentOptionId: 'apple' },
          { value: 'macbook_pro_14', label: 'MacBook Pro 14"', parentOptionId: 'apple' },
          // Samsung
          { value: 'galaxy_s24_ultra', label: 'Galaxy S24 Ultra', parentOptionId: 'samsung' },
          { value: 'galaxy_s23_ultra', label: 'Galaxy S23 Ultra', parentOptionId: 'samsung' },
          { value: 'galaxy_z_fold5', label: 'Galaxy Z Fold5', parentOptionId: 'samsung' },
          // Sony
          { value: 'sony_a7iv', label: 'Alpha A7 IV', parentOptionId: 'sony' },
          { value: 'sony_a7iii', label: 'Alpha A7 III', parentOptionId: 'sony' },
          // Canon
          { value: 'canon_eos_r8', label: 'EOS R8', parentOptionId: 'canon' },
          { value: 'canon_eos_r50', label: 'EOS R50', parentOptionId: 'canon' }
        ],
        config: { placeholder: 'Chọn model' }
      },
      {
        key: 'storage',
        label: 'Dung lượng bộ nhớ',
        type: 'select',
        required: false,
        enabled: true,
        options: [
          { value: '128gb', label: '128 GB' },
          { value: '256gb', label: '256 GB' },
          { value: '512gb', label: '512 GB' },
          { value: '1tb', label: '1 TB' }
        ],
        config: { placeholder: 'Chọn dung lượng' }
      },
      {
        key: 'warranty',
        label: 'Chế độ bảo hành',
        type: 'select',
        required: false,
        enabled: true,
        options: [
          { value: 'expired', label: 'Hết bảo hành' },
          { value: '1_3m', label: 'Còn 1 - 3 tháng' },
          { value: '6_12m', label: 'Còn 6 - 12 tháng' },
          { value: 'official', label: 'Chính hãng còn bảo hành' }
        ],
        config: { placeholder: 'Tình trạng bảo hành' }
      }
    ];

    // Specific Attributes for Vehicles
    if (key.includes('xe') || key.includes('vehicles')) {
      attributes = [
        {
          key: 'brand',
          label: 'Hãng xe',
          type: 'select',
          required: true,
          enabled: true,
          options: [
            { value: 'honda', label: 'Honda' },
            { value: 'yamaha', label: 'Yamaha' },
            { value: 'toyota', label: 'Toyota' },
            { value: 'vinfast', label: 'VinFast' },
            { value: 'ford', label: 'Ford' },
            { value: 'hyundai', label: 'Hyundai' }
          ],
          config: { placeholder: 'Chọn hãng xe' }
        },
        {
          key: 'model',
          label: 'Dòng xe',
          type: 'select',
          required: true,
          enabled: true,
          options: [
            { value: 'vision', label: 'Vision', parentOptionId: 'honda' },
            { value: 'wave_alpha', label: 'Wave Alpha', parentOptionId: 'honda' },
            { value: 'sh_125i', label: 'SH 125i', parentOptionId: 'honda' },
            { value: 'air_blade', label: 'Air Blade', parentOptionId: 'honda' },
            { value: 'vios', label: 'Vios', parentOptionId: 'toyota' },
            { value: 'camry', label: 'Camry', parentOptionId: 'toyota' },
            { value: 'vf8', label: 'VF 8', parentOptionId: 'vinfast' }
          ],
          config: { placeholder: 'Chọn dòng xe' }
        },
        {
          key: 'year',
          label: 'Năm sản xuất',
          type: 'year',
          required: false,
          enabled: true,
          options: [],
          config: { min: 2000, max: 2026, placeholder: 'VD: 2022' }
        },
        {
          key: 'mileage',
          label: 'Số km đã đi',
          type: 'number',
          required: false,
          enabled: true,
          options: [],
          config: { unit: 'km', placeholder: 'VD: 15000' }
        },
        {
          key: 'fuel_type',
          label: 'Nhiên liệu',
          type: 'select',
          required: false,
          enabled: true,
          options: [
            { value: 'gasoline', label: 'Xăng' },
            { value: 'electric', label: 'Điện' },
            { value: 'diesel', label: 'Dầu Diesel' },
            { value: 'hybrid', label: 'Hybrid' }
          ],
          config: { placeholder: 'Loại nhiên liệu' }
        }
      ];
    }

    // Specific Attributes for Property (Nhà đất)
    if (key.includes('nha') || key.includes('property') || key.includes('bat-dong-san')) {
      attributes = [
        {
          key: 'area',
          label: 'Diện tích (m²)',
          type: 'number',
          required: true,
          enabled: true,
          options: [],
          config: { unit: 'm²', placeholder: 'VD: 85' }
        },
        {
          key: 'bedrooms',
          label: 'Số phòng ngủ',
          type: 'number',
          required: false,
          enabled: true,
          options: [],
          config: { placeholder: 'VD: 2' }
        },
        {
          key: 'bathrooms',
          label: 'Số phòng tắm',
          type: 'number',
          required: false,
          enabled: true,
          options: [],
          config: { placeholder: 'VD: 2' }
        },
        {
          key: 'legal_status',
          label: 'Tình trạng pháp lý',
          type: 'select',
          required: false,
          enabled: true,
          options: [
            { value: 'so_do', label: 'Sổ đỏ / Sổ hồng chính chủ' },
            { value: 'hop_dong', label: 'Hợp đồng mua bán' },
            { value: 'dang_cho_so', label: 'Đang chờ cấp sổ' }
          ],
          config: { placeholder: 'Giấy tờ pháp lý' }
        },
        {
          key: 'furnishing',
          label: 'Tình trạng nội thất',
          type: 'select',
          required: false,
          enabled: true,
          options: [
            { value: 'full', label: 'Đầy đủ nội thất cao cấp' },
            { value: 'basic', label: 'Nội thất cơ bản' },
            { value: 'raw', label: 'Bàn giao thô' }
          ],
          config: { placeholder: 'Nội thất' }
        }
      ];
    }

    // Specific Attributes for Jobs (Việc làm)
    if (key.includes('viec') || key.includes('jobs')) {
      attributes = [
        {
          key: 'job_title',
          label: 'Vị trí tuyển dụng',
          type: 'text',
          required: true,
          enabled: true,
          options: [],
          config: { placeholder: 'VD: Nhân viên tư vấn bán hàng' }
        },
        {
          key: 'employment_type',
          label: 'Hình thức làm việc',
          type: 'select',
          required: true,
          enabled: true,
          options: [
            { value: 'full_time', label: 'Toàn thời gian (Full-time)' },
            { value: 'part_time', label: 'Bán thời gian (Part-time)' },
            { value: 'shift', label: 'Theo ca' },
            { value: 'remote', label: 'Làm việc từ xa (Remote)' }
          ],
          config: { placeholder: 'Hình thức công việc' }
        },
        {
          key: 'experience',
          label: 'Yêu cầu kinh nghiệm',
          type: 'select',
          required: false,
          enabled: true,
          options: [
            { value: 'none', label: 'Không yêu cầu kinh nghiệm' },
            { value: 'under_1y', label: 'Dưới 1 năm' },
            { value: '1_3y', label: '1 - 3 năm kinh nghiệm' },
            { value: 'over_3y', label: 'Trên 3 năm kinh nghiệm' }
          ],
          config: { placeholder: 'Kinh nghiệm' }
        }
      ];
    }

    return envelope({
      category: { key, name: 'Danh mục tin đăng', slug: key },
      allowedIntents: ['sell', 'rent', 'giveaway', 'wanted_buy', 'wanted_rent', 'service_offer', 'job_offer'],
      priceModes: ['FIXED', 'CONTACT', 'FREE', 'HOUR', 'DAY', 'MONTH'],
      attributes
    });
  }

  async clearAndSeedDemo() {
    return this.db.transaction(async (client) => {
      // 1. Delete all existing products & listings
      await client.query('DELETE FROM product_images');
      await client.query('DELETE FROM listing_images');
      await client.query('DELETE FROM listing_videos');
      await client.query('DELETE FROM listing_publish_requests');
      await client.query('DELETE FROM listing_field_values');
      await client.query('DELETE FROM listings');
      await client.query('DELETE FROM products');

      // 2. Fetch active seller user ID
      const sellerRes = await client.query(`SELECT id, full_name FROM users WHERE status='ACTIVE' ORDER BY created_at LIMIT 1`);
      const sellerId = sellerRes.rows[0]?.id;
      const sellerName = sellerRes.rows[0]?.full_name || 'Thành viên Tất Tần Tật';

      if (!sellerId) throw new BadRequestException('Chưa có tài khoản người dùng để gán tin đăng.');

      // Fetch first category ID
      const catRes = await client.query(`SELECT id FROM categories WHERE status='ACTIVE' LIMIT 1`);
      const categoryId = catRes.rows[0]?.id || 1;

      // 3. Seed 8 new high quality demo listings across categories
      const demoItems = [
        {
          title: 'iPhone 15 Pro Max 256GB Titanium Tự Nhiên VN/A',
          price: '26500000',
          priceMode: 'FIXED',
          condition: 'USED_GOOD',
          description: 'Máy chính chủ mua tại FPT Shop còn nguyên hộp, hoá đơn đầy đủ. Ngoại hình mới 98%, pin 92%. Bao test thoải mái tại nhà Quy Nhơn.',
          address: 'Quy Nhơn, Bình Định',
          img: '/assets/product-1.jpg'
        },
        {
          title: 'Xe máy Honda Vision 2023 màu trắng chính chủ biển Quy Nhơn',
          price: '29800000',
          priceMode: 'FIXED',
          condition: 'LIKE_NEW',
          description: 'Xe nữ chạy giữ kỹ mới đi 8.500 km. Đã dán keo nguyên xe, thay dầu định kỳ tại hãng. Giấy tờ chính chủ sang tên trong ngày.',
          address: 'Quy Nhơn, Bình Định',
          img: '/assets/product-2.jpg'
        },
        {
          title: 'Căn hộ chung cư 2PN FLC Sea Tower Quy Nhơn View biển cực đẹp',
          price: '2200000000',
          priceMode: 'FIXED',
          condition: 'NEW',
          description: 'Căn hộ tầng trung view biển thoáng mát, diện tích 72m² đã trang bị đầy đủ nội thất cao cấp. Pháp lý sổ hồng chính chủ mua vào ở ngay.',
          address: 'Quy Nhơn, Bình Định',
          img: '/assets/product-3.jpg'
        },
        {
          title: 'MacBook Air M2 8GB/256GB Space Gray chính hãng mới 99%',
          price: '21500000',
          priceMode: 'FIXED',
          condition: 'USED_GOOD',
          description: 'Máy dùng văn phòng giữ gìn cẩn thận, pin sạc 45 lần. Kèm sạc cáp zin và túi chống sốc cao cấp. Bảo hành trách nhiệm 1 tháng.',
          address: 'Quy Nhơn, Bình Định',
          img: '/assets/product-4.jpg'
        },
        {
          title: 'Tuyển 02 Nhân viên tư vấn bán hàng thời trang tại Quy Nhơn',
          price: '8500000',
          priceMode: 'FIXED',
          condition: 'NEW',
          description: 'Cần tuyển nhân viên bán hàng xoay ca hoặc cố định. Lương cứng 8.5 triệu + thưởng doanh số. Được đào tạo kỹ năng bài bản.',
          address: 'Quy Nhơn, Bình Định',
          img: '/assets/product-5.jpg'
        },
        {
          title: 'Tặng miễn phí Bàn học sinh gỗ công nghiệp còn mới cho bạn nhỏ',
          price: '0',
          priceMode: 'FREE',
          condition: 'USED_GOOD',
          description: 'Gia đình chuyển nhà không dùng đến cần tặng lại bàn học có kệ sách cho gia đình khó khăn. Vui lòng tự chuẩn bị xe chở.',
          address: 'Quy Nhơn, Bình Định',
          img: '/assets/product-6.jpg'
        },
        {
          title: 'Dịch vụ sửa chữa & bảo dưỡng điều hòa, tủ lạnh tận nhà Quy Nhơn',
          price: '0',
          priceMode: 'CONTACT',
          condition: 'NEW',
          description: 'Chuyên nhận nạp ga, vệ sinh, sửa chữa điều hòa, máy giặt, tủ lạnh giá bình dân. Báo giá công khai trước khi làm, bảo hành chu đáo.',
          address: 'Quy Nhơn, Bình Định',
          img: '/assets/product-1.jpg'
        },
        {
          title: 'Hải sản tươi sống Quy Nhơn: Cua huỳnh đế, Mực lá, Cua gạch',
          price: '350000',
          priceMode: 'FIXED',
          condition: 'NEW',
          description: 'Hải sản đánh bắt trong ngày tại đầm Thị Nại & Nhơn Lý. Đảm bảo tươi ngon, đóng thùng xốp giao tận nơi nội thành Quy Nhơn.',
          address: 'Quy Nhơn, Bình Định',
          img: '/assets/product-2.jpg'
        }
      ];

      const inserted = [];
      for (const item of demoItems) {
        const slug = `demo-${Math.random().toString(36).slice(2, 9)}`;
        const res = await client.query<{ id: string }>(
          `INSERT INTO products (seller_id, category_id, title, slug, description, price, condition, status, published_at, address, listing_price_mode)
           VALUES ($1, $2, $3, $4, $5, $6, $7::product_condition, 'ACTIVE', NOW(), $8, $9) RETURNING id`,
          [sellerId, categoryId, item.title, slug, item.description, item.price, item.condition, item.address, item.priceMode],
        );
        const prodId = res.rows[0].id;
        await client.query('INSERT INTO product_images (product_id, url, sort_order) VALUES ($1, $2, 0)', [prodId, item.img]);
        inserted.push(prodId);
      }

      return envelope({ message: 'Đã xóa toàn bộ dữ liệu tin đăng cũ và khởi tạo lại 8 tin đăng Demo thành công!', count: inserted.length });
    });
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
    let uploadedKey:string|undefined;
    try {
      return await this.db.transaction(async client=>{
        await this.owned(client,id,sellerId);
        const count=(await client.query(`SELECT count(*)::integer AS count FROM listing_${kind} WHERE listing_id=$1`,[id])).rows[0].count;
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
