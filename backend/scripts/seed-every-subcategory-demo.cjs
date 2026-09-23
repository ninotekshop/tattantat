require('dotenv').config({ quiet: true });
const { Pool } = require('pg');
const { createHash } = require('node:crypto');

const batch = 'demo-full-v2';

function stableUuid(seed) {
  const h = createHash('sha256').update(batch + ':' + seed).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

// Unsplash high quality image repository by topic
const photoBank = {
  phone: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=80'
  ],
  laptop: [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=80'
  ],
  car: [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
  ],
  motorbike: [
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80'
  ],
  house: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
  ],
  furniture: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80'
  ],
  clothes: [
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80'
  ],
  shoes: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80'
  ],
  pet: [
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80'
  ],
  baby: [
    'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1200&q=80'
  ],
  food: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80'
  ],
  service: [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80'
  ],
  books: [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80'
  ],
  sports: [
    'https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80'
  ],
  tools: [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80'
  ]
};

// Custom seed entries tailored for specific subcategory slugs
const customSeeds = {
  // --- Điện thoại ---
  'iphone': [
    { title: 'iPhone 15 Pro Max 256GB Titanium Tự Nhiên VN/A', price: '26500000', priceMode: 'FIXED', condition: 'USED_GOOD', description: 'Máy chính chủ mua tại FPT Shop còn nguyên hộp, hoá đơn đầy đủ. Ngoại hình mới 98%, pin 92%. Bao test thoải mái tại nhà.', images: photoBank.phone.slice(0, 2) },
    { title: 'iPhone 13 128GB màu Hồng VN/A nguyên zin mới 99%', price: '12800000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Máy nữ dùng ốp từ đầu nên đẹp như mới, pin 89%, camera chụp đẹp long lanh. Đầy đủ sạc cáp zin đi kèm.', images: photoBank.phone.slice(1, 3) }
  ],
  'samsung': [
    { title: 'Samsung Galaxy S24 Ultra 12GB/256GB Xám Titanium', price: '23900000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Hàng chính hãng Samsung Việt Nam bảo hành đến 2025. Máy đẹp keng không vết xước, camera zoom 100x cực nét.', images: [photoBank.phone[2], photoBank.phone[3]] },
    { title: 'Samsung Galaxy Z Flip5 5G 256GB Kem Cực Đẹp', price: '13500000', priceMode: 'FIXED', condition: 'USED_GOOD', description: 'Máy gập sành điệu, màn hình phụ lớn tiện lợi. Mọi chức năng hoàn hảo, còn bảo hành chính hãng 4 tháng.', images: [photoBank.phone[3], photoBank.phone[0]] }
  ],
  'xiaomi': [
    { title: 'Xiaomi Redmi Note 13 Pro+ 5G 12GB/256GB Đen', price: '6800000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Màn hình cong AMOLED 120Hz, sạc siêu nhanh 120W cắm 19 phút đầy pin. Máy mua tại Thế Giới Di Động.', images: [photoBank.phone[0], photoBank.phone[1]] },
    { title: 'Xiaomi 14 12GB/256GB Trắng Leica Camera Đỉnh', price: '14900000', priceMode: 'FIXED', condition: 'NEW', description: 'Siêu phẩm camera Leica ống kính Summilux. Máy mới bóc hộp trải nghiệm 1 tuần, đầy đủ phụ kiện sạc 90W.', images: [photoBank.phone[1], photoBank.phone[2]] }
  ],
  'oppo': [
    { title: 'OPPO Reno11 Pro 5G 12GB/512GB Trắng Ngọc Mới 99%', price: '9200000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Chuyên gia chân dung Reno11 Pro chụp hình cực nét. Thiết kế mặt lưng ngọc trai sang trọng, sạc nhanh 80W.', images: [photoBank.phone[2], photoBank.phone[3]] },
    { title: 'OPPO Find N3 Flip 5G 12GB/256GB Vàng Hổ Phách', price: '15800000', priceMode: 'FIXED', condition: 'USED_GOOD', description: 'Máy gập 3 camera Hasselblad xịn xò. Ngoại hình đẹp 98%, màn hình mượt mà không nếp gấp.', images: [photoBank.phone[3], photoBank.phone[0]] }
  ],

  // --- Laptop ---
  'macbook': [
    { title: 'MacBook Pro 14 inch M3 Pro 18GB/512GB Space Black', price: '42500000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Máy chính hãng SA/A mua tại Apple Store, sạc 12 lần. Cấu hình mượt mà dựng phim 4K và đồ họa nặng thoải mái.', images: photoBank.laptop.slice(0, 2) },
    { title: 'MacBook Air M2 8GB/256GB Space Gray chính hãng mới 99%', price: '19800000', priceMode: 'FIXED', condition: 'USED_GOOD', description: 'Máy dùng văn phòng giữ gìn cẩn thận, pin sạc 45 lần. Kèm sạc cáp zin và túi chống sốc cao cấp.', images: photoBank.laptop.slice(1, 3) }
  ],
  'dell': [
    { title: 'Dell XPS 13 9315 Core i7 16GB/512GB SSD Màn 4K Touch', price: '21500000', priceMode: 'FIXED', condition: 'USED_GOOD', description: 'Dòng laptop doanh nhân siêu mỏng nhẹ, vỏ nhôm nguyên khối đắng cấp. Màn hình 4K cảm ứng cực sắc nét.', images: photoBank.laptop.slice(0, 2) },
    { title: 'Dell Inspiron 16 5630 Core i5-1340P 16GB/512GB Mới 99%', price: '13900000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Màn hình lớn 16 inch độ phân giải 2K sắc nét, bàn phím gõ êm. Phù hợp văn phòng và lập trình.', images: photoBank.laptop.slice(1, 3) }
  ],
  'hp': [
    { title: 'HP Spectre x360 14 Core i7 16GB/1TB SSD Xoay Gập 360', price: '23500000', priceMode: 'FIXED', condition: 'USED_GOOD', description: 'Laptop xoay gập cảm ứng cao cấp kèm bút cảm ứng HP Tilt Pen. Màn hình OLED 3K2K rực rỡ.', images: photoBank.laptop.slice(0, 2) },
    { title: 'HP Pavilion 15 Core i5-1235U 8GB/512GB Bạc Đẹp', price: '9800000', priceMode: 'FIXED', condition: 'USED_GOOD', description: 'Máy màu bạc sang trọng, dùng giữ gìn. Loa B&O nghe nhạc hay, pin dùng liên tục 5-6 tiếng.', images: photoBank.laptop.slice(1, 3) }
  ],
  'lenovo': [
    { title: 'Lenovo ThinkPad X1 Carbon Gen 11 Core i7 32GB/1TB', price: '32000000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Huyền thoại ThinkPad mỏng nhẹ siêu bền chất liệu sợi carbon. Bàn phím gõ đỉnh nhất thế giới.', images: photoBank.laptop.slice(0, 2) },
    { title: 'Lenovo Yoga Slim 7 Pro 14IHU5 Core i5 16GB/512GB 2.8K', price: '12500000', priceMode: 'FIXED', condition: 'USED_GOOD', description: 'Màn hình 2.8K 90Hz tần số quét cao, màu chuẩn 100% sRGB. Máy mỏng nhẹ 1.3kg tiện di chuyển.', images: photoBank.laptop.slice(1, 3) }
  ],
  'asus': [
    { title: 'ASUS ROG Zephyrus G14 Ryzen 9 16GB/1TB RTX 4060', price: '29500000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Laptop Gaming mỏng nhẹ vỏ Magie màu trắng siêu đẹp. Cấu hình chiến mượt mọi game AAA và đồ họa 3D.', images: photoBank.laptop.slice(0, 2) },
    { title: 'ASUS Zenbook 14 OLED UX3402 Core i5 16GB/512GB', price: '14800000', priceMode: 'FIXED', condition: 'USED_GOOD', description: 'Màn hình OLED 2.8K đẹp lung linh. Pin bền 75Wh dùng cả ngày không cần cắm sạc.', images: photoBank.laptop.slice(1, 3) }
  ],

  // --- Bất động sản ---
  'ban-nha': [
    { title: 'Bán nhà 3 tầng mặt tiền đường Nguyễn Huệ Quy Nhơn 85m²', price: '6800000000', priceMode: 'FIXED', condition: 'USED_GOOD', description: 'Nhà vị trí đắc địa ngay trung tâm thành phố Quy Nhơn, thích hợp ở kết hợp kinh doanh hoặc cho thuê văn phòng. Sổ hồng chính chủ sang tên ngay.', images: photoBank.house.slice(0, 2) },
    { title: 'Nhà phố 2 tầng hiện đại KĐT An Phú Thịnh Quy Nhơn 100m²', price: '4200000000', priceMode: 'FIXED', condition: 'NEW', description: 'Nhà mới hoàn thiện đầy đủ nội thất cao cấp, 3 phòng ngủ, 3 nhà vệ sinh, đường trước nhà 12m vỉa hè rộng rãi.', images: photoBank.house.slice(1, 3) }
  ],
  'ban-dat': [
    { title: 'Bán lô đất biệt thự view đầm Thị Nại Quy Nhơn 200m²', price: '3500000000', priceMode: 'FIXED', condition: 'NEW', description: 'Lô đất ngang 10m dài 20m, hướng Đông Nam mát mẻ. Khu vực dân trí cao, hạ tầng hoàn thiện, chuẩn bị mở đường lớn.', images: photoBank.house.slice(0, 2) },
    { title: 'Lô đất thổ cư KDC Nhơn Hội Quy Nhơn 100m² sổ đỏ chính chủ', price: '1650000000', priceMode: 'FIXED', condition: 'NEW', description: 'Đất vuông vắn 5x20m, vỉa hè 3m, lòng đường 7.5m. Xây dựng tự do, gần biển và các khu resort lớn.', images: photoBank.house.slice(1, 3) }
  ],
  'can-ho': [
    { title: 'Căn hộ 2PN FLC Sea Tower Quy Nhơn 72m² view biển full nội thất', price: '2200000000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Căn hộ tầng trung view biển thoáng mát, trang bị đầy đủ nội thất sang trọng. Đang cho thuê du lịch thu nhập ổn định.', images: photoBank.house.slice(0, 2) },
    { title: 'Căn hộ 3PN Altara Residences Quy Nhơn 90m² căn góc cao cấp', price: '2950000000', priceMode: 'FIXED', condition: 'NEW', description: 'Căn góc 2 mặt thoáng view toàn cảnh thành phố và biển Quy Nhơn. Sổ hồng vĩnh viễn, nhận nhà ở ngay.', images: photoBank.house.slice(1, 3) }
  ],
  'phong-tro': [
    { title: 'Phòng trọ khép kín full nội thất gần ĐH Quy Nhơn 25m²', price: '2500000', priceMode: 'MONTH', condition: 'NEW', description: 'Phòng trọ mới xây sạch sẽ có máy lạnh, tủ lạnh, giường nệm, giờ giấc tự do không chung chủ. Wifi tốc độ cao.', images: photoBank.house.slice(0, 2) },
    { title: 'Cho thuê phòng trọ có gác xép đường An Dương Vương 30m²', price: '1800000', priceMode: 'MONTH', condition: 'USED_GOOD', description: 'Phòng trọ rộng rãi an ninh tốt, gần biển và trường học. Điện nước tính theo giá nhà nước.', images: photoBank.house.slice(1, 3) }
  ],
  'cho-thue-nha': [
    { title: 'Cho thuê nhà nguyên căn 2 tầng đường Trần Hưng Đạo Quy Nhơn', price: '8500000', priceMode: 'MONTH', condition: 'USED_GOOD', description: 'Nhà 2 tầng gồm 3 phòng ngủ, 2 WC, phòng khách rộng thích hợp cho gia đình ở hoặc làm văn phòng công ty.', images: photoBank.house.slice(0, 2) },
    { title: 'Cho thuê biệt thự sân vườn nguyên căn view biển Quy Nhơn', price: '25000000', priceMode: 'MONTH', condition: 'LIKE_NEW', description: 'Biệt thự có hồ bơi sân vườn rộng rãi, full nội thất nhập khẩu. Thích hợp cho chuyên gia nước ngoài thuê ở dài hạn.', images: photoBank.house.slice(1, 3) }
  ],

  // --- Xe cộ ---
  'o-to': [
    { title: 'Mazda 3 1.5L Luxury 2022 màu đỏ chạy 18.000 km chính chủ', price: '560000000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Xe gia đình đi giữ gìn kỹ, không đâm đụng không ngập nước. Đã bảo dưỡng định kỳ tại hãng, lốp sơ cua chưa chạm đất.', images: photoBank.car.slice(0, 2) },
    { title: 'Toyota Corolla Cross 1.8V 2023 màu trắng ngọc trinh siêu lướt', price: '720000000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Xe trang bị gói an toàn Toyota Safety Sense, cửa sổ trời, màn hình giải trí Android. Đứng tên cá nhân sang tên nhanh.', images: photoBank.car.slice(1, 3) }
  ],
  'xe-may': [
    { title: 'Xe máy Honda Vision 2023 màu trắng chính chủ biển Quy Nhơn', price: '29800000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Xe nữ chạy giữ kỹ mới đi 8.500 km. Đã dán keo nguyên xe, thay dầu định kỳ tại hãng. Giấy tờ chính chủ sang tên trong ngày.', images: photoBank.motorbike.slice(0, 2) },
    { title: 'Yamaha Exciter 155 VVA 2022 bản Cao Cấp Đen Nhám', price: '38500000', priceMode: 'FIXED', condition: 'USED_GOOD', description: 'Xe máy mượt khóa thông minh Smartkey, lên một số đồ chơi kiểng nhẹ. Động cơ VVA bốc mượt mà.', images: photoBank.motorbike.slice(0, 2) }
  ],
  'xe-dien': [
    { title: 'VinFast VF 8 Plus 2023 màu trắng pin thuê chạy 15.000 km', price: '780000000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Xe bản 2 cầu công suất 402 mã lực lái cực bốc. Đã cập nhật phần mềm mới nhất, nội thất da bò sang trọng.', images: photoBank.car.slice(0, 2) },
    { title: 'Xe máy điện VinFast Feliz S màu đỏ cờ đi 4.000 km mới 99%', price: '22500000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Pin LFP đi được 198km sau mỗi lần sạc đầy. Máy chạy êm ái, đầy đủ 2 chìa khóa và sạc zin.', images: photoBank.motorbike.slice(0, 2) }
  ],

  // --- Đồ gia dụng ---
  'sofa': [
    { title: 'Bộ sofa văng phòng khách da Microfiber cao cấp dài 2m2', price: '6500000', priceMode: 'FIXED', condition: 'NEW', description: 'Sofa da công nghiệp cao cấp không bong tróc, đệm mút K43 chống xẹp đút êm ái. Khung gỗ tự nhiên đã qua xử lý.', images: photoBank.furniture.slice(0, 2) },
    { title: 'Bộ sofa góc L bọc nỉ nhung xám kèm bàn trà kính cường lực', price: '4800000', priceMode: 'FIXED', condition: 'USED_GOOD', description: 'Sofa nhà dùng giữ gìn còn mới 90%, vỏ bọc tháo giặt dễ dàng. Tặng kèm 3 gối ôm đồng bộ.', images: photoBank.furniture.slice(1, 3) }
  ],
  'tu-lanh': [
    { title: 'Tủ lạnh LG Inverter 315 lít mới 95% tiết kiệm điện', price: '5200000', priceMode: 'FIXED', condition: 'USED_GOOD', description: 'Tủ lạnh ngăn đá dưới hiện đại, làm lạnh đa chiều không đóng tuyết. Khay kính chịu lực, chạy êm ru.', images: photoBank.furniture.slice(0, 2) },
    { title: 'Tủ lạnh Side by Side Samsung Inverter 647L màu Bạc', price: '14500000', priceMode: 'FIXED', condition: 'LIKE_NEW', description: 'Tủ lớn dung tích khủng phù hợp đại gia đình. Làm đá tự động và lấy nước ngoài cửa tiện lợi.', images: photoBank.furniture.slice(1, 3) }
  ],

  // --- Dịch vụ ---
  'sua-chua': [
    { title: 'Dịch vụ bảo dưỡng & sửa chữa điều hòa, tủ lạnh tận nhà Quy Nhơn', price: '150000', priceMode: 'CONTACT', condition: 'NEW', description: 'Chuyên nhận vệ sinh, nạp ga, sửa chữa điều hòa, máy giặt, tủ lạnh giá bình dân. Báo giá công khai trước khi làm, bảo hành chu đáo.', images: photoBank.service.slice(0, 2) },
    { title: 'Dịch vụ sửa chữa điện nước & chống thấm sự cố 24/7 Quy Nhơn', price: '200000', priceMode: 'CONTACT', condition: 'NEW', description: 'Xử lý nhanh sự cố chập điện, nhảy aptomat, rò rỉ nước, tắc cống. Thợ có mặt sau 15 phút gọi.', images: photoBank.service.slice(1, 3) }
  ],

  // --- Thú cưng ---
  'thu-cung-canh': [
    { title: 'Chó Poodle thuần chủng màu nâu đỏ 2.5 tháng tuổi tiêm đủ 2 mũi', price: '3200000', priceMode: 'FIXED', condition: 'NEW', description: 'Bé cún lông xoăn tít thông minh quấn chủ, đã xổ giun và tiêm phòng 2 mũi có sổ sức khỏe đầy đủ.', images: photoBank.pet.slice(0, 2) },
    { title: 'Mèo Anh ngắn màu Bicolor mắt cam cực xịn xò 3 tháng tuổi', price: '4500000', priceMode: 'FIXED', condition: 'NEW', description: 'Mặt tròn xoe, chân ngắn béo mầm cực đáng yêu. Đã biết ăn hạt và đi vệ sinh đúng chậu cát.', images: photoBank.pet.slice(1, 3) }
  ]
};

