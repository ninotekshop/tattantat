package com.tattantat.app.data.repository

import com.tattantat.app.R
import com.tattantat.app.domain.category.Category
import com.tattantat.app.domain.product.Product
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import javax.inject.Inject

class FakeHomeRepository @Inject constructor() : HomeRepository {
    override fun observeCategories(): Flow<List<Category>> = flowOf(listOf(
        Category("nha-dat", "Nhà đất", "🏠", slug = "nha-dat", iconRes = R.drawable.cat_nha_dat),
        Category("xe-co", "Xe cộ", "🛵", slug = "xe-co", iconRes = R.drawable.cat_xe_co),
        Category("do-cong-nghe", "Đồ công nghệ", "💻", slug = "do-cong-nghe", iconRes = R.drawable.cat_do_cong_nghe),
        Category("nha-cua-doi-song", "Nhà cửa & Đời sống", "🛋️", slug = "nha-cua-doi-song", iconRes = R.drawable.cat_nha_cua_doi_song),
        Category("thoi-trang-ca-nhan", "Thời trang", "👕", slug = "thoi-trang-ca-nhan", iconRes = R.drawable.cat_thoi_trang_ca_nhan),
        Category("me-va-be", "Mẹ & Bé", "🍼", slug = "me-va-be", iconRes = R.drawable.cat_me_va_be),
        Category("the-thao-giai-tri", "Thể thao", "⚽", slug = "the-thao-giai-tri", iconRes = R.drawable.cat_the_thao_giai_tri),
        Category("thu-cung", "Thú cưng", "🐶", slug = "thu-cung", iconRes = R.drawable.cat_thu_cung),
        Category("viec-lam", "Việc làm", "💼", slug = "viec-lam", iconRes = R.drawable.cat_viec_lam),
        Category("dich-vu", "Dịch vụ", "🛠️", slug = "dich-vu", iconRes = R.drawable.cat_dich_vu),
        Category("thuc-pham", "Thực phẩm", "🍎", slug = "thuc-pham", iconRes = R.drawable.cat_thuc_pham),
        Category("may-moc-cong-nghiep", "Máy móc", "⚙️", slug = "may-moc-cong-nghiep", iconRes = R.drawable.cat_may_moc_cong_nghiep),
        Category("tang-mien-phi", "Tặng miễn phí", "🎁", slug = "tang-mien-phi", iconRes = R.drawable.cat_tang_mien_phi),
        Category("khac", "Khác", "⋯", slug = "khac", iconRes = R.drawable.cat_khac)
    ))
    override fun observeNearbyProducts(): Flow<List<Product>> = flowOf(listOf(
        Product("1", "iPhone 14 Pro Max 256GB", "18.500.000 đ", "Quy Nhơn", "12 phút trước", "Minh Anh", "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800"),
        Product("2", "Máy ảnh Fujifilm X-T30", "14.900.000 đ", "TP. Hồ Chí Minh", "25 phút trước", "Ngọc Hà", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800"),
        Product("3", "Bàn làm việc gỗ sồi", "1.200.000 đ", "Hà Nội", "1 giờ trước", "Hoàng Nam", "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800")
    ))
}
