package com.tattantat.app.data.repository

import com.tattantat.app.data.remote.order.OrderApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit

@Module @InstallIn(SingletonComponent::class)
object OrderModule { @Provides fun orderApi(retrofit: Retrofit): OrderApi = retrofit.create(OrderApi::class.java) }
