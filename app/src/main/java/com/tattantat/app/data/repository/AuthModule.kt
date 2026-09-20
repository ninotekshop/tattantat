package com.tattantat.app.data.repository

import com.tattantat.app.data.remote.auth.AuthApi
import com.tattantat.app.data.remote.account.AccountApi
import com.tattantat.app.domain.auth.AuthRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit

@Module @InstallIn(SingletonComponent::class)
abstract class AuthBindingModule { @Binds abstract fun bindAuthRepository(impl: RemoteAuthRepository): AuthRepository }
@Module @InstallIn(SingletonComponent::class)
object AuthApiModule { @Provides fun authApi(retrofit: Retrofit): AuthApi = retrofit.create(AuthApi::class.java); @Provides fun accountApi(retrofit: Retrofit): AccountApi = retrofit.create(AccountApi::class.java) }
