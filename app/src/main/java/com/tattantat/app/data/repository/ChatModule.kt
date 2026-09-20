package com.tattantat.app.data.repository

import com.tattantat.app.data.remote.chat.ChatApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit

@Module
@InstallIn(SingletonComponent::class)
object ChatModule {
    @Provides fun chatApi(retrofit: Retrofit): ChatApi = retrofit.create(ChatApi::class.java)
}
