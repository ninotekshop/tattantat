// Fictional DEV fixtures. Prices/specifications are test inputs, not market offers.
const {createHash}=require('node:crypto');
const {visible,validateListing}=require('../dist/listings/listing-domain');
const batch='demo-catalog-v1';
function stableId(key){const h=createHash('sha256').update(batch+':'+key).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;}
const photos={
  house:'1600585154340-be6161a56a0c',books:'1507842217343-583bb7270b66',tools:'1504148455328-c376907d081c',
  pet:'1552053831-71594a27632d',baby:'1519689680058-324335c77eba',camera:'1516035069371-29a1b244cc32',
  guitar:'1510915361894-db8b60106cb1',game:'1606144042614-b2417e99c4e3',bike:'1485965120184-e220f721d03e',
  truck:'1519003722824-194d4455a60c',office:'1497366754035-f200968a6e72',kitchen:'1556911220-bff31c812dba',
};
// Each row: representative title, base VND, sample product IDs OR illustration theme.
const entries={
  'do-cong-nghe':['Thiết bị công nghệ cho học tập',8500000,[123,159,78]],
  'dien-thoai':['Điện thoại thông minh',4200000,[123,133,125]],
  iphone:['iPhone',5900000,[123,124,122]],samsung:['Samsung Galaxy',3200000,[133,132,131]],
  xiaomi:['Xiaomi Redmi - ảnh minh họa điện thoại',3900000,[128,129,130]],oppo:['OPPO',2900000,[125,126,127]],
  laptop:['Laptop học tập và làm việc',14500000,[78,82,81]],macbook:['MacBook Pro',22500000,[78]],
  dell:['Dell XPS',13900000,[82]],hp:['HP Pavilion - ảnh minh họa laptop',12900000,[80]],
  lenovo:['Lenovo Yoga',11900000,[81]],asus:['ASUS Zenbook',15900000,[79]],
  'may-tinh-bang':['Máy tính bảng',6900000,[159,160,161]],'may-tinh-de-ban':['Bộ máy tính bàn văn phòng',8500000,'office'],
  'may-anh':['Máy ảnh kỹ thuật số kèm ống kính',12500000,'camera'],'may-quay':['Máy quay phục vụ sáng tạo nội dung',16500000,'camera'],
  tv:['TV thông minh 43 inch',6500000,'kitchen'],'thiet-bi-am-thanh':['Loa và tai nghe',1900000,[99,101,103]],
  'phu-kien-cong-nghe':['Phụ kiện điện thoại',350000,[104,105,108]],'may-choi-game':['Máy chơi game kèm tay cầm',6900000,'game'],
  'dong-ho-thong-minh':['Đồng hồ thông minh',2300000,[106]],'do-dien-tu':['Thiết bị điện tử gia đình',2500000,[99,103,101]],
  'xe-co':['Xe phục vụ đi lại',450000000,[167,169,171]],'o-to':['Ô tô gia đình',520000000,[167,168,170]],
  'xe-may':['Xe máy đã kiểm tra vận hành',29000000,[116,113,114]],'xe-dien':['Xe điện đô thị - ảnh minh họa xe',245000000,[169]],
  'xe-tai':['Xe tải chở hàng 2,5 tấn',325000000,'truck'],'xe-ban-tai':['Xe bán tải phục vụ kinh doanh',465000000,'truck'],
  'xe-khach':['Xe khách hợp đồng 16 chỗ',650000000,'truck'],'xe-dap':['Xe đạp thể thao',3500000,'bike'],
  'phu-tung-xe':['Bộ dụng cụ và phụ tùng bảo dưỡng xe',650000,'tools'],
  'bat-dong-san':['Nhà ở khu dân cư yên tĩnh',2850000000,'house'],'ban-nha':['Nhà 2 tầng, 3 phòng ngủ',2850000000,'house'],
  'ban-dat':['Lô đất 100 m² - ảnh minh họa khu dân cư',1650000000,'house'],'can-ho':['Căn hộ 2 phòng ngủ',1750000000,'house'],
  'phong-tro':['Phòng trọ có nội thất cơ bản',2500000,'house'],'cho-thue-nha':['Nhà nguyên căn 2 tầng',7500000,'house'],
  'cho-thue-mat-bang':['Mặt bằng kinh doanh 60 m²',6500000,'office'],'van-phong':['Văn phòng làm việc 45 m²',8500000,'office'],
  'bat-dong-san-khac':['Không gian làm việc kết hợp kho',12500000,'office'],
  'do-gia-dung':['Nội thất gia đình',3500000,[12,13,11]],sofa:['Sofa phòng khách',4500000,[12]],
  'ban-ghe':['Bàn ghế làm việc',1750000,[14,13,14]],tu:['Tủ lưu trữ trong nhà - ảnh minh họa nội thất',2900000,[15]],
  giuong:['Giường ngủ gỗ',5500000,[11]],'tu-lanh':['Tủ lạnh 250 lít - ảnh minh họa nhà bếp',4900000,'kitchen'],
  'may-giat':['Máy giặt 9 kg - ảnh minh họa gia dụng',4200000,'kitchen'],'dieu-hoa':['Điều hòa 1 HP - ảnh minh họa không gian',5900000,'office'],
  'thiet-bi-nha-bep':['Thiết bị và dụng cụ nhà bếp',750000,[51,66,71]],
  'thoi-trang':['Trang phục thường ngày',250000,[83,85,87]],'quan-ao':['Áo sơ mi',220000,[83,85,86]],
  'giay-dep':['Giày thể thao',790000,[88,90,91]],'tui-xach':['Túi xách',550000,[172,173,176]],
  'thoi-trang-dong-ho':['Đồng hồ đeo tay',1250000,[93,194,193]],'phu-kien-thoi-trang':['Kính và phụ kiện',180000,[154,155,158]],
  'the-thao':['Dụng cụ vận động ngoài trời',390000,[140,147,152]],'dung-cu-the-thao':['Dụng cụ thể thao',250000,[140,147,152]],
  playstation:['PlayStation kèm tay cầm - ảnh minh họa gaming',6500000,'game'],xbox:['Xbox kèm tay cầm - ảnh minh họa gaming',5900000,'game'],
  nintendo:['Nintendo kèm phụ kiện - ảnh minh họa gaming',4900000,'game'],'nhac-cu':['Đàn guitar acoustic',2200000,'guitar'],
  'do-choi':['Bộ đồ chơi vận động với bóng',190000,[140,147,153]],
  'sach-van-phong-pham':['Bộ sách học tập',180000,'books'],sach:['Sách đọc cuối tuần',95000,'books'],
  'giao-trinh':['Giáo trình tự học',145000,'books'],'do-dung-hoc-tap':['Bộ sách và sổ ghi chép',75000,'books'],
  'may-moc-cong-cu':['Bộ công cụ sửa chữa',950000,'tools'],'may-moc-cong-nghiep':['Máy khoan bàn - ảnh minh họa công cụ',6900000,'tools'],
  'dung-cu':['Bộ dụng cụ cầm tay',650000,'tools'],'thiet-bi-xay-dung':['Bộ công cụ thi công',4500000,'tools'],
  'thiet-bi-dien':['Bộ thiết bị kiểm tra điện',850000,'tools'],
  'do-suu-tam':['Vật phẩm trang trí sưu tầm',650000,[44,45,46]],'suu-tam-dong-ho':['Đồng hồ sưu tầm - bản mẫu',2500000,[94,93,194]],
  'do-co':['Đồ trang trí phong cách cổ điển, không chứng nhận cổ vật',850000,[43,44,46]],
  'mo-hinh':['Mô hình trang trí nhà và cây',350000,[45,46,45]],tem:['Bộ tem chủ đề sách - ảnh minh họa bộ sưu tập',150000,'books'],
  'vat-pham-suu-tam':['Vật phẩm trang trí sưu tầm',450000,[44,45,46]],
  'thu-cung':['Thú cưng gia đình - hồ sơ giả lập',2500000,'pet'],'thu-cung-canh':['Chó cảnh gia đình - hồ sơ giả lập',2500000,'pet'],
  'phu-kien-thu-cung':['Phụ kiện chăm sóc thú cưng - ảnh minh họa',180000,'pet'],'thuc-an-thu-cung':['Thức ăn thú cưng',250000,[18,22,18]],
  'me-va-be':['Đồ dùng chăm sóc bé - ảnh minh họa',390000,'baby'],
  khac:['Đồ trang trí gia đình',250000,[44,46,47]],'hang-hoa-khac':['Đồ trang trí tiện ích',250000,[44,46,47]],
  'dich-vu':['Gói hỗ trợ sửa chữa tại nhà',350000,'tools'],'sua-chua':['Sửa chữa thiết bị tại nhà',250000,'tools'],
  'van-chuyen':['Vận chuyển hàng nội thành',450000,'truck'],'thiet-ke':['Thiết kế nội thất theo yêu cầu',1500000,'office'],
  'cho-thue':['Cho thuê bộ công cụ theo ngày',150000,'tools'],'dich-vu-ca-nhan':['Hỗ trợ sắp xếp không gian sống',250000,'house'],
  'dich-vu-doanh-nghiep':['Hỗ trợ bố trí văn phòng',1800000,'office'],
};

