package com.tattantat.app.data.repository

import com.tattantat.app.domain.category.Category
import com.tattantat.app.domain.product.Product
import kotlinx.coroutines.flow.Flow

interface HomeRepository {
    fun observeCategories(): Flow<List<Category>>
    fun observeNearbyProducts(): Flow<List<Product>>
}