// Generic generator for categories that don't have custom explicit list
function generateGenericItems(cat) {
  const name = cat.name;
  const slug = cat.slug;

  let topic = 'furniture';
  let price1 = '350000';
  let price2 = '850000';

  if (slug.includes('xe') || slug.includes('o-to') || slug.includes('tai')) { topic = 'car'; price1 = '250000000'; price2 = '450000000'; }
  else if (slug.includes('nha') || slug.includes('dat') || slug.includes('bds') || slug.includes('phong')) { topic = 'house'; price1 = '1800000000'; price2 = '3200000000'; }
  else if (slug.includes('dien') || slug.includes('tech') || slug.includes('may') || slug.includes('game')) { topic = 'phone'; price1 = '3500000'; price2 = '8900000'; }
  else if (slug.includes('quan') || slug.includes('ao') || slug.includes('giay') || slug.includes('tui') || slug.includes('trang')) { topic = 'clothes'; price1 = '250000'; price2 = '550000'; }
  else if (slug.includes('cho') || slug.includes('meo') || slug.includes('thu-cung')) { topic = 'pet'; price1 = '1500000'; price2 = '3500000'; }
  else if (slug.includes('be') || slug.includes('me')) { topic = 'baby'; price1 = '350000'; price2 = '750000'; }
  else if (slug.includes('sach') || slug.includes('giao')) { topic = 'books'; price1 = '95000'; price2 = '180000'; }
  else if (slug.includes('dich-vu') || slug.includes('sua') || slug.includes('chuyen')) { topic = 'service'; price1 = '200000'; price2 = '500000'; }
  else if (slug.includes('thuc-pham') || slug.includes('an') || slug.includes('uong')) { topic = 'food'; price1 = '120000'; price2 = '350000'; }

  const imgs = photoBank[topic] || photoBank.furniture;

  return [
    {
      title: `${name} cao cấp mẫu 1 - Thương hiệu uy tín chính hãng`,
      price: price1,
      priceMode: 'FIXED',
      condition: 'USED_GOOD',
      description: `Sản phẩm ${name} chất lượng cao, giữ gìn cẩn thận còn mới 95%. Đầy đủ phụ kiện kèm theo, kiểm tra thoải mái trước khi nhận.`,
      images: [imgs[0], imgs[1] || imgs[0]]
    },
    {
      title: `${name} chính hãng chất lượng tốt - Giá hợp lý`,
      price: price2,
      priceMode: 'FIXED',
      condition: 'LIKE_NEW',
      description: `Món đồ ${name} chính chủ sử dụng giữ gìn như mới, hoạt động hoàn hảo. Bán lại cho người có nhu cầu với giá cực tốt.`,
      images: [imgs[1] || imgs[0], imgs[0]]
    }
  ];
}

