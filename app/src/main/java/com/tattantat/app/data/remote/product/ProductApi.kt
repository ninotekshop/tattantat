package com.tattantat.app.data.remote.product

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.Multipart
import retrofit2.http.Part
import retrofit2.http.DELETE
import retrofit2.http.PATCH
import okhttp3.MultipartBody
import com.tattantat.app.data.remote.auth.ApiEnvelope

/** NestJS contract placeholder; file upload uses presigned URLs supplied by the backend. */
interface ProductApi {
    @GET("categories") suspend fun categories(): ApiEnvelope<List<CategoryPayload>>
    @GET("products") suspend fun list(@Query("q") query: String? = null, @Query("categoryId") categoryId: Long? = null): ApiEnvelope<List<ProductItemPayload>>
    @GET("products/mine") suspend fun mine(): ApiEnvelope<List<ProductItemPayload>>
    @GET("favorites") suspend fun favorites(): ApiEnvelope<List<ProductItemPayload>>
    @POST("favorites/{id}") suspend fun favorite(@Path("id") id:String): ApiEnvelope<ProductPayload>
    @DELETE("favorites/{id}") suspend fun unfavorite(@Path("id") id:String): ApiEnvelope<Unit>
    @GET("products/{id}") suspend fun detail(@Path("id") id: String): ApiEnvelope<ProductItemPayload>
    @POST("products") suspend fun create(@Body request: CreateProductRequest): ProductResponse
    @PATCH("products/{id}/status") suspend fun setListingVisibility(@Path("id") id: String, @Body request: UpdateListingVisibilityRequest): ApiEnvelope<ListingVisibilityPayload>
    @PATCH("products/{id}") suspend fun update(@Path("id") id: String, @Body request: UpdateProductRequest): ApiEnvelope<ProductItemPayload>
    @Multipart @POST("uploads/product-image") suspend fun uploadImage(@Part file: MultipartBody.Part): ApiEnvelope<UploadPayload>
}
data class CreateProductRequest(val title: String, val price: Long, val categoryId: Long, val condition: String, val description: String, val imageKeys: List<String>)
data class ProductResponse(val success: Boolean, val data: ProductPayload?, val message: String?)
data class ProductPayload(val id: String)
data class UpdateListingVisibilityRequest(val status: String)
data class ListingVisibilityPayload(val id: String, val status: String)
data class UpdateProductRequest(val title:String?=null,val price:Long?=null,val description:String?=null,val condition:String?=null,val categoryId:Long?=null,val imageKeys:List<String>?=null)
data class UploadPayload(val key: String)
data class CategoryPayload(val id: Long, val name: String, val slug: String, val icon_url: String? = null)
data class ProductItemPayload(val id: String, val title: String, val price: String, val location: String, val postedAt: String, val sellerId: String = "", val sellerName: String, val imageUrl: String, val description: String? = null, val condition: String? = null, val categoryId: Long? = null, val status: String = "ACTIVE", val priceMode: String = "FIXED", val listingId: String? = null, val images: List<String> = emptyList())
