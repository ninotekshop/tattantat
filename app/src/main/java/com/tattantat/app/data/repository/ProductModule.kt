package com.tattantat.app.data.repository

import com.tattantat.app.data.remote.product.ProductApi
import com.tattantat.app.domain.product.ProductRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module @InstallIn(SingletonComponent::class)
abstract class ProductModule {
    @Binds abstract fun bindProductRepository(impl: RemoteProductRepository): ProductRepository
    companion object { @Provides fun productApi(retrofit: retrofit2.Retrofit): ProductApi = retrofit.create(ProductApi::class.java) }
}
