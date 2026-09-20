package com.tattantat.app.data.repository

import com.tattantat.app.data.remote.admin.AdminApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit

@Module @InstallIn(SingletonComponent::class)
object AdminModule { @Provides fun adminApi(retrofit: Retrofit): AdminApi = retrofit.create(AdminApi::class.java) }
