package com.tattantat.app.data.remote.promotion

import com.tattantat.app.data.remote.auth.ApiEnvelope
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface PromotionApi { @GET("promotions/packages") suspend fun packages(): ApiEnvelope<List<PromotionPackagePayload>>; @POST("promotions/purchase") suspend fun purchase(@Header("Idempotency-Key") key:String,@Body request:PromotionPurchaseRequest):ApiEnvelope<PromotionOrderPayload> }
data class PromotionPackagePayload(val id:String,val code:String,val name:String,val price:String,val duration_hours:Int,val promotion_type:String)
data class PromotionPurchaseRequest(val productId:String,val packageId:String)
data class PromotionOrderPayload(val id:String,val status:String)
