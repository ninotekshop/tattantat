package com.tattantat.app.domain.product

import kotlinx.coroutines.flow.Flow

interface ProductRepository {
    fun observeProducts(query: String = ""): Flow<List<Product>>
    fun observeProduct(id: String): Flow<Product?>
}
