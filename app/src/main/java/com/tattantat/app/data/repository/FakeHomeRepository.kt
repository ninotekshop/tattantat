package com.tattantat.app.data.repository

import com.tattantat.app.domain.category.Category
import com.tattantat.app.domain.product.Product
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import javax.inject.Inject

class FakeHomeRepository @Inject constructor() : HomeRepository {
    override fun observeCategories(): Flow<List<Category>> = flowOf(listOf(
        Category("phones", "Điện thoại", "📱"), Category("fashion", "Thời trang", "👕"),
        Category("home", "Nhà cửa", "🛋️"), Category("vehicle", "Xe cộ", "🛵"),
        Category("tech", "Điện tử", "💻"), Category("more", "Xem thêm", "⋯")
    ))
    override fun observeNearbyProducts(): Flow<List<Product>> = flowOf(listOf(
        Product("1", "iPhone 14 Pro Max 256GB", "18.500.000 đ", "Quy Nhơn", "12 phút trước", "Minh Anh", "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800"),
        Product("2", "Máy ảnh Fujifilm X-T30", "14.900.000 đ", "TP. Hồ Chí Minh", "25 phút trước", "Ngọc Hà", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800"),
        Product("3", "Bàn làm việc gỗ sồi", "1.200.000 đ", "Hà Nội", "1 giờ trước", "Hoàng Nam", "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800")
    ))
}
