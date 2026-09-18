package com.tattantat.app.domain.auth

import com.tattantat.app.core.network.ApiResult
import kotlinx.coroutines.flow.StateFlow

data class SessionUser(val id: String, val name: String, val avatarUrl: String?, val role: String = "USER")

/** Debug builds can supply local credentials; release builds always return null. */
interface DemoAuthenticator {
    fun authenticate(identity: String, password: String): SessionUser?
}

interface AuthRepository {
    val currentUser: StateFlow<SessionUser?>
    suspend fun restoreSession(): ApiResult<SessionUser>
    suspend fun login(identity: String, password: String): ApiResult<SessionUser>
    suspend fun register(name: String, phone: String, password: String): ApiResult<String>
    suspend fun verifyOtp(verificationId: String, otp: String): ApiResult<SessionUser>
    suspend fun logout()
}
