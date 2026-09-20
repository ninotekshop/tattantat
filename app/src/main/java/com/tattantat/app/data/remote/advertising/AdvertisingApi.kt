package com.tattantat.app.data.remote.advertising

import com.tattantat.app.data.remote.auth.ApiEnvelope
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface AdvertisingApi { @GET("advertising/campaigns") suspend fun campaigns():ApiEnvelope<List<CampaignPayload>>; @POST("advertising/campaigns") suspend fun create(@Header("Idempotency-Key") idempotencyKey:String,@Body request:CreateCampaignRequest):ApiEnvelope<CampaignPayload> }
data class CreateCampaignRequest(val productId:String,val campaignType:String="SPONSORED_PRODUCT",val budget:String)
data class CampaignPayload(val id:String,val product_id:String?,val campaign_type:String,val budget:String,val spent:String,val status:String)
