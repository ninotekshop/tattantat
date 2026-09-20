package com.tattantat.app.data.repository

import com.tattantat.app.core.network.ApiResult
import com.tattantat.app.core.security.TokenStore
import com.tattantat.app.data.remote.auth.AuthApi
import com.tattantat.app.data.remote.auth.AuthPayload
import com.tattantat.app.data.remote.auth.LoginRequest
import com.tattantat.app.data.remote.auth.RefreshRequest
import com.tattantat.app.data.remote.auth.RegisterRequest
import com.tattantat.app.data.remote.auth.VerifyOtpRequest
import com.tattantat.app.domain.auth.AuthRepository
import com.tattantat.app.domain.auth.SessionUser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import retrofit2.HttpException
import java.io.IOException
import org.json.JSONArray
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton
import com.tattantat.app.push.PushTokenRegistrar

@Singleton
class RemoteAuthRepository @Inject constructor(private val api: AuthApi, private val tokenStore: TokenStore, private val pushTokens: PushTokenRegistrar) : AuthRepository {
    private val _currentUser = MutableStateFlow<SessionUser?>(null)
    override val currentUser: StateFlow<SessionUser?> = _currentUser
    private var accessToken: String? = null

    override suspend fun restoreSession(): ApiResult<SessionUser> {
        val refresh = tokenStore.refreshToken() ?: return ApiResult.Failure("Phiên đăng nhập đã hết hạn")
        return call { api.refresh(RefreshRequest(refresh)) }.also { if (it is ApiResult.Failure) tokenStore.clear() }
    }
    override suspend fun login(identity: String, password: String): ApiResult<SessionUser> {
        return call { api.login(LoginRequest(identity, password)) }
    }
    override suspend fun register(name: String, phone: String, password: String): ApiResult<String> = try {
        val response = api.register(RegisterRequest(name, phone, password))
        if (response.success && response.data != null) ApiResult.Success(response.data.verificationId) else ApiResult.Failure(response.message ?: "Không thể đăng ký", response.errorCode)
    } catch (e: Exception) { failure(e) }
    override suspend fun verifyOtp(verificationId: String, otp: String) = call { api.verifyOtp(VerifyOtpRequest(verificationId, otp)) }
    override suspend fun logout() { tokenStore.refreshToken()?.let { runCatching { api.logout(RefreshRequest(it)) } }; accessToken = null; tokenStore.clear(); _currentUser.value = null }

    private suspend fun call(request: suspend () -> com.tattantat.app.data.remote.auth.ApiEnvelope<AuthPayload>): ApiResult<SessionUser> = try {
        val response = request(); val body = response.data
        if (!response.success || body == null) ApiResult.Failure(response.message ?: "Không thể xác thực", response.errorCode)
        else { accessToken = body.accessToken; tokenStore.saveAccessToken(body.accessToken); tokenStore.saveRefreshToken(body.refreshToken); pushTokens.sync(); val user = SessionUser(body.user.id, body.user.fullName, body.user.avatarUrl); _currentUser.value = user; ApiResult.Success(user) }
    } catch (e: Exception) { failure(e) }
    private fun failure(e: Exception): ApiResult.Failure = when (e) {
        is IOException -> ApiResult.Failure("Không có kết nối Internet")
        is HttpException -> ApiResult.Failure(serverMessage(e) ?: "Không thể kết nối máy chủ (${e.code()})")
        else -> ApiResult.Failure("Đã xảy ra lỗi. Vui lòng thử lại.")
    }
    private fun serverMessage(error: HttpException): String? = runCatching {
        val message = JSONObject(error.response()?.errorBody()?.string().orEmpty()).opt("message")
        when (message) { is String -> message; is JSONArray -> message.optString(0); else -> null }
    }.getOrNull()
}