function sample(category,index,catalog){
  const entry=entries[category.slug];if(!entry)throw new Error('No curated demo sample for '+category.slug);
  const [name,base,asset]=entry,product=Array.isArray(asset)?catalog.find(p=>p.id===asset[index%asset.length]):null;
  if(Array.isArray(asset)&&!product)throw new Error('Missing image catalogue product for '+category.slug);
  const photo=typeof asset==='string'?photos[asset]:null;
  const images=product?product.images.slice(0,2):[0,1].map(view=>`https://images.unsplash.com/photo-${photo}?fm=jpg&fit=crop&w=1000&h=${view?750:800}&q=80`);
  return {name,model:product?.title??name,brand:product?.brand??'Mẫu thử Tất Tần Tật',price:(BigInt(base)*BigInt([100,110,90][index])/100n).toString(),images,source:product?'https://dummyjson.com/docs/products':'https://unsplash.com',index};
}
function valueFor(field,s,category){
  const n=s.index;
  const words={brand:s.brand,model:s.model,origin:'Thông tin xuất xứ giả lập để thử ứng dụng',warranty:['3 tháng (demo)','6 tháng (demo)','Không bảo hành (demo)'][n],
    color:['Đen','Trắng','Xanh'][n],cpu:'Bộ xử lý 4 nhân - cấu hình demo',gpu:'Đồ họa tích hợp',resolution:'1920 × 1080',os:category.slug==='iphone'?'iOS (demo)':'Hệ điều hành theo mẫu thử',
    camera:'Camera chính 12 MP - thông số giả lập',variant:['Tiêu chuẩn','Đầy đủ phụ kiện','Tiết kiệm'][n],vehicle_type:'Xe sử dụng cá nhân',
    maintenance:'Đã kiểm tra phanh, đèn, lốp và vận hành. Đây là lịch sử bảo dưỡng giả lập, không phải chứng từ thật.',documents:'Giấy tờ giả lập; không dùng để xác minh giao dịch',
    direction:['Đông','Đông Nam','Nam'][n],legal:'Thông tin pháp lý giả lập, chưa xác minh',property_state:'Mẫu bàn giao sạch, có thể xem bố trí trong ảnh minh họa',
    land_type:'Đất ở - dữ liệu demo',planning:'Chưa xác minh quy hoạch; không phải thông tin mua bán thực',position:'Khu vực trung tâm giả lập',
    material:'Vật liệu theo mẫu minh họa; cần xác nhận khi giao dịch thật',dimensions:['120 × 60 × 75 cm','140 × 70 × 75 cm','100 × 50 × 70 cm'][n],capacity:'Thông số dung tích/công suất theo mẫu demo',
    size:['M / 38','L / 40','S / 36'][n],accessories:'Phụ kiện cơ bản, hộp đựng và hướng dẫn mẫu',age_range:'Từ 12 tuổi trở lên - dữ liệu thử',
    author:'Nhóm tác giả Demo',publisher:'Ấn phẩm thử nghiệm, không phát hành',language:'Tiếng Việt',subject:'Tự học và kiến thức phổ thông',
    power:'750 W (demo)',voltage:'220 V (demo)',usage:'Dùng trong gia đình hoặc xưởng nhỏ; chỉ là thông tin thử nghiệm',
    maker:'Xưởng mô hình Demo',period:'Sản xuất hiện đại - không phải cổ vật đã xác minh',certificate:'Không có chứng nhận thật; dữ liệu thử nghiệm',
    species:'Chó / mèo nuôi trong nhà (demo)',breed:'Giống phổ thông - thông tin giả lập',health:'Hồ sơ sức khỏe giả lập; cần kiểm tra thực tế',
    details:'Sản phẩm mẫu để thử tìm kiếm, yêu thích, chat và đặt hàng DEV',service_name:s.name,experience:'3 năm kinh nghiệm (giả lập)',
    service_area:'Khu vực Quy Nhơn - lịch hẹn giả lập',availability:['08:00–17:00, thứ 2–6','09:00–18:00, thứ 2–7','Cuối tuần, hẹn trước'][n],
    scope:'Khảo sát nhu cầu, thống nhất công việc, thực hiện và kiểm tra kết quả. Không nhận thanh toán hay thực hiện dịch vụ thật từ tin demo.',
  };
  if(field.type==='boolean'||field.type==='checkbox')return n!==2;
  if(['select','radio'].includes(field.type)){
    const preferred=field.key==='fuel'?(category.slug==='xe-dien'?'Điện':'Xăng'):field.key==='property_type'?(category.slug==='can-ho'?'Căn hộ':category.slug==='phong-tro'?'Phòng trọ':'Nhà riêng'):null;
    return field.options.find(o=>o.value===preferred)?.value??field.options[n%field.options.length]?.value;
  }
  if(field.type==='multi-select')return field.options.slice(0,Math.min(n+1,field.options.length)).map(o=>o.value);
  if(field.type==='date')return '2027-09-20';
  if(field.type==='currency')return s.price;
  if(['number','range','year'].includes(field.type)){
    const numbers={ram:[8,16,4][n],storage:[128,256,64][n],screen:category.slug.includes('laptop')?14:6.1,battery:4500,year:2023+n,
      mileage:[12000,6000,24000][n],engine:category.slug==='xe-may'?125:1500,seats:category.slug==='xe-may'?2:5,
      land_area:100,usable_area:80,floors:2,bedrooms:3,bathrooms:2,frontage:5,road:6,area:100,width:5,length:20,weight:5,age:12+n*6};
    const value=numbers[field.key]??field.config.min??10;
    return Math.max(field.config.min??-Infinity,Math.min(field.config.max??Infinity,value));
  }
  let text=words[field.key]??`${field.label}: mẫu ${n+1}, dùng kiểm thử ứng dụng`;
  if(field.key==='battery')text='Pin hoạt động ổn định - dữ liệu kiểm thử';
  if(field.key==='storage')text=['SSD 256 GB','SSD 512 GB','SSD 128 GB'][n];
  return text.padEnd(field.config.minLength??0,'.').slice(0,field.config.maxLength??2000);
}
function listingData(category,template,s,imageIds){
  const values={};
  for(const field of template.fields){
    if(!visible(field,values,template.fields))continue;
    if(field.type==='image')values[field.key]=imageIds[0];
    else if(field.type==='video'){if(field.required)throw new Error('Required video needs an explicit demo clip: '+category.slug);}
    else values[field.key]=valueFor(field,s,category);
  }
  const rental=['phong-tro','cho-thue-nha','cho-thue-mat-bang','van-phong','bat-dong-san-khac'].includes(category.slug);
  const preferred=rental?'MONTH':category.slug==='cho-thue'?'DAY':category.slug==='dich-vu-ca-nhan'?'HOUR':'FIXED';
  const priceMode=template.config.priceModes.includes(preferred)?preferred:template.config.priceModes[0];
  const data={title:`[DEMO] ${s.name} · Mẫu ${s.index+1}`,condition:['NEW','LIKE_NEW','USED_GOOD'][s.index],priceMode,price:s.price,negotiable:s.index!==0,
    description:`DỮ LIỆU DEMO — KHÔNG PHẢI TIN CHÀO BÁN THẬT.\n\n${s.name}, phiên bản mẫu ${s.index+1}. ${s.model}. Thông số, giá, bảo hành và tình trạng trong tin đều là dữ liệu giả lập để kiểm thử.\n\nBạn có thể thử tìm kiếm, lọc danh mục, xem ảnh, yêu thích, chat và các luồng đơn hàng trong môi trường DEV. Không thanh toán thật hoặc gọi số liên hệ mẫu.\n\nẢnh dùng để minh họa sản phẩm hoặc nhóm hàng, không cam kết đúng model/thương hiệu/thông số. Nguồn ảnh: ${s.source}. Hàng/demo kèm phụ kiện như phần thuộc tính; thời gian hỗ trợ giả lập 08:00–17:00. Có thể xem/kiểm tra trước khi nhận trong kịch bản thử.`,
    location:{province:'Gia Lai',district:'',ward:['Quy Nhơn','Quy Nhơn Nam','Quy Nhơn Bắc'][s.index],address:'Khu vực DEMO — không phải địa chỉ giao dịch',hideExact:true,latitude:[13.782,13.766,13.81][s.index],longitude:[109.219,109.221,109.195][s.index]},
    contact:{name:'Shop Demo Tất Tần Tật',phone:'0000000000',email:'catalog-demo@example.invalid'},values,images:imageIds,videos:[]};
  const errors=validateListing(data,template,true);if(Object.keys(errors).length)throw new Error(category.slug+': '+JSON.stringify(errors));
  return data;
}
module.exports={batch,stableId,entries,sample,listingData};
