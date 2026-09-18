package com.tattantat.app.data.repository

import com.tattantat.app.domain.auth.DemoAuthenticator
import com.tattantat.app.domain.auth.SessionUser
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ReleaseDemoAuthenticator @Inject constructor() : DemoAuthenticator { override fun authenticate(identity: String, password: String): SessionUser? = null }
@Module @InstallIn(SingletonComponent::class)
abstract class ReleaseDemoAuthModule { @Binds abstract fun bindDemoAuthenticator(impl: ReleaseDemoAuthenticator): DemoAuthenticator }
