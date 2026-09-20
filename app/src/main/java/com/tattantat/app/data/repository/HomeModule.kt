package com.tattantat.app.data.repository

import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
abstract class HomeModule { @Binds abstract fun bindHomeRepository(impl: RemoteHomeRepository): HomeRepository }
