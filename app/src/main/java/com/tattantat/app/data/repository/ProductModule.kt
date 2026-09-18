package com.tattantat.app.data.repository

import com.tattantat.app.domain.product.ProductRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module @InstallIn(SingletonComponent::class)
abstract class ProductModule { @Binds abstract fun bindProductRepository(impl: FakeProductRepository): ProductRepository }
