package com.tattantat.app.data.repository

import com.tattantat.app.domain.product.Product
import com.tattantat.app.domain.product.ProductRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FakeProductRepository @Inject constructor() : ProductRepository {
    private val products = listOf(
        Product("1", "iPhone 14 Pro Max 256GB", "18.500.000 đ", "Quy Nhơn", "12 phút trước", "Minh Anh", "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800"),
        Product("2", "Máy ảnh Fujifilm X-T30", "14.900.000 đ", "TP. Hồ Chí Minh", "25 phút trước", "Ngọc Hà", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800"),
        Product("3", "Bàn làm việc gỗ sồi", "1.200.000 đ", "Hà Nội", "1 giờ trước", "Hoàng Nam", "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800")
    )
    override fun observeProducts(query: String, categoryId: Long?): Flow<List<Product>> = flowOf(products.filter { it.title.contains(query, ignoreCase = true) })
    override fun observeProduct(id: String): Flow<Product?> = flowOf(products.find { it.id == id })
}
