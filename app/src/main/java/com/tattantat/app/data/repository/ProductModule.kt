package com.tattantat.app.data.repository

import com.tattantat.app.data.remote.listing.ListingApi
import com.tattantat.app.data.remote.product.ProductApi
import com.tattantat.app.domain.product.ProductRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit

@Module @InstallIn(SingletonComponent::class)
abstract class ProductModule {
    @Binds abstract fun bindProductRepository(impl: RemoteProductRepository): ProductRepository
    companion object {
        @Provides fun productApi(retrofit: Retrofit): ProductApi = retrofit.create(ProductApi::class.java)
        @Provides fun listingApi(retrofit: Retrofit): ListingApi = retrofit.create(ListingApi::class.java)
    }
}
