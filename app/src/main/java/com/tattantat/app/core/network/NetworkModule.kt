package com.tattantat.app.core.network

import com.tattantat.app.BuildConfig
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import kotlinx.coroutines.runBlocking
import com.tattantat.app.core.security.TokenStore
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @Singleton fun client(tokenStore: TokenStore): OkHttpClient = OkHttpClient.Builder()
        .addInterceptor { chain -> val token = runBlocking { tokenStore.accessToken() }; chain.proceed(chain.request().newBuilder().apply { if (token != null) header("Authorization", "Bearer $token") }.build()) }
        .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
        .build()
    @Provides @Singleton fun retrofit(client: OkHttpClient): Retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL).client(client)
        .addConverterFactory(MoshiConverterFactory.create(Moshi.Builder().add(KotlinJsonAdapterFactory()).build())).build()
}
