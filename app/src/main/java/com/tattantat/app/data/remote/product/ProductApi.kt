package com.tattantat.app.data.remote.product

import retrofit2.http.Body
import retrofit2.http.POST

/** NestJS contract placeholder; file upload uses presigned URLs supplied by the backend. */
interface ProductApi { @POST("products") suspend fun create(@Body request: CreateProductRequest): ProductResponse }
data class CreateProductRequest(val title: String, val price: Long, val categoryId: String, val condition: String, val description: String, val imageKeys: List<String>)
data class ProductResponse(val success: Boolean, val data: ProductPayload?, val message: String?)
data class ProductPayload(val id: String)
