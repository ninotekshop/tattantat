package com.tattantat.app.data.repository

import com.tattantat.app.data.remote.listing.ListingApi
import com.tattantat.app.data.remote.product.ProductApi
import com.tattantat.app.domain.category.Category
import com.tattantat.app.domain.category.CategoryIcons
import com.tattantat.app.domain.product.Product
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RemoteHomeRepository @Inject constructor(
    private val api: ProductApi,
    private val listingApi: ListingApi,
    private val products: RemoteProductRepository
) : HomeRepository {
    override fun observeCategories(): Flow<List<Category>> = flow {
        val listingCategories = runCatching { listingApi.categories().data.orEmpty() }.getOrNull()
        if (!listingCategories.isNullOrEmpty()) {
            emit(listingCategories.map {
                Category(
                    id = it.id,
                    name = it.name,
                    emoji = "🏷️",
                    slug = it.slug,
                    iconUrl = null,
                    iconRes = CategoryIcons.getDrawableRes(it.slug.ifBlank { it.id }),
                    parentId = it.parentId
                )
            })
        } else {
            emit(api.categories().data.orEmpty().map {
                Category(
                    id = it.id.toString(),
                    name = it.name,
                    emoji = "🏷️",
                    slug = it.slug,
                    iconUrl = it.icon_url,
                    iconRes = CategoryIcons.getDrawableRes(it.slug.ifBlank { it.id.toString() }),
                    parentId = null
                )
            })
        }
    }
    override fun observeNearbyProducts(): Flow<List<Product>> = products.observeProducts("", null)
}
