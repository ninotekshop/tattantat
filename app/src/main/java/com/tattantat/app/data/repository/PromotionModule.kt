package com.tattantat.app.data.repository

import com.tattantat.app.data.remote.promotion.PromotionApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit

@Module @InstallIn(SingletonComponent::class) object PromotionModule { @Provides fun promotionApi(retrofit:Retrofit):PromotionApi=retrofit.create(PromotionApi::class.java) }
