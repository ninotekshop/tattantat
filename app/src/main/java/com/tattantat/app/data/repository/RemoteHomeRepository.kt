package com.tattantat.app.data.repository

import com.tattantat.app.data.remote.product.ProductApi
import com.tattantat.app.domain.category.Category
import com.tattantat.app.domain.product.Product
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RemoteHomeRepository @Inject constructor(private val api: ProductApi, private val products: RemoteProductRepository) : HomeRepository {
    override fun observeCategories(): Flow<List<Category>> = flow { emit(api.categories().data.orEmpty().map { Category(it.id.toString(), it.name, it.icon_url ?: "🏷️") }) }
    override fun observeNearbyProducts(): Flow<List<Product>> = products.observeProducts("", null)
}
