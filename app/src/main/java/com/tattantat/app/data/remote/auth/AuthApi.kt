package com.tattantat.app.data.remote.auth

import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {
    @POST("auth/login") suspend fun login(@Body request: LoginRequest): ApiEnvelope<AuthPayload>
    @POST("auth/register") suspend fun register(@Body request: RegisterRequest): ApiEnvelope<VerificationPayload>
    @POST("auth/verify-otp") suspend fun verifyOtp(@Body request: VerifyOtpRequest): ApiEnvelope<AuthPayload>
    @POST("auth/refresh") suspend fun refresh(@Body request: RefreshRequest): ApiEnvelope<AuthPayload>
    @POST("auth/logout") suspend fun logout(@Body request: RefreshRequest): ApiEnvelope<Unit>
}

data class ApiEnvelope<T>(val success: Boolean, val data: T?, val message: String?, val errorCode: String?)
data class LoginRequest(val phoneOrEmail: String, val password: String)
data class RegisterRequest(val fullName: String, val phone: String, val password: String)
data class VerifyOtpRequest(val verificationId: String, val otp: String)
data class RefreshRequest(val refreshToken: String)
data class VerificationPayload(val verificationId: String)
data class AuthPayload(val accessToken: String, val refreshToken: String, val user: AuthUser)
data class AuthUser(val id: String, val fullName: String, val avatarUrl: String? = null)
