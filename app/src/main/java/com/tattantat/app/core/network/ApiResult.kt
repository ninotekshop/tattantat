package com.tattantat.app.core.network

sealed interface ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>
    data class Failure(val message: String, val code: String? = null) : ApiResult<Nothing>
}
