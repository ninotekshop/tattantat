package com.tattantat.app.data.repository

import com.tattantat.app.data.remote.subscription.SubscriptionApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit

@Module @InstallIn(SingletonComponent::class) object SubscriptionModule { @Provides fun subscriptionApi(retrofit:Retrofit):SubscriptionApi=retrofit.create(SubscriptionApi::class.java) }
