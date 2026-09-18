package com.tattantat.app.data.repository

import com.tattantat.app.domain.auth.DemoAuthenticator
import com.tattantat.app.domain.auth.SessionUser
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Inject
import javax.inject.Singleton

/** Credentials exist only in the debug source set and are excluded from release builds. */
@Singleton
class DebugDemoAuthenticator @Inject constructor() : DemoAuthenticator {
    override fun authenticate(identity: String, password: String): SessionUser? = when (identity.trim().lowercase() to password) {
        "admin@tattantat.vn" to "Demo@123" -> SessionUser("demo-admin", "Quản trị viên Demo", null, "ADMIN")
        "user@tattantat.vn" to "Demo@123" -> SessionUser("demo-user", "Người dùng Demo", null, "USER")
        else -> null
    }
}
@Module @InstallIn(SingletonComponent::class)
abstract class DebugDemoAuthModule { @Binds abstract fun bindDemoAuthenticator(impl: DebugDemoAuthenticator): DemoAuthenticator }