async function runSeed() {
  console.log('--- STARTING COMPLETE DEMO SEEDING FOR ALL SUBCATEGORIES ---');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. DELETE ALL EXISTING PRODUCT & LISTING DATA
    console.log('1. Clearing all existing product and listing tables...');
    await client.query('DELETE FROM product_images');
    await client.query('DELETE FROM listing_images');
    await client.query('DELETE FROM listing_videos');
    await client.query('DELETE FROM listing_publish_requests');
    await client.query('DELETE FROM listing_field_values');
    await client.query('DELETE FROM listings');
    await client.query('DELETE FROM products');
    console.log('   -> All existing products and listings cleared!');

    // 2. GET ACTIVE SELLER USER
    const sellerRes = await client.query(`SELECT id, full_name FROM users WHERE status='ACTIVE' ORDER BY created_at LIMIT 1`);
    if (!sellerRes.rows[0]) throw new Error('No active user in database to assign as seller.');
    const sellerId = sellerRes.rows[0].id;
    console.log(`2. Active seller found: ${sellerRes.rows[0].full_name} (${sellerId})`);

    // 3. GET ALL LEAF SUBCATEGORIES
    const subcatsRes = await client.query(`
      SELECT c1.id, c1.name, c1.slug
      FROM categories c1
      WHERE NOT EXISTS (SELECT 1 FROM categories c2 WHERE c2.parent_id = c1.id)
      ORDER BY c1.id
    `);
    const subcategories = subcatsRes.rows;
    console.log(`3. Total leaf subcategories to seed: ${subcategories.length}`);

    let totalCreated = 0;

    // 4. SEED EXACTLY 2 ITEMS PER SUBCATEGORY
    for (const cat of subcategories) {
      // Find template for this category or fallback
      let templateRes = await client.query(`SELECT id, name, config FROM listing_templates WHERE category_id = $1 LIMIT 1`, [cat.id]);
      let templateId = templateRes.rows[0]?.id;
      let templateObj = templateRes.rows[0] ? {
        id: templateRes.rows[0].id,
        categoryId: cat.id,
        version: 1,
        name: templateRes.rows[0].name,
        fields: [],
        config: templateRes.rows[0].config || { priceModes: ['FIXED', 'CONTACT', 'FREE', 'MONTH', 'DAY', 'HOUR'] }
      } : {
        id: stableUuid('template:' + cat.slug),
        categoryId: cat.id,
        version: 1,
        name: 'Biểu mẫu ' + cat.name,
        fields: [],
        config: { priceModes: ['FIXED', 'CONTACT', 'FREE', 'MONTH', 'DAY', 'HOUR'] }
      };

      // Ensure template exists in DB
      if (!templateId) {
        const insTpl = await client.query(
          `INSERT INTO listing_templates(id, category_id, version, name, active, config)
           VALUES($1, $2, 1, $3, true, $4::jsonb)
           ON CONFLICT DO NOTHING RETURNING id`,
          [templateObj.id, cat.id, templateObj.name, JSON.stringify(templateObj.config)]
        );
        templateId = insTpl.rows[0]?.id || templateObj.id;
      }

      const items = customSeeds[cat.slug] || generateGenericItems(cat);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const seedSlug = `seed-${cat.slug}-${i + 1}`;
        const productId = stableUuid('prod:' + seedSlug);
        const listingId = stableUuid('list:' + seedSlug);

        // Insert product
        await client.query(`
          INSERT INTO products(id, seller_id, category_id, title, slug, description, price, condition, status, published_at, address, listing_price_mode, listing_negotiable)
          VALUES($1, $2, $3, $4, $5, $6, $7, $8::product_condition, 'ACTIVE', NOW() - ($9 * interval '1 minute'), $10, $11, $12)
        `, [
          productId,
          sellerId,
          cat.id,
          item.title,
          seedSlug,
          item.description,
          ['FREE', 'CONTACT'].includes(item.priceMode) ? '0' : item.price,
          item.condition || 'USED_GOOD',
          i * 30 + 5,
          'Quy Nhơn, Bình Định',
          item.priceMode || 'FIXED',
          true
        ]);

        // Insert listing
        const listingDataObj = {
          title: item.title,
          description: item.description,
          condition: item.condition || 'USED_GOOD',
          priceMode: item.priceMode || 'FIXED',
          price: item.price,
          negotiable: true,
          location: { province: 'Bình Định', district: 'Quy Nhơn', ward: 'Trần Phú', address: 'Quy Nhơn, Bình Định', hideExact: false },
          contact: { name: 'Nguyễn Văn A', phone: '0901234567', email: 'user@tattantat.vn' },
          values: {},
          images: [],
          videos: []
        };

        await client.query(`
          INSERT INTO listings(id, seller_id, category_id, template_id, template_snapshot, data, status, revision, client_key, product_id, published_snapshot, published_at)
          VALUES($1, $2, $3, $4, $5::jsonb, $6::jsonb, 'PUBLISHED', 1, $7, $8, $9::jsonb, NOW())
        `, [
          listingId,
          sellerId,
          cat.id,
          templateId,
          JSON.stringify(templateObj),
          JSON.stringify(listingDataObj),
          stableUuid('key:' + seedSlug),
          productId,
          JSON.stringify({ template: templateObj, data: listingDataObj })
        ]);

        // Insert product images
        for (let imgIdx = 0; imgIdx < item.images.length; imgIdx++) {
          const imgUrl = item.images[imgIdx];
          const mediaId = stableUuid('img:' + seedSlug + ':' + imgIdx);

          await client.query(`
            INSERT INTO product_images(product_id, url, sort_order)
            VALUES($1, $2, $3)
          `, [productId, imgUrl, imgIdx + 1]);

          await client.query(`
            INSERT INTO listing_images(id, listing_id, storage_key, mime_type, byte_size)
            VALUES($1, $2, $3, 'image/jpeg', 102400)
          `, [mediaId, listingId, `demo/${seedSlug}-${imgIdx}.jpg`]);
        }

        // Insert publish request
        await client.query(`
          INSERT INTO listing_publish_requests(seller_id, key, listing_id, revision, product_id)
          VALUES($1, $2, $3, 1, $4)
        `, [sellerId, stableUuid('pub:' + seedSlug), listingId, productId]);

        totalCreated++;
      }
    }

    await client.query('COMMIT');
    console.log(`\n✅ SEEDING COMPLETED SUCCESSFULLY!`);
    console.log(`   Total categories processed: ${subcategories.length}`);
    console.log(`   Total demo products created: ${totalCreated}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ SEEDING FAILED:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
