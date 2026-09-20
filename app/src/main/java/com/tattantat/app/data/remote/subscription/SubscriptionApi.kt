package com.tattantat.app.data.remote.subscription

import com.tattantat.app.data.remote.auth.ApiEnvelope
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface SubscriptionApi { @GET("subscriptions/plans") suspend fun plans():ApiEnvelope<List<SubscriptionPlanPayload>>; @GET("subscriptions/me") suspend fun mine():ApiEnvelope<SubscriptionPayload>; @POST("subscriptions/purchase") suspend fun purchase(@Header("Idempotency-Key") key:String,@Body request:SubscriptionPurchaseRequest):ApiEnvelope<SubscriptionOrderPayload> }
data class SubscriptionPlanPayload(val id:String,val code:String,val name:String,val price:String,val billing_cycle:String,val max_listings:Int?)
data class SubscriptionPayload(val id:String,val code:String,val name:String,val ends_at:String?)
data class SubscriptionPurchaseRequest(val planId:String)
data class SubscriptionOrderPayload(val id:String,val subscriptionId:String?,val status:String)
