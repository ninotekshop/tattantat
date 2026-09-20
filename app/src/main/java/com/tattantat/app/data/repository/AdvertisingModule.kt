package com.tattantat.app.data.repository

import com.tattantat.app.data.remote.advertising.AdvertisingApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit

@Module @InstallIn(SingletonComponent::class) object AdvertisingModule { @Provides fun advertisingApi(retrofit:Retrofit):AdvertisingApi=retrofit.create(AdvertisingApi::class.java) }
